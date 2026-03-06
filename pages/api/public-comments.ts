import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// BIGINT PATCH: Fixes JSON serialization for PostgreSQL BigInt columns
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  try {
    // 1. GET: Fetch approved comments for the public website
    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: { approved: true },
        orderBy: { created_at: 'desc' }
      })
      return res.status(200).json(comments)
    }

    // 2. POST: Handle new comment submissions
    if (req.method === 'POST') {
      const { content, nickname } = req.body

      // Find a valid Page to link the comment to
      const defaultPage = await prisma.page.findFirst()
      
      if (!defaultPage) {
        return res.status(400).json({ error: 'No page found to link comment' })
      }

      const newComment = await prisma.comment.create({
        data: {
          // Fix: Manually generate the required ID
          id: BigInt(Date.now()), 
          content,
          by_nickname: nickname || 'Guest',
          by_email: session?.user?.email || 'guest@example.com',
          // Auto-approve if the user is authenticated
          approved: !!session?.user?.email_confirmed_at,
          // Mandatory connection to the Page model
          Page: {
            connect: { id: defaultPage.id }
          }
        }
      })
      return res.status(201).json(newComment)
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to process comment' })
  } finally {
    await prisma.$disconnect()
  }
}
