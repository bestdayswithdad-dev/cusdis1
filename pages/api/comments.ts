import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Guard: Only you can pull this data
  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const data = await prisma.comment.findMany({
      orderBy: { created_at: 'desc' },
      include: { 
        pages: true // Pluralized to match your Supabase tables
      }
    })
    return res.status(200).json({ comments: data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Database connection failed' })
  } finally {
    await prisma.$disconnect()
  }
}
