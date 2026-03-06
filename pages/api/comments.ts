import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// BIGINT PATCH: Fixes the "Do not know how to serialize a BigInt" error
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // SECURITY: Only you (the admin) can access this bridge
  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  try {
    // ACTION: Fetch all reviews
    if (req.method === 'GET') {
      const data = await prisma.comment.findMany({
        orderBy: { created_at: 'desc' },
        include: { Page: true } // Singular 'Page' per compiler feedback
      })
      return res.status(200).json({ comments: data })
    }

    // ACTION: Approve a specific review
    if (req.method === 'PATCH') {
      const updated = await prisma.comment.update({
        where: { id: id as string }, // Passed as string to fix Type Error
        data: { approved: true }
      })
      return res.status(200).json(updated)
    }

    // ACTION: Permanently delete a review
    if (req.method === 'DELETE') {
      await prisma.comment.delete({
        where: { id: id as string }
      })
      return res.status(204).end()
    }

    return res.status(405).end() // Method Not Allowed
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Database action failed' })
  } finally {
    await prisma.$disconnect()
  }
}
