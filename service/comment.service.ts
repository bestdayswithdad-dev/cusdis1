import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// This matches the .render() call in notification.service.ts
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

  async addComment(projectId: string, pageSlug: string, body: { content: string, email: string, nickname: string, pageUrl?: string, pageTitle?: string }, parentId?: string) {
    const page = await prisma.page.upsert({ 
      where: { slug: pageSlug, projectId } as any, 
      create: { slug: pageSlug, projectId, title: body.pageTitle, url: body.pageUrl }, 
      update: { title: body.pageTitle, url: body.pageUrl } 
    });

    let shouldAutoApprove = false;
    try {
      const existingUser = await prisma.user.findFirst({ where: { email: body.email, emailVerified: { not: null } } });
      if (existingUser) shouldAutoApprove = true;
    } catch (e) { console.error('Auto-approve check failed:', e); }

    return await prisma.comment.create({ 
      data: { 
        content: body.content, 
        by_email: body.email, 
        by_nickname: body.nickname, 
        page: { connect: { id: page.id } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        approved: shouldAutoApprove 
      } 
    });
  }

  async getComments(pageId: string, timezoneOffset: number, options: any) {
    const comments = await prisma.comment.findMany({ where: { pageId, approved: true, parentId: null }, orderBy: { createdAt: 'desc' }, include: { replies: { where: { approved: true } } } });
    return { data: comments, commentCount: comments.length, pageCount: 1, pageSize: 50 };
  }

  async addCommentAsModerator(parentId: string, content: string, options?: { owner?: { id: string } }) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error("Parent not found");

    const data: any = {
      content,
      page: { connect: { id: parent.pageId } },
      parent: { connect: { id: parentId } },
      approved: true,
      moderatorId: options?.owner?.id || 'admin'
    };

    return await prisma.comment.create({ data });
  }

  async getProject(commentId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { page: true } });
    if (!comment) return null;
    return await prisma.project.findUnique({ where: { id: comment.page.projectId } });
  }

  async approve(id: string) {
    return await prisma.comment.update({ where: { id }, data: { approved: true } });
  }

  async deleteComment(id: string) {
    return await prisma.comment.delete({ where: { id } });
  }

  async sendConfirmReplyNotificationEmail(email: string, pageTitle: string, commentId: string) {
    console.log('Notification triggered for:', email);
    return true;
  }
}
