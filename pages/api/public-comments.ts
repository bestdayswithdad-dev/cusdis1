import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Setup for your specific domain
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Fetch approved comments for a specific page URL
  if (req.method === 'GET') {
    const { pageId } = req.query;

    const comments = await prisma.comment.findMany({
      where: { 
        approved: true,
        Page: {
          slug: pageId as string
        }
      },
      orderBy: { created_at: 'asc' } 
    })
    return res.status(200).json(comments)
  }

  // POST: Create a new comment linked to a specific page
  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body

    try {
      // 1. Check if the page already exists in the database
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      // 2. If the page doesn't exist, create it manually
      if (!page) {
        page = await prisma.page.create({
          data: { 
            slug: pageId,
            title: "Blogger Post" 
          }
        });
      }

      // 3. Create the comment and connect it to the Page ID
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
      console.error("Request error", error);
      return res.status(500).json({ error: "Error creating comment" });
    } finally {
      await prisma.$disconnect();
    }
  }
}
