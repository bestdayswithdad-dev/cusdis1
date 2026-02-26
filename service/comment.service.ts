import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export interface CommentWrapper {
  id?: string
  content?: string
  by_nickname?: string
  by_email?: string
  createdAt?: Date
  replies?: CommentWrapper[]
  commentCount?: number
  data?: CommentWrapper[]
  pageCount?: number
  pageSize?: number
}

export class CommentService {
  constructor(private req: any) {}

  async addComment(projectId: string, pageSlug: string, body: { content: string, email: string, nickname: string, pageUrl?: string, pageTitle?: string }, parentId?: string) {
    const page = await prisma.page.upsert({ where: { slug_projectId: { slug: pageSlug, projectId } }, create: { slug: pageSlug, projectId, title: body.pageTitle, url: body.pageUrl }, update: { title: body.pageTitle, url: body.pageUrl } });
    let shouldAutoApprove = false;
    try {
      const existingUser = await prisma.user.findFirst({ where: { email: body.email, emailVerified: { not: null } } });
      if (existingUser) shouldAutoApprove = true;
    } catch (e) { console.error('Auto-approve check failed:', e); }
    return await prisma.comment.create({ data: { content: body.content, by_email: body.email, by_nickname: body.nickname, pageId: page.id, parentId: parentId, approved: shouldAutoApprove } });
  }

  async getComments(pageId: string, timezoneOffset: number, options: any) {
    const comments = await prisma.comment.findMany({ where: { pageId, approved: true, parentId: null }, orderBy: { createdAt: 'desc' }, include: { replies: { where: { approved: true } } } });
    return { data: comments, commentCount: comments.length, pageCount: 1, pageSize: 50 };
  }

  async addCommentAsModerator(parentId: string, content: string, options?: any) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    return await prisma.comment.create({ data: { content, pageId: parent.pageId, parentId: parentId, approved: true, moderatorId: options?.owner?.id || 'admin' } });
  }

  async getProject(commentId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { page: true } });
    return await prisma.project.findUnique({ where: { id: comment.page.projectId } });
  }

  async approve(id: string) {
    return await prisma.comment.update({ where: { id }, data: { approved: true } });
  }

  async delete(id: string) {
    return await prisma.comment.delete({ where: { id } });
  }
}
