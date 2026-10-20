import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// Prisma global singleton to prevent exhausting Supabase connection pool
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ALLOWED_ORIGINS = [
  'https://www.bestdayswithdad.com.au',
  'https://bestdayswithdad.com.au',
  'https://www.bestdayswithdad.com',
  'https://bestdayswithdad.com'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com.au')
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // SECURE CHECK: Only let Adam do this
    const supabase = createPagesServerClient({ req, res })
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session || session.user?.email !== 'bestdayswithdad@gmail.com') {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const { commentId } = req.body

    if (!commentId) {
      return res.status(400).json({ error: 'commentId is required' })
    }

    // Support both string IDs and numeric/BigInt IDs
    const targetId = typeof commentId === 'number' ? commentId : String(commentId)

    // Delete target comment and its direct replies
    // (Using comments/comment delegate based on Prisma schema)
    const commentDelegate = (prisma as any).comments || (prisma as any).comment

    await commentDelegate.deleteMany({
      where: {
        OR: [
          { id: targetId },
          { parentId: targetId }
        ]
      }
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Delete comment error:', error)
    return res.status(500).json({ error: 'Delete failed' })
  }
}
