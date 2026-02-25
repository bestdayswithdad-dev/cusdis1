import { Comment } from '@prisma/client'
import { RequestScopeService } from '.'
import { prisma, resolvedConfig } from '../utils.server'
import { UserService } from './user.service'
import { markdown } from './comment.service'
import { TokenService } from './token.service'
import { EmailService } from './email.service'
import { makeNewCommentEmailTemplate } from '../templates/new_comment'

export class NotificationService extends RequestScopeService {
  userService = new UserService(this.req)
  tokenService = new TokenService()
  emailService = new EmailService()

  // notify when new comment added
  async addComment(comment: Comment, projectId: string) {
    // don't notify if comment is created by moderator
    if (comment.moderatorId) {
      return
    }

    // check if project exists and fetch owner info
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        enableNotification: true,
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    // Safety check if project or owner is missing
    if (!project || !project.owner) {
      return
    }

    // don't notify if disabled in project settings
    if (!project.enableNotification) {
      return
    }

    const fullComment = await prisma.comment.findUnique({
      where: {
        id: comment.id,
      },
      select: {
        page: {
          select: {
            title: true,
            slug: true,
            project: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    // Use the standard email field (Ghost column 'notificationEmail' removed)
    const notificationEmail = project.owner.email

    // Only proceed if an email exists
    if (notificationEmail) {
      let unsubscribeToken = this.tokenService.genUnsubscribeNewCommentToken(
        project.owner.id,
      )

      const approveToken = await this.tokenService.genApproveToken(comment.id)

      const msg = {
        to: notificationEmail,
        from: resolvedConfig.smtp.senderAddress,
        subject: `New comment on "${fullComment.page.project.title}"`,
        html: makeNewCommentEmailTemplate({
          page_slug: fullComment.page.title || fullComment.page.slug,
          by_nickname: comment.by_nickname,
          approve_link: `${resolvedConfig.host}/open/approve?token=${approveToken}`,
          unsubscribe_link: `${resolvedConfig.host}/api/open/unsubscribe?token=${unsubscribeToken}`,
          content: markdown.render(comment.content),
          notification_preferences_link: `${resolvedConfig.host}/user`,
        }),
      }

      try {
        await this.emailService.send(msg)
      } catch (e) {
        console.error("Notification Email Failed:", e)
      }
    }
  }
}
