import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // SECURE CHECK: Only let "Adam" do this
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user?.email !== 'bestdayswithdad@gmail.com') {
    return res.status(403).json({ error: 'Not authorized' })
  }

  const { commentId } = req.body

  try {
    // Delete the comment and all its children recursively
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId }
        ]
      }
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: 'Delete failed' })
  } finally {
    await prisma.$disconnect()
  }
}
