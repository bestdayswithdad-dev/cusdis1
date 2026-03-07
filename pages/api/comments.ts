import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// BIGINT PATCH: Prevents "Do not know how to serialize a BigInt" error
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // SECURITY: Only you can access
  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  try {
    // GET: Fetch all reviews with their associated Page Titles
    if (req.method === 'GET') {
      const data = await prisma.comment.findMany({
        where: {
          projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'
        },
        orderBy: { created_at: 'desc' },
        include: { 
          Page: true // MUST be Capital 'P' to match your schema.prisma
        }
      })
      return res.status(200).json({ comments: data })
    }

    // PATCH: Approve a review
    if (req.method === 'PATCH') {
      const updated = await prisma.comment.update({
        where: { id: id as string },
        data: { approved: true }
      })
      return res.status(200).json(updated)
    }

    // DELETE: Permanently remove a review
    if (req.method === 'DELETE') {
      await prisma.comment.delete({
        where: { id: id as string }
      })
      return res.status(204).end()
    }

    return res.status(405).end()
  } catch (error) {
    console.error("Prisma Error:", error)
    return res.status(500).json({ error: 'Database action failed' })
  } finally {
    await prisma.$disconnect()
  }
}
