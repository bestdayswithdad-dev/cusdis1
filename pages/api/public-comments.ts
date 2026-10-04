import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'
const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

const PROFANITY_ROOTS = [
  'fuck', 'shit', 'cunt', 'bitch', 'asshole', 'dick', 'cock', 
  'pussy', 'bastard', 'wanker', 'twat', 'slut', 'whore', 'fag',
  'nigger', 'nigga', 'retard', 'spastic', 'piss', 'bollocks'
]

function normalizeText(input: string): string {
  if (!input) return ''
  let text = input.toLowerCase()
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
  const leetMap: Record<string, string> = {
    '@': 'a', '4': 'a', '8': 'b', '3': 'e', '1': 'i', '!': 'i', '|': 'i',
    '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't', 'v': 'u'
  }
  text = text.replace(/[@4831!|0$57+]/g, char => leetMap[char] || char)
  text = text.replace(/[\._\-*#~\s]/g, '')
  text = text.replace(/(.)\1+/g, '$1')
  return text
}

function evaluateHeuristics(content: string): { flagged: boolean; reason: string | null } {
  const cleanString = normalizeText(content)
  const containsLink = /https?:\/\/[^\s]+/i.test(content)

  if (containsLink) {
    return { flagged: true, reason: 'link' }
  }

  for (const root of PROFANITY_ROOTS) {
    const collapsedRoot = root.replace(/(.)\1+/g, '$1')
    if (cleanString.includes(collapsedRoot)) {
      return { flagged: true, reason: 'profanity' }
    }
  }

  return { flagged: false, reason: null }
}

const serialize = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const supabase = createPagesServerClient({ req, res })

  const getAuthenticatedUser = async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (sessionUser) return sessionUser

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
      return tokenUser
    }
    return null
  }

  // 1. GET: Fetch approved comments for public view
  if (req.method === 'GET') {
    const { pageId } = req.query
    try {
      const whereClause: any = { projectId: PROJECT_ID }
      if (pageId) {
        whereClause.OR = [{ pageId: String(pageId) }, { Page: { slug: String(pageId) } }]
        whereClause.approved = true
      }
      const comments = await prisma.comment.findMany({
        where: whereClause,
        include: { Page: true },
        orderBy: { created_at: 'desc' }
      })
      return res.status(200).json(serialize(comments))
    } catch (err) {
      return res.status(500).json({ error: 'Fetch failed' })
    }
  }

  // 2. POST: Ingest comment with feedback status flags
  if (req.method === 'POST') {
    const { content, nickname, pageId, pageTitle, parentId, metadata } = req.body
    if (!content || !pageId) return res.status(400).json({ error: 'content and pageId are required' })

    const user = await getAuthenticatedUser()
    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'
    const isHost = userEmail === ADMIN_EMAIL
    const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name
    const displayName = isHost ? "Adam - BDWD" : (googleName || nickname || 'Guest')

    // Run heuristics
    const check = evaluateHeuristics(content)
    
    // Determine exact state:
    // - 'flagged': contains offensive words or suspicious links
    // - 'live': verified or host user with clean text
    // - 'pending': guest with clean text awaiting moderation
    let moderationStatus: 'live' | 'pending' | 'flagged' = 'pending'
    let shouldApprove = false

    if (check.flagged) {
      moderationStatus = 'flagged'
      shouldApprove = false
    } else if (isVerified || isHost) {
      moderationStatus = 'live'
      shouldApprove = true
    } else {
      moderationStatus = 'pending'
      shouldApprove = false
    }

    try {
      let page = await prisma.page.findFirst({ where: { slug: pageId } })
      if (!page) {
        page = await prisma.page.create({
          data: {
            id: crypto.randomUUID(),
            slug: pageId,
            title: pageTitle || (pageId.split('/').pop()?.split('-').join(' ') ?? 'New Post'),
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
          ip: req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || '0.0.0.0',
          approved: shouldApprove,
          projectId: PROJECT_ID,
          Page: { connect: { id: page.id } },
          parentId: parentId ? String(parentId) : null,
          metadata: {
            ...(metadata || {}),
            flaggedReason: check.reason,
            moderationState: moderationStatus
          }
        }
      })

      // Return both comment data and moderation feedback metadata to client
      return res.status(201).json({
        ...serialize(newComment),
        moderationStatus,
        flaggedReason: check.reason
      })
    } catch (error) {
      console.error("Prisma Error:", error)
      return res.status(500).json({ error: 'Post failed' })
    }
  }

  // 3. PATCH: Likes & Approvals
  if (req.method === 'PATCH') {
    const { id, action } = req.query
    const user = await getAuthenticatedUser()

    if (action === 'like') {
      if (!user) return res.status(401).json({ error: 'Please sign in to like comments' })
      const { type } = req.body
      try {
        const updated = await prisma.comment.update({
          where: { id: String(id) },
          data: {
            votes_count: {
              [type === 'dec' ? 'decrement' : 'increment']: 1
            }
          }
        })
        return res.status(200).json(serialize(updated))
      } catch (err) {
        return res.status(500).json({ error: 'Like operation failed' })
      }
    }

    if (user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' })

    try {
      const { approved } = req.body
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { approved: !!approved }
      })
      return res.status(200).json(serialize(updated))
    } catch (err) {
      return res.status(500).json({ error: 'Update failed' })
    }
  }

  // 4. DELETE: Admin / Author Delete
  if (req.method === 'DELETE') {
    const { id } = req.query
    const user = await getAuthenticatedUser()

    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    try {
      const comment = await prisma.comment.findUnique({ where: { id: String(id) } })
      if (!comment) return res.status(404).json({ error: 'Comment not found' })

      const isAuthor = comment.by_email === user.email
      const isAdmin = user.email === ADMIN_EMAIL

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'You can only delete your own comments' })
      }

      await prisma.comment.delete({ where: { id: String(id) } })
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: 'Delete failed' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
