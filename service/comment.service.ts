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
  // 1. Log what we are receiving to Vercel for easier debugging
  console.log("Cusdis Request: Fetching comments for ID/Slug:", pageIdOrSlug);

  // 2. We search for the page using a broader OR condition.
  // This checks the ID, the Slug, and the URL columns simultaneously.
  const page = await prisma.page.findFirst({
    where: { 
      OR: [
        { id: pageIdOrSlug }, 
        { slug: pageIdOrSlug },
        { url: pageIdOrSlug }
      ],
      // Ensure the page belongs to your specific project
      projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' 
    }
  });

  if (!page) {
    console.log("Cusdis Error: No page found for identifier:", pageIdOrSlug);
    return { data: [], commentCount: 0, pageCount: 0, pageSize: 50 };
  }

  // 3. Fetch comments
  // For debugging, you can temporarily comment out 'approved: true' 
  // to see if the comments exist but are just unapproved.
  const comments = await prisma.comment.findMany({ 
    where: { 
      pageId: page.id,
      parentId: null,
      deletedAt: null, 
      approved: true  // This matches your @default(false) in schema
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
