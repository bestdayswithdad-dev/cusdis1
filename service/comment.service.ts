import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// FIX 1: Combined the markdown declarations into one object to avoid SyntaxErrors
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

  async addCommentAsModerator(parentId: string, content: string, options?: { owner?: { id: string } }) {
  const parent = await prisma.comment.findUnique({ where: { id: parentId } });
  if (!parent) throw new Error("Parent not found");

  return await prisma.comment.create({ 
    data: {
      content,
      page: { connect: { id: parent.pageId } },
      parent: { connect: { id: parentId } },
      approved: true,
      // If options.owner.id exists, connect to that User record
      // Otherwise, we leave it null (or you can't use 'admin' unless 'admin' is a valid User UUID)
      moderator: options?.owner?.id ? { connect: { id: options.owner.id } } : undefined,
      by_nickname: "Moderator" // Ensure this is included as it is required in your schema
    }
  });
}
  // FIX 2: Added the 3rd 'options' argument and fixed the query logic
  async getComments(pageIdOrSlug: string, timezoneOffset: number, options: any) {
    // We first check if the page exists using the slug (since the API usually sends the slug)
    const page = await prisma.page.findFirst({
      where: { 
        OR: [
          { id: pageIdOrSlug },
          { slug: pageIdOrSlug }
        ]
      }
    });

    if (!page) return { data: [], commentCount: 0, pageCount: 0, pageSize: 50 };

    const comments = await prisma.comment.findMany({ 
      where: { 
        pageId: page.id, 
        approved: options.approved ?? true, 
        parentId: options.parentId ?? null 
      }, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        replies: { 
          where: { approved: true },
          orderBy: { createdAt: 'asc' } 
        } 
      } 
    });

    return { 
      data: comments, 
      commentCount: comments.length, 
      pageCount: 1, 
      pageSize: 50 
    };
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
        moderatorId: options?.owner?.id || 'admin'
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
    console.log('Notification triggered for:', email);
    return true;
  }
}
