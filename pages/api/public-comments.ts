import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// BIGINT PATCH: Ensures JSON can handle BigInt data
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  try {
    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: { approved: true },
        orderBy: { created_at: 'desc' }
      })
      return res.status(200).json(comments)
    }

    if (req.method === 'POST') {
      const { content, nickname } = req.body
      const defaultPage = await prisma.page.findFirst()
      
      if (!defaultPage) {
        return res.status(400).json({ error: 'No page found' })
      }

      const newComment = await prisma.comment.create({
        data: {
          // FIX: Convert the BigInt to a string to match the Type definition
          id: Date.now().toString(), 
          content,
          by_nickname: nickname || 'Guest',
          by_email: session?.user?.email || 'guest@example.com',
          approved: !!session?.user?.email_confirmed_at,
          Page: {
            connect: { id: defaultPage.id }
          }
        }
      })
      return res.status(201).json(newComment)
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Process failed' })
  } finally {
    await prisma.$disconnect()
  }
}
