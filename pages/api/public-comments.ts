import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

// BIGINT SERIALIZER: Prevents the JSON.stringify crash
const serialize = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Fetch comments for specific post
  if (req.method === 'GET') {
    const { pageId } = req.query;
    try {
      const comments = await prisma.comment.findMany({
        where: { 
          approved: true,
          Page: { slug: pageId as string } 
        },
        orderBy: { created_at: 'asc' } 
      });
      // Use serialize() to safely return BigInt data
      return res.status(200).json(serialize(comments));
    } catch (err) {
      return res.status(500).json({ error: "Fetch failed" });
    }
  }

  // POST: Create comment and auto-link to Page/Project
  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body;

    try {
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      if (!page) {
        page = await prisma.page.create({
          data: { 
            id: `pg-${Date.now()}`,
            slug: pageId,
            title: "Blogger Post",
            Project: { connect: { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' } } 
          }
        });
      }

      const newComment = await prisma.comment.create({
        data: {
          id: `cm-${Date.now()}`,
          content,
          by_nickname: nickname || 'Guest',
          parentId: parentId || null,
          Page: { connect: { id: page.id } }
        }
      });

      // Use serialize() to safely return newly created data
      return res.status(201).json(serialize(newComment));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Post failed" });
    }
  }
}
