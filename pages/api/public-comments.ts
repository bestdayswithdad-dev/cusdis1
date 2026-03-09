import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

// Prisma instance management to prevent multiple connections in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

// MANDATORY SERIALIZER: Converts BigInt IDs to Strings for JSON safety
const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS configuration for Blogger integration
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Capture mobile IP from Vercel headers for your dashboard
  const forwarded = req.headers['x-forwarded-for']
  const clientIp = typeof forwarded === 'string' 
    ? forwarded.split(',')[0] 
    : req.socket.remoteAddress

  // --- GET LOGIC: Fetch approved comments for a specific page ---
  if (req.method === 'GET') {
    const { pageId } = req.query
    if (!pageId) return res.status(400).json({ error: 'pageId is required' })
    try {
      // FIXED: Switched to singular 'comment'
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

  // --- POST LOGIC: Handle new comment submissions ---
  if (req.method === 'POST') {
    const { content, nickname, pageId, pageTitle, parentId } = req.body
    if (!content || !pageId) {
      return res.status(400).json({ error: 'content and pageId are required' })
    }

    // IDENTITY CHECK: Verify the user with Supabase
    const supabase = createPagesServerClient({ req, res })
    const { data: { user } } = await supabase.auth.getUser()

    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'
    const isHost = userEmail === 'bestdayswithdad@gmail.com'

    // Display Name Logic: Favors "Host" or Google metadata over "Guest"
    const displayName = isHost ? "Host" : (nickname
      || user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || user?.email?.split('@')[0]
      || 'Guest')

    try {
      // PAGE SYNC: Find or Create Page using singular 'page'
      let page = await prisma.page.findFirst({ where: { slug: pageId } })
      
      if (!page) {
        page = await prisma.page.create({
          data: {
            id: crypto.randomUUID(),
            slug: pageId,
            // Uses pageTitle from the frontend, or auto-generates from slug
            title: pageTitle || (pageId.split('/').pop()?.split('-').join(' ') ?? 'New Post'),
            projectId: PROJECT_ID
          }
        })
      }

      // CREATE COMMENT: Using singular 'comment'
      const newComment = await prisma.comment.create({
        data: {
          id: crypto.randomUUID(),
          content,
          by_nickname: displayName,
          by_email: userEmail, // Populates 'User / IP' column on your dashboard
          ip: clientIp || '0.0.0.0',
          approved: isVerified || isHost, // Verified Readers and Host skip moderation
          projectId: PROJECT_ID,
          Page: { connect: { id: page.id } },
          parent_id: parentId ? BigInt(parentId) : null
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
