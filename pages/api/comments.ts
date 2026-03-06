import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () { return this.toString() }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query // For targeting specific comments

  try {
    if (req.method === 'GET') {
      const data = await prisma.comment.findMany({
        orderBy: { created_at: 'desc' },
        include: { Page: true }
      })
      return res.status(200).json({ comments: data })
    }

 if (req.method === 'PATCH') {
      // APPROVE: Fixed naming to satisfy the type-checker
      const updated = await prisma.comment.update({
        where: { id: id as string }, 
        data: { approved: true }
      })
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      // DELETE: Fixed naming to satisfy the type-checker
      await prisma.comment.delete({
        where: { id: id as string }
      })
      return res.status(204).end()
    }
  } catch (error) {
    return res.status(500).json({ error: 'Action failed' })
  } finally {
    await prisma.$disconnect()
  }
}
