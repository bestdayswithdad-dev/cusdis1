import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const markdown = {
  render: (content: string) => content
};

export interface CommentWrapper {
  id?: string
  content?: string
  by_nickname?: string
  by_email?: string
  approved?: boolean
  createdAt?: Date
  parsedCreatedAt?: string
  page?: { slug: string; url: string }
  replies?: CommentWrapper[]
  commentCount?: number
  data?: CommentWrapper[]
  pageCount?: number
  pageSize?: number
}

export type CommentItem = CommentWrapper 

export class CommentService {
  constructor(private req: any) {}

  async addComment(
    projectId: string, 
    pageSlug: string, 
    body: { content: string, email: string, nickname: string, pageUrl?: string, pageTitle?: string }, 
    parentId?: string
  ) {
    let page = await prisma.page.findFirst({
      where: { slug: pageSlug, projectId: projectId }
    });

    if (!page) {
      page = await prisma.page.create({
        data: { slug: pageSlug, projectId, title: body.pageTitle, url: body.pageUrl }
      });
    }

    // Force approved to true so comments show up immediately for your testing
    return await prisma.comment.create({ 
      data: { 
        content: body.content, 
        by_email: body.email, 
        by_nickname: body.nickname, 
        page: { connect: { id: page.id } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        approved: true 
      } 
    });
  }

  async getComments(pageIdOrSlug: string, timezoneOffset: number, options: any) {
    // 1. Find the page record first
    const page = await prisma.page.findFirst({
      where: { 
        OR: [{ id: pageIdOrSlug }, { slug: pageIdOrSlug }]
      }
    });

    if (!page) return { data: [], commentCount: 0, pageCount: 0, pageSize: 50 };

    // 2. Fetch comments that are NOT deleted
    const comments = await prisma.comment.findMany({ 
      where: { 
        pageId: page.id,
        parentId: null,
        deletedAt: null, // ONLY show comments that haven't been deleted
        approved: true   // Your DB shows they are TRUE, so we can keep this
      }, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        replies: {
          where: { deletedAt: null, approved: true }
        },
        page: true 
      } 
    });
    
    return { 
      data: comments, 
      commentCount: comments.length, 
      pageCount: 1, 
      pageSize: 50 
    };
  }

  // Restored getProject to fix the build error
  async getProject(commentId: string) {
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId }, 
      include: { page: true } 
    });
    if (!comment) return null;
    return await prisma.project.findUnique({ 
      where: { id: comment.page.projectId } 
    });
  }

  async addCommentAsModerator(parentId: string, content: string, options?: { owner?: { id: string } }) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error("Parent not found");

    return await prisma.comment.create({ 
      data: {
        content,
        page: { connect: { id: parent.pageId } },
        parent: { connect: { id: parentId } },
        approved: true,
        by_nickname: 'Moderator',
        moderator: options?.owner?.id ? { connect: { id: options.owner.id } } : undefined
      }
    });
  }

  async approve(id: string) {
    return await prisma.comment.update({ where: { id }, data: { approved: true } });
  }

  async deleteComment(id: string) {
    return await prisma.comment.delete({ where: { id } });
  }

  async sendConfirmReplyNotificationEmail(email: string, pageTitle: string, commentId: string) {
    return true;
  }
}
