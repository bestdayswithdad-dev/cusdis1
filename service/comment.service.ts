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
    // 1. Find or create the page
    let page = await prisma.page.findFirst({
      where: { slug: pageSlug, projectId: projectId }
    });

    if (!page) {
      page = await prisma.page.create({
        data: { slug: pageSlug, projectId, title: body.pageTitle, url: body.pageUrl }
      });
    }

    // 2. Default everything to approved for now so you can actually see them!
    // Once you confirm it works, you can change this back to 'false'
    return await prisma.comment.create({ 
      data: { 
        content: body.content, 
        by_email: body.email, 
        by_nickname: body.nickname, 
        page: { connect: { id: page.id } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        approved: true // FORCE TRUE for testing
      } 
    });
  }

  async getComments(pageIdOrSlug: string, timezoneOffset: number, options: any) {
    // 1. Find the page record
    const page = await prisma.page.findFirst({
      where: { 
        OR: [{ id: pageIdOrSlug }, { slug: pageIdOrSlug }]
      }
    });

    if (!page) return { data: [], commentCount: 0, pageCount: 0, pageSize: 50 };

    // 2. Fetch ALL comments for this page (Ignoring approval and parentId for a moment)
    // This will prove if the data is actually there.
    const comments = await prisma.comment.findMany({ 
      where: { 
        pageId: page.id,
        // approved: true, <--- REMOVED so you can see unapproved ones
        parentId: null   // We keep this to avoid double-showing replies
      }, 
      orderBy: { createdAt: 'desc' }, 
      include: { 
        replies: true // Include all replies regardless of approval
      } 
    });
    
    return { data: comments, commentCount: comments.length, pageCount: 1, pageSize: 50 };
  }

  // ... (addCommentAsModerator and other methods remain the same)
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
}
