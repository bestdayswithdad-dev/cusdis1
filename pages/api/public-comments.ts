import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  try {
    if (req.method === 'GET') {
      const comments = await prisma.comment.findMany({
        where: { approved: true },
        orderBy: { created_at: 'asc' } // Changed to ASC so threads read naturally
      })
      return res.status(200).json(comments)
    }

    if (req.method === 'POST') {
      const { content, nickname, parentId } = req.body
      const defaultPage = await prisma.page.findFirst()
      
      if (!defaultPage) return res.status(400).json({ error: 'No page found' })

      const newComment = await prisma.comment.create({
        data: {
          id: Date.now().toString(), 
          content,
          by_nickname: nickname || 'Guest',
          by_email: session?.user?.email || 'guest@example.com',
          approved: !!session?.user?.email_confirmed_at,
          parent_id: parentId || null, // Saves the connection to the parent bubble
          Page: { connect: { id: defaultPage.id } }
        }
      })
      return res.status(201).json(newComment)
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Database process failed' })
  } finally {
    await prisma.$disconnect()
  }
}
