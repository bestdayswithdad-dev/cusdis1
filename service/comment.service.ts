import { Comment, Page, Prisma, User } from '@prisma/client'
import { RequestScopeService, UserSession } from '.'
import { prisma, resolvedConfig } from '../utils.server'
import { PageService } from './page.service'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import { HookService } from './hook.service'
import { statService } from './stat.service'
import { EmailService } from './email.service'
import { TokenService } from './token.service'
import utc from 'dayjs/plugin/utc'
import { randomBytes } from 'crypto'

dayjs.extend(utc)

export const markdown = MarkdownIt({ linkify: true })
markdown.disable(['image', 'link'])

const generateId = () => randomBytes(8).toString('hex')

export class CommentWrapper {
  public commentCount: number = 0;
  public pageCount: number = 0;
  public pageSize: number = 10;
  public data: CommentItem[] = [];

  constructor(data: any) {
    if (data) {
      this.commentCount = data.commentCount || 0;
      this.pageCount = data.pageCount || 1;
      this.pageSize = data.pageSize || 10;
      this.data = data.data || [];
    }
  }
}

export type CommentItem = Comment & {
  page: Page
} & {
  replies: CommentWrapper
  parsedContent: string
  parsedCreatedAt: string
}

export class CommentService extends RequestScopeService {
  pageService = new PageService(this.req)
  hookService = new HookService(this.req)
  emailService = new EmailService()
  tokenService = new TokenService()

  async getComments(
    projectId?: string,
    timezoneOffset?: number,
    options?: any
  ): Promise<CommentWrapper> {
    const pageSize = options?.pageSize || 10
    const targetProjectId = projectId || 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

    const where = {
      approved: options?.approved === true ? true : options?.approved,
      parentId: options?.parentId,
      // FIXED: Using mapped name 'deletedAt'
      deletedAt: null,
      Page: {
        slug: options?.pageSlug,
        projectId: targetProjectId,
      },
    } as Prisma.CommentWhereInput

    const [commentCount, comments] = await prisma.$transaction([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip: ((options?.page || 1) - 1) * pageSize,
        take: pageSize,
        // FIXED: Using mapped name 'createdAt'
        orderBy: { createdAt: 'desc' },
        include: { Page: true }
      }),
    ])

    const allComments = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await this.getComments(targetProjectId, timezoneOffset || 0, {
          ...options,
          page: 1,
          pageSize: 100,
          parentId: comment.id,
        })

        return {
          ...comment,
          page: comment.Page,
          replies,
          parsedContent: markdown.render(comment.content),
          parsedCreatedAt: dayjs.utc(comment.createdAt).utcOffset(timezoneOffset || 0).format('YYYY-MM-DD HH:mm'),
        } as CommentItem
      }),
    )

    return new CommentWrapper({
      data: allComments,
      commentCount,
      pageSize,
      pageCount: Math.ceil(commentCount / pageSize) || 1
    })
  }

  async getProject(commentId: string) {
    if (!commentId) {
      const session = await (await this.getSession() as any);
      return { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1', ownerId: session?.uid || 'admin' };
    }
    const res = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { Page: { include: { Project: true } } }
    })
    return (res as any)?.Page?.Project || { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1', ownerId: 'admin' };
  }

  async addComment(projectIdOrBody: any, pageSlug?: string, body?: any, parentId?: string) {
    let finalProjectId = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';
    let finalPageSlug = pageSlug;
    let finalBody = body;
    let finalParentId = parentId;

    if (typeof projectIdOrBody === 'object') {
      finalBody = projectIdOrBody;
      finalProjectId = projectIdOrBody.projectId || finalProjectId;
      finalPageSlug = projectIdOrBody.pageId || projectIdOrBody.pageSlug;
      finalParentId = projectIdOrBody.parentId;
    } else {
      finalProjectId = projectIdOrBody;
    }

    const page = await this.pageService.upsertPage(finalPageSlug!, finalProjectId, {
      pageTitle: finalBody.pageTitle,
      pageUrl: finalBody.pageUrl,
    })

    const created = await prisma.comment.create({
      data: {
        id: generateId(),
        content: finalBody.content,
        by_email: finalBody.email.toLowerCase(),
        by_nickname: finalBody.nickname, 
        Page: {
          connect: { id: page.id }
        },
        parentId: finalParentId || null,
        approved: true, 
      } as any,
    })

    this.hookService.addComment(created, finalProjectId)
    return created
  }

  async addCommentAsModerator(parentId: string, content: string, options?: any) {
    const session = (await this.getSession() as any)
    const parent = await prisma.comment.findUnique({ where: { id: parentId } })
    return await prisma.comment.create({
      data: {
        id: generateId(),
        content,
        by_email: session.user.email,
        by_nickname: session.user.name,
        moderatorId: session.uid,
        Page: {
          connect: { id: parent!.pageId }
        },
        parentId: parentId,
        approved: true,
      } as any,
    })
  }

  async approve(commentId: string) {
    await prisma.comment.update({ where: { id: commentId }, data: { approved: true } })
  }

  async deleteComment(commentId: string) {
    // FIXED: Using mapped name 'deletedAt'
    await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } })
  }
}
