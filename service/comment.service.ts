import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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

  async addCommentAsModerator(parentId: string, content: string) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    return await prisma.comment.create({ data: { content, pageId: parent.pageId, parentId: parentId, approved: true, moderatorId: 'admin' } });
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
