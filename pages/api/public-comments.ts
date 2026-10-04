import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'
const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

// -------------------------------------------------------------
// TIER 1: ADVANCED NORMALIZATION & HEURISTIC ENGINE
// -------------------------------------------------------------
const PROFANITY_ROOTS = [
  'fuck', 'shit', 'cunt', 'bitch', 'asshole', 'dick', 'cock', 
  'pussy', 'bastard', 'wanker', 'twat', 'slut', 'whore', 'fag',
  'nigger', 'nigga', 'retard', 'spastic', 'piss', 'bollocks'
]

function normalizeText(input: string): string {
  if (!input) return ''
  let text = input.toLowerCase()

  // 1. Strip zero-width spacing and non-printable evasion markers
  text = text.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // 2. Transliterate leetspeak substitutions
  const leetMap: Record<string, string> = {
    '@': 'a', '4': 'a',
    '8': 'b',
    '3': 'e',
    '1': 'i', '!': 'i', '|': 'i',
    '0': 'o',
    '$': 's', '5': 's',
    '7': 't', '+': 't',
    'v': 'u'
  }
  text = text.replace(/[@4831!|0$57+]/g, char => leetMap[char] || char)

  // 3. Remove punctuation separators designed to bypass tokenization (e.g., f.u.c.k, f-u-c-k)
  text = text.replace(/[\._\-*#~\s]/g, '')

  // 4. Collapse character stuttering (e.g., "fuuuuck" -> "fuck")
  text = text.replace(/(.)\1+/g, '$1')

  return text
}

function evaluateHeuristics(content: string): { flagged: boolean; reason: string | null } {
  // Check raw and normalized text
  const cleanString = normalizeText(content)
  const containsLink = /https?:\/\/[^\s]+/i.test(content)

  if (containsLink) {
    return { flagged: true, reason: 'link_detected' }
  }

  for (const root of PROFANITY_ROOTS) {
    const collapsedRoot = root.replace(/(.)\1+/g, '$1')
    if (cleanString.includes(collapsedRoot)) {
      return { flagged: true, reason: 'profanity_heuristic' }
    }
  }

  return { flagged: false, reason: null }
}

// -------------------------------------------------------------
// TIER 2: OPTIONAL ASYNC AI AUDIT (OpenAI Free Moderation API)
// -------------------------------------------------------------
async function runAiModerationAudit(text: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ input: text })
    })
    const data = await res.json()
    const result = data.results?.[0]
    if (result?.flagged) {
      // Find the primary flagged category
      const categories = result.categories || {}
      const activeCategory = Object.keys(categories).find(k => categories[k])
      return activeCategory ? `ai_${activeCategory}` : 'ai_flagged'
    }
  } catch (err) {
    console.warn('AI Moderation audit skipped:', err)
  }
  return null
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

  // 1. GET: Fetch public comments
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

  // 2. POST: Ingest comment through moderation pipeline
  if (req.method === 'POST') {
    const { content, nickname, pageId, pageTitle, parentId, metadata } = req.body
    if (!content || !pageId) return res.status(400).json({ error: 'content and pageId are required' })

    const user = await getAuthenticatedUser()
    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'
    const isHost = userEmail === ADMIN_EMAIL
    const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name
    const displayName = isHost ? "Adam - BDWD" : (googleName || nickname || 'Guest')

    // Run Tier 1 Heuristics
    const heuristicCheck = evaluateHeuristics(content)
    
    // Auto-approval logic:
    // Only verified readers/host get auto-approval, AND only if content cleared Tier 1
    const shouldApprove = (isVerified || isHost) && !heuristicCheck.flagged

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
            flaggedReason: heuristicCheck.reason,
            moderationState: heuristicCheck.flagged ? 'quarantined' : (shouldApprove ? 'live' : 'pending_review')
          }
        }
      })

      // Non-blocking Tier 2 check (runs in background if API key configured)
      if (process.env.OPENAI_API_KEY && !heuristicCheck.flagged) {
        runAiModerationAudit(content).then(async (aiReason) => {
          if (aiReason) {
            await prisma.comment.update({
              where: { id: newComment.id },
              data: {
                approved: false,
                metadata: {
                  ...(newComment.metadata as object || {}),
                  flaggedReason: aiReason,
                  moderationState: 'quarantined'
                }
              }
            })
          }
        })
      }

      return res.status(201).json(serialize(newComment))
    } catch (error) {
      console.error("Prisma Error:", error)
      return res.status(500).json({ error: 'Post failed' })
    }
  }

  // 3. PATCH: Moderation & Likes
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
