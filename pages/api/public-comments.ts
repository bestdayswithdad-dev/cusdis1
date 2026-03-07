import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// HELPER: Essential for Supabase BigInt columns
const serialize = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Headers - Must allow credentials for cookies to pass
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true'); 

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Fetch comments using normalized URL logic
  if (req.method === 'GET') {
    const { pageId } = req.query;
    try {
      const comments = await prisma.comment.findMany({
        where: { 
          approved: true,
          projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1',
          OR: [
            { pageId: String(pageId) },
            { Page: { slug: String(pageId) } }
          ]
        },
        orderBy: { created_at: 'asc' } 
      });
      return res.status(200).json(serialize(comments));
    } catch (err) {
      return res.status(500).json({ error: "Fetch failed" });
    }
  }

  // POST: Create comment with Session Detection
  if (req.method === 'POST') {
    const supabase = createPagesServerClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    const { content, nickname, parentId, pageId } = req.body;
    
    // PERK: If session exists, user is Verified
    const isVerified = !!session;
    const userEmail = session?.user?.email || 'guest@example.com';

    try {
      // 1. Find or create the page using findFirst
      let page = await prisma.page.findFirst({
        where: { slug: pageId }
      });

      if (!page) {
        page = await prisma.page.create({
          data: { 
            id: `pg-${Date.now()}`,
            slug: pageId,
            title: pageId.split('/').pop()?.replace('.html', '').split('-').join(' ') || "New Post",
            Project: { connect: { id: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1' } } 
          }
        });
      }

      // 2. Create the comment
      const newComment = await prisma.comment.create({
        data: {
          id: `cm-${Date.now()}`,
          content,
          by_nickname: nickname || (isVerified ? 'Adam' : 'Guest'),
          by_email: userEmail, // Pulls adambrokensha@gmail.com from session
          approved: isVerified, // AUTO-POST: true if session is detected
          projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1',
          parentId: parentId || null,
          Page: { connect: { id: page.id } }
        }
      });

      return res.status(201).json(serialize(newComment));
    } catch (error) {
      console.error("Post Error:", error);
      return res.status(500).json({ error: "Post failed" });
    }
  }
}
