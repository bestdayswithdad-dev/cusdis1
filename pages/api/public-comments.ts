import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Fetch comments for a specific page
  if (req.method === 'GET') {
    const { pageId } = req.query;
    const comments = await prisma.comment.findMany({
      where: { 
        approved: true,
        Page: { slug: pageId as string }
      },
      orderBy: { created_at: 'asc' } 
    })
    return res.status(200).json(comments)
  }

  // POST: Create comment and auto-create Page if missing
  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body

    try {
      // 1. Check if the page exists
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      // 2. If no page, create it with your specific Project ID
      if (!page) {
        const generatedId = Date.now().toString(); 
        page = await prisma.page.create({
          data: { 
            id: generatedId,
            slug: pageId,
            title: "Blogger Post",
            // Link to your verified Project ID
            Project: { connect: { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' } } 
          }
        });
      }

      // 3. Create the comment linked to the Page
      const newComment = await prisma.comment.create({
        data: {
          content,
          by_nickname: nickname || 'Guest',
          parentId: parentId || null,
          Page: { connect: { id: page.id } }
        }
      })

      return res.status(201).json(newComment)
    } catch (error) {
      console.error("Database Error:", error);
      return res.status(500).json({ error: "Failed to create comment" });
    } finally {
      await prisma.$disconnect();
    }
  }
}
