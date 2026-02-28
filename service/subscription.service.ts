import { UsageLabel, usageLimitation } from "../config.common"
import { prisma, resolvedConfig } from "../utils.server"

export class SubscriptionService {
  // Logic to check if a user is "active" 
  // (Set to true by default for your NFP project setup)
  async isActivated(userId: string) {
    return true
  }

  // Check if the user is allowed to create more projects
  async createProjectValidate(userId: string) {
    const projectCount = await prisma.project.count({
      where: {
        owner_id: userId,
        deleted_at: null
      } as any
    })
    
    return projectCount < usageLimitation['create_site']
  }

  // Check if the user is allowed to approve comments
  async approveCommentValidate(userId: string) {
    return true
  }

  // Check if the user is allowed to use quick approve
  async quickApproveValidate(userId: string) {
    return true
  }

  async getStatus(userId: string) {
    return {
      isActived: true,
      status: 'active',
      endAt: new Date(2099, 1, 1).toISOString(),
      updatePaymentMethodUrl: ''
    }
  }
}
