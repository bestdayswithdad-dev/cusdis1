import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { pageId } = req.query; // Get URL from query

    const comments = await prisma.comment.findMany({
      where: { 
        approved: true,
        Page: {
          slug: pageId as string // Only fetch comments for this URL
        }
      },
      orderBy: { created_at: 'asc' } 
    })
    return res.status(200).json(comments)
  }

  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body
    
    // Ensure the page exists in our DB, or create it
    const page = await prisma.page.upsert({
      where: { slug: pageId },
      update: {},
      create: { 
        slug: pageId,
        title: "Blogger Post" 
      }
    })

    const newComment = await prisma.comment.create({
      data: {
        content,
        by_nickname: nickname || 'Guest',
        parentId: parentId || null,
        Page: { connect: { id: page.id } }
      }
    })
    return res.status(201).json(newComment)
  }
}
