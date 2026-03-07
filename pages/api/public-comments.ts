import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

// HELPER: Prevents JSON crashes with BigInt database values
const serialize = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Fetch approved comments for a specific page
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
      return res.status(200).json(serialize(comments));
    } catch (err) {
      return res.status(500).json({ error: "Fetch failed" });
    }
  }

  // POST: Create comment and auto-generate readable Page Title
  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body;

    try {
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      if (!page) {
        // Create a readable title from the URL (e.g., 'plaster-fun-house' -> 'Plaster Fun House')
        const urlParts = pageId.split('/');
        const fileName = urlParts[urlParts.length - 1].replace('.html', '');
        const readableTitle = fileName.split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        page = await prisma.page.create({
          data: { 
            id: `pg-${Date.now()}`,
            slug: pageId,
            title: readableTitle || "New Blog Post",
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

      return res.status(201).json(serialize(newComment));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Post failed" });
    }
  }
}
