import { PrismaClient } from '@prisma/client'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Setup Supabase to read the incoming 'credentials'
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (req.method === 'POST') {
    const { content, nickname, parentId, pageId } = req.body
    
    // 2. Piggyback: If session exists, user is Verified
    const isVerified = !!session;
    const userEmail = session?.user?.email || 'guest@example.com';

    try {
      // Find the page using findFirst
      let page = await prisma.page.findFirst({ where: { slug: pageId } });
      
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

      const comment = await prisma.comment.create({
        data: {
          id: `cm-${Date.now()}`,
          content,
          by_nickname: nickname,
          by_email: userEmail, // Now pulls your real email if logged in
          projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1',
          approved: isVerified, // AUTO-APPROVE perk
          parentId: parentId || null,
          Page: { connect: { id: page.id } }
        }
      })
      return res.status(200).json(comment)
    } catch (error) {
      return res.status(500).json({ error: 'Post failed' })
    }
  }
}
