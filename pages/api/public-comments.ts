import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  try {
    // 1. GET: Show only approved comments to the public
    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: { approved: true },
        orderBy: { created_at: 'desc' }
      })
      return res.status(200).json(comments)
    }

    // 2. POST: Allow guests or users to submit a review
    if (req.method === 'POST') {
      const { content, nickname } = req.body
      
      const newComment = await prisma.comment.create({
        data: {
          content,
          by_nickname: nickname || 'Guest',
          by_email: session?.user?.email || 'guest@example.com',
          // LOGIC: Auto-approve if they are logged in
          approved: !!session?.user?.email_confirmed_at 
        }
      })
      return res.status(201).json(newComment)
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process comment' })
  }
}
