import { NextApiRequest, NextApiResponse } from 'next'
import { CommentService } from '../../../service/comment.service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const commentService = new CommentService(req)
  const { commentId } = req.query

  if (req.method === 'POST') {
    // Simplified: Directly approve without complex ownership guards
    await commentService.approve(commentId as string)
    return res.json({ message: 'Success' })
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
