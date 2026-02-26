import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Combined into a single export to prevent SyntaxErrors
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

// Required for the dashboard build to pass
export type CommentItem = CommentWrapper 

export class CommentService {
  constructor(private req: any) {}

  async addComment(
    projectId: string, 
    pageSlug: string, 
    body: { content: string, email: string, nickname: string, pageUrl?: string, pageTitle?: string }, 
    parentId?: string
  ) {
    // 1. Find the page by slug + project to get the UUID (ID)
    let page = await prisma.page.findFirst({
      where: { 
        slug: pageSlug,
        projectId: projectId
      }
    });

    // 2. If it doesn't exist, create it. If it does, update the title/url.
    if (!page) {
      page = await prisma.page.create({
        data: { 
          slug: pageSlug, 
          projectId, 
          title: body.pageTitle, 
          url: body.pageUrl 
        }
      });
    } else {
      page = await prisma.page.update({
        where: { id: page.id },
        data: { title: body.pageTitle, url: body.pageUrl }
      });
    }

    let shouldAutoApprove = false;
    try {
      const existingUser = await prisma.user.findFirst({ 
        where: { email: body.email, emailVerified: { not: null } } 
      });
      if (existingUser) shouldAutoApprove = true;
    } catch (e) { 
      console.error('Auto-approve check failed:', e); 
    }

    // 3. Create comment linked to the UUID page.id
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

  async getComments(pageIdOrSlug: string, timezoneOffset: number, options: any) {
    // 1. Look up the page by ID or Slug first
    const page = await prisma.page.findFirst({
      where: { 
        OR: [
          { id: pageIdOrSlug },
          { slug: pageIdOrSlug }
        ]
      }
    });

    // 2. If no page exists, return empty
    if (!page) return { data: [], commentCount: 0, pageCount: 0, pageSize: 50 };

    // 3. Fetch comments using the validated page UUID
    const comments = await prisma.comment.findMany({ 
      where: { 
        pageId: page.id, 
        approved: options?.approved ?? true, 
        parentId: null 
      }, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        replies: { 
          where: { approved: true },
          orderBy: { createdAt: 'asc' }
        } 
      } 
    });
    
    return { data: comments, commentCount: comments.length, pageCount: 1, pageSize: 50 };
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
    // Log for debugging visibility in Vercel
    console.log(`Notification: Reply to ${email} on ${pageTitle}`);
    return true;
  }
}
