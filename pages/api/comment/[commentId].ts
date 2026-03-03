import { NextApiRequest, NextApiResponse } from "next";
import { CommentService } from '../../../service/comment.service'
import { getSession } from '../../../utils.server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Verify the user is actually logged in via Supabase
  const session = await getSession(req, res)
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const commentService = new CommentService(req)
  
  if (req.method === 'DELETE') {
    // 2. The service should now be able to use session.uid to verify ownership
    await commentService.deleteComment(req.query.commentId as string)
    res.json({ message: 'Success' })
  }
}
