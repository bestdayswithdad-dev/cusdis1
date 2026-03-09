import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

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

  // Capture mobile IP from Vercel headers
  const forwarded = req.headers['x-forwarded-for']
  const clientIp = typeof forwarded === 'string' 
    ? forwarded.split(',')[0] 
    : req.socket.remoteAddress

  if (req.method === 'GET') {
    const { pageId } = req.query
    if (!pageId) return res.status(400).json({ error: 'pageId is required' })
    try {
      const comments = await prisma.comment.findMany({
        where: {
          approved: true,
          projectId: PROJECT_ID, // Changed to camelCase
          OR: [{ pageId: String(pageId) }, { Page: { slug: String(pageId) } }] // Changed to camelCase
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

    const supabase = createPagesServerClient({ req, res })
    const { data: { user } } = await supabase.auth.getUser()

    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'
    const isHost = userEmail === 'bestdayswithdad@gmail.com'

    const displayName = isHost ? "Host" : (nickname
      || user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || user?.email?.split('@')[0]
      || 'Guest')

    try {
      // Find or Create Page using findFirst (No unique constraint on slug)
      let page = await prisma.page.findFirst({ where: { slug: pageId } })
      if (!page) {
        page = await prisma.page.create({
          data: {
            id: crypto.randomUUID(),
            slug: pageId,
            title: pageId.split('/').pop()?.split('-').join(' ') ?? 'New Post', // Auto-generate title
            projectId: PROJECT_ID
          }
        })
      }

      // Create Comment with captured mobile IP and Verified Reader info
      const newComment = await prisma.comment.create({
        data: {
          id: crypto.randomUUID(),
          content,
          by_nickname: displayName,
          by_email: userEmail,
          ip: clientIp || '0.0.0.0', // This saves the IP for your dashboard
          approved: isVerified || isHost, // Verified Readers skip moderation
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
