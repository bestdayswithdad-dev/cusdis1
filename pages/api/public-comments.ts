import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// Singleton — prevents connection pool exhaustion on Vercel serverless
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

// Safely serializes BigInt without mutating global prototypes
const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    const { pageId } = req.query
    if (!pageId) return res.status(400).json({ error: 'pageId is required' })
    try {
      const comments = await prisma.comment.findMany({
        where: {
          approved: true,
          projectId: PROJECT_ID,
          OR: [{ pageId: String(pageId) }, { Page: { slug: String(pageId) } }]
        },
        orderBy: { created_at: 'asc' }
      })
      return res.status(200).json(serialize(comments))
    } catch (err) {
      console.error('[GET /comments]', err)
      return res.status(500).json({ error: 'Fetch failed' })
    }
  }

  if (req.method === 'POST') {
    const { content, nickname, pageId } = req.body
    if (!content || !pageId) {
      return res.status(400).json({ error: 'content and pageId are required' })
    }

    // getUser() validates JWT server-side via Authorization header
    // Blogger must pass: Authorization: Bearer <supabase_access_token>
    const supabase = createPagesServerClient({ req, res })
    const { data: { user } } = await supabase.auth.getUser()

    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'

    // Derive a sensible display name from auth metadata if no nickname provided
    const displayName = nickname
      || user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || user?.email?.split('@')[0]
      || 'Guest'

    try {
      let page = await prisma.page.findFirst({ where: { slug: pageId } })
      if (!page) {
        page = await prisma.page.create({
          data: {
            id: crypto.randomUUID(),
            slug: pageId,
            title: pageId.split('/').pop()?.split('-').join(' ') ?? 'New Post',
            projectId: PROJECT_ID
          }
        })
      }

      const newComment = await prisma.comment.create({
        data: {
          id: crypto.randomUUID(),
          content,
          by_nickname: displayName,
          by_email: userEmail,
          approved: isVerified,   // signed-in users skip moderation
          projectId: PROJECT_ID,
          Page: { connect: { id: page.id } }
        }
      })
      return res.status(201).json(serialize(newComment))
    } catch (error) {
      console.error('[POST /comments]', error)
      return res.status(500).json({ error: 'Post failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
