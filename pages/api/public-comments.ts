import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'
const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

const serialize = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ))

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

  // 1. GET: Fetch comments
  if (req.method === 'GET') {
    const { pageId } = req.query
    try {
      const whereClause: any = { projectId: PROJECT_ID };
      if (pageId) {
        whereClause.OR = [{ pageId: String(pageId) }, { Page: { slug: String(pageId) } }];
        whereClause.approved = true;
      }
      const comments = await prisma.comment.findMany({
        where: whereClause,
        include: { Page: true },
        orderBy: { created_at: 'desc' }
      })
      return res.status(200).json(serialize(comments))
    } catch (err) { return res.status(500).json({ error: 'Fetch failed' }) }
  }

  // 2. POST: Submit comment
  if (req.method === 'POST') {
    const { content, nickname, pageId, pageTitle, parentId, metadata } = req.body
    if (!content || !pageId) return res.status(400).json({ error: 'content and pageId are required' })

    const user = await getAuthenticatedUser()
    const isVerified = !!user
    const userEmail = user?.email ?? 'guest@example.com'
    const isHost = userEmail === ADMIN_EMAIL
    const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name
    const displayName = isHost ? "Adam - BDWD" : (googleName || nickname || 'Guest')

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
          approved: isVerified || isHost, 
          projectId: PROJECT_ID,
          Page: { connect: { id: page.id } },
          parentId: parentId ? String(parentId) : null,
          metadata: metadata || {}
        }
      })
      return res.status(201).json(serialize(newComment))
    } catch (error) { 
        console.error("Prisma Error:", error);
        return res.status(500).json({ error: 'Post failed' }) 
    }
  }

  // 3. PATCH: Handle Toggle Likes and Admin Approvals
  if (req.method === 'PATCH') {
    const { id, action } = req.query
    
    // --- LIKE TOGGLE LOGIC ---
    if (action === 'like') {
      const { type } = req.body; // Expecting 'inc' or 'dec'
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

    // --- ADMIN APPROVAL LOGIC ---
    const user = await getAuthenticatedUser()
    if (user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' })

    try {
      const { approved } = req.body
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { approved: !!approved }
      })
      return res.status(200).json(serialize(updated))
    } catch (err) { return res.status(500).json({ error: 'Update failed' }) }
  }

  // 4. DELETE: Admin only
  if (req.method === 'DELETE') {
    const { id } = req.query
    const user = await getAuthenticatedUser()
    if (user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Unauthorized' })

    try {
      await prisma.comment.delete({ where: { id: String(id) } })
      return res.status(200).json({ success: true })
    } catch (err) { return res.status(500).json({ error: 'Delete failed' }) }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
