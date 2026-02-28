import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../../utils.server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { projectId, id } = req.query as { projectId: string; id: string }

  if (req.method === 'GET') {
    const count = await prisma.comment.count({
      where: {
        // FIXED: Changed from deletedAt to deleted_at to match new schema
        deleted_at: null,
        approved: true,
        Page: {
          slug: id,
          projectId: projectId
        }
      }
    })

    res.status(200).json(count)
  } else {
    res.status(405).end()
  }
}
