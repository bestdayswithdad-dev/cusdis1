import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

const ALLOWED_ORIGINS = [
  'https://www.bestdayswithdad.com.au',
  'https://bestdayswithdad.com.au',
  'https://www.bestdayswithdad.com',
  'https://bestdayswithdad.com'
]

const serialize = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || ''

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com.au')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const submissionDelegate = (prisma as any).submission || (prisma as any).submissions

  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      const {
        type = 'spot',
        name,
        email,
        suburb,
        title,
        message,
        content,
        details = {}
      } = body

      if (!name || (!title && !message && !content)) {
        return res.status(400).json({ error: 'Name and a title or message are required.' })
      }

      // Ensure details is an object and never double nested
      let cleanDetails = typeof details === 'object' && details !== null ? { ...details } : {}
      if (cleanDetails.details && typeof cleanDetails.details === 'object') {
        cleanDetails = cleanDetails.details
      }

      // Capture message text whether Blogger sent it at top-level or inside details
      const incomingMessage = message || content || cleanDetails.message || cleanDetails.content || cleanDetails.body

      if (incomingMessage) {
        cleanDetails.message = String(incomingMessage).trim()
      }

      const finalTitle = title ? String(title).trim() : (type === 'contact' ? 'General Contact Inquiry' : 'Untitled Spot')

      const newSubmission = await submissionDelegate.create({
        data: {
          type: String(type),
          name: String(name).trim(),
          email: email ? String(email).trim() : 'anonymous@community.local',
          suburb: suburb ? String(suburb).trim() : null,
          title: finalTitle,
          details: cleanDetails,
          status: 'pending',
          projectId: PROJECT_ID
        }
      })

      return res.status(201).json(serialize(newSubmission))
    } catch (error: any) {
      console.error('Submission creation error:', error)
      return res.status(500).json({
        error: error.message || 'Database error while saving submission.'
      })
    }
  }

  if (req.method === 'GET') {
    try {
      const { status } = req.query

      const whereClause: any = {
        projectId: PROJECT_ID
      }

      if (status && status !== 'all') {
        whereClause.status = String(status)
      }

      const submissions = await submissionDelegate.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        }
      })

      return res.status(200).json(serialize(submissions))
    } catch (error: any) {
      console.error('Submissions fetch error:', error)
      return res.status(500).json({
        error: error.message || 'Failed to retrieve submissions.'
      })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status } = req.body || {}

      if (!id || !status) {
        return res.status(400).json({ error: 'Missing ID or status.' })
      }

      // Support BigInt or String ID
      const targetWhere: any = {}
      try {
        targetWhere.id = BigInt(id)
      } catch {
        targetWhere.id = String(id)
      }

      const updated = await submissionDelegate.update({
        where: targetWhere,
        data: {
          status: String(status)
        }
      })

      return res.status(200).json(serialize(updated))
    } catch (error: any) {
      console.error('Submission update error:', error)
      return res.status(500).json({
        error: error.message || 'Failed to update submission status.'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' })
}
