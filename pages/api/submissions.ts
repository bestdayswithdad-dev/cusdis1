import { PrismaClient } from '@prisma/client'
import type { NextApiRequest, NextApiResponse } from 'next'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1'

const serialize = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  )

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin || ''
  const allowedOrigins = [
    'https://www.bestdayswithdad.com',
    'https://bestdayswithdad.com'
  ]

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.bestdayswithdad.com')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      const {
        type = 'spot',
        name,
        email,
        suburb,
        title,
        details = {}
      } = body

      if (!name || !title) {
        return res.status(400).json({ error: 'Spot title and your name are required.' })
      }

      // Ensure details is never double nested
      let cleanDetails = details
      if (cleanDetails && typeof cleanDetails === 'object' && cleanDetails.details) {
        cleanDetails = cleanDetails.details
      }

      const newSubmission = await prisma.submission.create({
        data: {
          type: String(type),
          name: String(name).trim(),
          email: email ? String(email).trim() : 'anonymous@community.local',
          suburb: suburb ? String(suburb).trim() : null,
          title: title ? String(title).trim() : null,
          details: cleanDetails || {},
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

      const submissions = await prisma.submission.findMany({
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

      const updated = await prisma.submission.update({
        where: {
          id: BigInt(id)
        },
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
