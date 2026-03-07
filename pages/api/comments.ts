import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// 1. CRITICAL: BigInt serialization patch
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

const serialize = (data: any) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const data = await prisma.comment.findMany({
        where: {
          // Verify this matches your 'projectId' or 'project_id' in schema
          projectId: 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'
        },
        orderBy: { created_at: 'desc' },
        include: { 
          Page: true // MUST match the capitalized 'Page' relation in your schema
        }
      })
      
      // If data is empty, Prisma might be looking for the wrong projectId
      return res.status(200).json({ comments: serialize(data) })
    }

    if (req.method === 'PATCH') {
      const updated = await prisma.comment.update({
        where: { id: id as string },
        data: { approved: true }
      })
      return res.status(200).json(serialize(updated))
    }

    if (req.method === 'DELETE') {
      await prisma.comment.delete({
        where: { id: id as string }
      })
      return res.status(204).end()
    }
  } catch (error) {
    console.error("Prisma Error:", error)
    return res.status(500).json({ error: 'Database connection failed' })
  } finally {
    await prisma.$disconnect()
  }
}
