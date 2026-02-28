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
        // FIXED: Changed to snake_case to match DB
        enable_notification: true,
        // FIXED: Changed 'owner' to 'User' to match schema relation name
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    // Safety check if project or owner is missing
    // FIXED: Using User instead of owner
    if (!project || !project.User) {
      return
    }

    // don't notify if disabled in project settings
    // FIXED: Using enable_notification
    if (!project.enable_notification) {
      return
    }

    const fullComment = await prisma.comment.findUnique({
      where: {
        id: comment.id,
      },
      select: {
        // FIXED: Using 'Page' (Capitalized) to match schema relation
        Page: {
          select: {
            title: true,
            slug: true,
            // FIXED: Using 'Project' (Capitalized)
            Project: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    })

    // Use the standard email field
    // FIXED: Accessing through User
    const notificationEmail = project.User.email

    // Only proceed if an email exists
    if (notificationEmail) {
      let unsubscribeToken = this.tokenService.genUnsubscribeNewCommentToken(
        project.User.id,
      )

      const approveToken = await this.tokenService.genApproveToken(comment.id)

      // Bridge the data for the template
      const pageData = (fullComment as any).Page
      const projectData = pageData?.Project

      const msg = {
        to: notificationEmail,
        from: resolvedConfig.smtp.senderAddress,
        subject: `New comment on "${projectData?.title}"`,
        html: makeNewCommentEmailTemplate({
          page_slug: pageData?.title || pageData?.slug,
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
