import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

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

  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body

    try {
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      if (!page) {
        // Create Page with manual ID
        page = await prisma.page.create({
          data: { 
            id: `pg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug: pageId,
            title: "Blogger Post",
            Project: { connect: { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' } } 
          }
        });
      }

      // 3. Create the comment with a manual ID
      const newComment = await prisma.comment.create({
        data: {
          id: `cm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Added manual ID
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
