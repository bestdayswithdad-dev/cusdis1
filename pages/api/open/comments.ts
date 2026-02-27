import { NextApiRequest, NextApiResponse } from 'next'
import {
  CommentService,
  CommentWrapper,
} from '../../../service/comment.service'
import { apiHandler } from '../../../utils.server'
import Cors from 'cors'
import { ProjectService } from '../../../service/project.service'
import { statService } from '../../../service/stat.service'

export default apiHandler()
  .use(
    Cors({
      methods: ['GET', 'POST', 'OPTIONS'],
    }),
  )
  .get(async (req, res) => {
    const commentService = new CommentService(req)
    const projectService = new ProjectService(req)

    const query = req.query as {
      page?: string
      appId: string
      pageId: string
    }

    const timezoneOffsetInHour = req.headers['x-timezone-offset']
    const isDeleted = await projectService.isDeleted(query.appId)

    if (isDeleted) {
      res.status(404)
      res.json({
        data: {
          commentCount: 0,
          data: [],
          pageCount: 0,
          pageSize: 10,
          // THE FIX: "as unknown as" forces the compiler to accept the empty structure
        } as unknown as CommentWrapper,
      })
      return
    }

    statService.capture('get_comments', {
      identity: query.appId,
      properties: { from: 'open_api' },
    })

    // Passing query details to your restored getComments method
    const comments = await commentService.getComments(query.pageId)

    res.json({
      data: new CommentWrapper(comments),
    })
  })
  .post(async (req, res) => {
    const commentService = new CommentService(req)
    const projectService = new ProjectService(req)
    
    const body = req.body as {
      parentId?: string
      appId: string
      pageId: string
      content: string
      email: string
      nickname: string
      pageUrl?: string
      pageTitle?: string
    }

    const isDeleted = await projectService.isDeleted(body.appId)

    if (isDeleted) {
      res.status(404)
      res.json({ message: 'Project not found' })
      return
    }

    // Creating the comment in Supabase
    const comment = await commentService.addComment({
      content: body.content,
      nickname: body.nickname,
      email: body.email,
      pageId: body.pageId,
      parentId: body.parentId
    })

    statService.capture('add_comment')

    res.json({
      data: comment,
    })
  })
