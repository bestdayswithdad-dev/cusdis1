import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// Prisma global singleton to prevent exhausting Supabase connection pool
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper: Reliably serialize BigInt to String for JSON responses
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) return data
  if (typeof data === 'bigint') return data.toString()
  if (Array.isArray(data)) return data.map(serializeBigInt)
  if (typeof data === 'object') {
    const res: Record<string, any> = {}
    for (const key of Object.keys(data)) {
      res[key] = serializeBigInt(data[key])
    }
    return res
  }
  return data
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // SECURITY: Only you (the admin) can access this bridge
  try {
    const supabase = createPagesServerClient({ req, res })
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session || session.user?.email !== 'bestdayswithdad@gmail.com') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  } catch (authErr) {
    console.error('Session verification error:', authErr)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  const commentDelegate = (prisma as any).comment || (prisma as any).comments

  try {
    // ACTION: Fetch all reviews
    if (req.method === 'GET') {
      const data = await commentDelegate.findMany({
        orderBy: { created_at: 'desc' },
        include: { Page: true } // Singular 'Page' per compiler feedback
      })
      return res.status(200).json(serializeBigInt({ comments: data }))
    }

    // ACTION: Approve a specific review
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json({ error: 'Missing comment id' })
      }

      const updated = await commentDelegate.update({
        where: { id: id as string },
        data: { approved: true }
      })
      return res.status(200).json(serializeBigInt(updated))
    }

    // ACTION: Permanently delete a review
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Missing comment id' })
      }

      await commentDelegate.delete({
        where: { id: id as string }
      })
      return res.status(204).end()
    }

    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE', 'OPTIONS'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (error) {
    console.error('Database action failed:', error)
    return res.status(500).json({ error: 'Database action failed' })
  }
}
