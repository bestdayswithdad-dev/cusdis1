import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const prisma = new PrismaClient()

// BIGINT PATCH: Allows JSON to handle large database numbers
(BigInt.prototype as any).toJSON = function () {
  return this.toString()
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
        // We use 'Page' because the compiler confirmed the singular model name
        Page: true 
      }
    })

    // The BigInt patch above ensures JSON.stringify works here
    return res.status(200).json({ comments: data })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Database serialization failed' })
  } finally {
    await prisma.$disconnect()
  }
}
