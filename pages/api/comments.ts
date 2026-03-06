import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// This version is standard for Next.js API routes
const prisma = new PrismaClient()

// BIGINT PATCH: Allows JSON to handle large database numbers
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session || session.user.email !== 'bestdayswithdad@gmail.com') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const data = await prisma.comment.findMany({
      orderBy: { created_at: 'desc' },
      include: { 
        Page: true // Using 'Page' based on previous compiler feedback
      }
    })

    return res.status(200).json({ comments: data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Database connection failed' })
  } finally {
    // Optional: In serverless, we don't always disconnect, but it's safe for now
    await prisma.$disconnect()
  }
}
