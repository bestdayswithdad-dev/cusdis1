import { RequestScopeService, UserSession } from ".";
import { UsageLabel } from "../config.common";
import { prisma, resolvedConfig } from "../utils.server";
import { ProjectService } from "./project.service";
import { SubscriptionService } from './subscription.service'

export class ViewDataService extends RequestScopeService {
  private projectService = new ProjectService(this.req)
  private subscriptionService = new SubscriptionService()

  async fetchMainLayoutData() {
    const session = await (await this.getSession() as any)

    const userInfo = await prisma.user.findUnique({
      where: {
        id: session.uid
      },
      select: {
        // FIXED: Using snake_case for mapped database columns
        notification_email: true,
        enable_notifications: true,
        name: true,
        email: true,
        display_name: true
      } as any
    })

    const [projectCount, approveCommentUsage, quickApproveUsage] = await prisma.$transaction([
      prisma.project.count({
        where: {
          // FIXED: Using snake_case for filters
          owner_id: session.uid,
          deleted_at: null
        } as any
      }),
      prisma.usage.findUnique({
        where: {
          userId_label: {
            user_id: session.uid, // FIXED: user_id
            label: UsageLabel.ApproveComment
          }
        } as any
      }),
      prisma.usage.findUnique({
        where: {
          userId_label: {
            user_id: session.uid, // FIXED: user_id
            label: UsageLabel.QuickApprove
          }
        } as any
      })
    ])

    return {
      session,
      projects: await this.projectService.list(),
      subscription: await this.subscriptionService.getStatus(session.uid),
      usage: {
        projectCount,
        approveCommentUsage: (approveCommentUsage as any)?.count ?? 0,
        quickApproveUsage: (quickApproveUsage as any)?.count ?? 0
      },
      config: {
        isHosted: resolvedConfig.isHosted,
        checkout: resolvedConfig.checkout,
      },
      userInfo
    }
  }
}

export type MainLayoutData = Awaited<ReturnType<ViewDataService['fetchMainLayoutData']>>
