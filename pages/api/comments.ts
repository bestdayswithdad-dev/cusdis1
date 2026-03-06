import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Verify you are actually logged in as the Admin
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Fetch the reviews from your Prisma schema
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { created_at: 'desc' },
      include: { page: true } // This grabs the URL of where the comment was left
    })

    return res.status(200).json({ comments })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reviews' })
  } finally {
    await prisma.$disconnect()
  }
}
