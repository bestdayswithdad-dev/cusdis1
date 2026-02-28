import { Comment } from '@prisma/client'
import axios from 'axios'
import { RequestScopeService } from '.'
import { prisma, resolvedConfig } from '../utils.server'
import { statService } from './stat.service'
import { TokenService } from './token.service'

export enum HookType {
  NewComment = 'new_comment',
}

export type HookBody<T> = {
  type: HookType
  data: T
}

export type NewCommentHookData = {
  by_nickname: string
  by_email: string
  project_title: string
  page_id: string
  page_title: string
  content: string
  approve_link: string
}

export class WebhookService extends RequestScopeService {
  tokenService = new TokenService()

  async addComment(comment: Comment, projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    // FIXED: Using snake_case fields (enable_webhook, moderator_id) to match DB
    if (project && (project as any).enable_webhook && !comment.moderatorId && (project as any).webhook) {

      const fullComment = await prisma.comment.findUnique({
        where: {
          id: comment.id,
        },
        select: {
          // FIXED: Capitalized 'Page' and 'Project' to match schema relations
          Page: {
            select: {
              title: true,
              slug: true,
              Project: {
                select: {
                  title: true
                }
              }
            },
          },
        },
      })

      if (!fullComment || !(fullComment as any).Page) return

      const approveToken = await this.tokenService.genApproveToken(comment.id)
      const approveLink = `${resolvedConfig.host}/open/approve?token=${approveToken}`

      statService.capture('webhook_trigger', {
        properties: {
          from: 'add_comment',
        },
      })

      try {
        const pageData = (fullComment as any).Page
        axios.post((project as any).webhook, {
          type: HookType.NewComment,
          data: {
            by_nickname: comment.by_nickname,
            by_email: comment.by_email,
            content: comment.content,
            page_id: pageData.slug,
            page_title: pageData.title,
            project_title: pageData.Project?.title,
            approve_link: approveLink,
          },
        } as HookBody<NewCommentHookData>)
      } catch (e) {
        // Silent catch for webhook failures
      }
    }
  }
}
