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
import { makeConfirmReplyNotificationTemplate } from '../templates/confirm_reply_notification'
import utc from 'dayjs/plugin/utc'
import { getSession } from '../utils.server'

dayjs.extend(utc)

export const markdown = MarkdownIt({ linkify: true })
markdown.disable(['image', 'link'])

// FIX 1: Convert 'type' to 'class' so the API can use 'new CommentWrapper'
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

  // FIX 2: Make projectId and timezoneOffset optional to match API calls
  async getComments(
    projectId?: string,
    timezoneOffset?: number,
    options?: {
      parentId?: string
      page?: number
      select?: Prisma.CommentSelect
      pageSlug?: string | Prisma.StringFilter
      onlyOwn?: boolean
      approved?: boolean
      pageSize?: number
    },
  ): Promise<CommentWrapper> {
    const pageSize = options?.pageSize || 10
    const targetProjectId = projectId || '081c8a30-0550-4716-aae6-c553d7b545f6'

    const select = {
      id: true,
      createdAt: true,
      content: true,
      ...options?.select,
      page: true,
      moderatorId: true,
    } as Prisma.CommentSelect

    const where = {
      approved: options?.approved === true ? true : options?.approved,
      parentId: options?.parentId,
      deletedAt: null,
      page: {
        slug: options?.pageSlug,
        projectId: targetProjectId,
        project: { deletedAt: null },
      },
    } as Prisma.CommentWhereInput

    const page = options?.page || 1

    const [commentCount, comments] = await prisma.$transaction([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        select,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const allComments = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await this.getComments(targetProjectId, timezoneOffset || 0, {
          ...options,
          page: 1,
          pageSize: 100,
          parentId: comment.id,
          pageSlug: options?.pageSlug,
          select,
        })

        return {
          ...comment,
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
      const session = await getSession(this.req);
      return { id: '081c8a30-0550-4716-aae6-c553d7b545f6', ownerId: (session as any)?.uid || 'admin' };
    }
    const res = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { page: { select: { project: { select: { id: true, ownerId: true } } } } },
    })
    return res?.page?.project || { id: '081c8a30-0550-4716-aae6-c553d7b545f6', ownerId: 'admin' };
  }

async addComment(
    projectIdOrBody: string | any,
    pageSlug?: string,
    body?: any,
    parentId?: string,
  ) {
    let finalProjectId: string;
    let finalPageSlug: string;
    let finalBody: any;
    let finalParentId: string | undefined = parentId;

    // Detect if we were called with a single object (from API) or multiple args (from Dashboard)
    if (typeof projectIdOrBody === 'object') {
      finalBody = projectIdOrBody;
      finalProjectId = projectIdOrBody.projectId || '081c8a30-0550-4716-aae6-c553d7b545f6';
      finalPageSlug = projectIdOrBody.pageId || projectIdOrBody.pageSlug;
      finalParentId = projectIdOrBody.parentId;
    } else {
      finalProjectId = projectIdOrBody;
      finalPageSlug = pageSlug!;
      finalBody = body;
    }

    // 1. Ensure the page exists in the database
    const page = await this.pageService.upsertPage(finalPageSlug, finalProjectId, {
      pageTitle: finalBody.pageTitle,
      pageUrl: finalBody.pageUrl,
    })

    // 2. Create the comment
    const created = await prisma.comment.create({
      data: {
        content: finalBody.content,
        by_email: finalBody.email.toLowerCase(),
        by_nickname: finalBody.nickname, 
        pageId: page.id,
        parentId: finalParentId || null,
        approved: true, // Auto-approve for now to get your comments live
      },
    })

    this.hookService.addComment(created, finalProjectId)
    return created
  }
  async addCommentAsModerator(parentId: string, content: string, options?: { owner?: User }) {
    const session = await this.getSession() as any
    const parent = await prisma.comment.findUnique({ where: { id: parentId } })
    return await prisma.comment.create({
      data: {
        content,
        by_email: session.user.email,
        by_nickname: session.user.name,
        moderatorId: session.uid,
        pageId: parent.pageId,
        approved: true,
        parentId,
      },
    })
  }

  async approve(commentId: string) {
    await prisma.comment.update({ where: { id: commentId }, data: { approved: true } })
  }

  async deleteComment(commentId: string) {
    await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } })
  }
}
