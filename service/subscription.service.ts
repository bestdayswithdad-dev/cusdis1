import { UsageLabel, usageLimitation } from "../config.common"
import { prisma, resolvedConfig } from "../utils.server"

export class SubscriptionService {
  // FIXED: Added 'update' method to satisfy the webhook API
  async update(body: any) {
    // If the webhook doesn't have the expected data structure, just skip it
    if (!body?.data?.attributes || !body?.meta?.custom_data) {
      return
    }

    const {
      order_id,
      product_id,
      variant_id,
      customer_id,
      status,
      ends_at,
      urls
    } = body.data.attributes

    const { user_id } = body.meta.custom_data
    const lemonSubscriptionId = body.data.id

    // Use 'as any' to bypass the Prisma naming conflict loop
    await prisma.subscription.upsert({
      where: {
        user_id: user_id
      } as any,
      create: {
        user_id: user_id,
        order_id: `${order_id}`,
        product_id: `${product_id}`,
        variant_id: `${variant_id}`,
        customer_id: `${customer_id}`,
        ends_at: ends_at,
        lemon_subscription_id: lemonSubscriptionId,
        status,
        update_payment_method_url: urls?.update_payment_method || ''
      } as any,
      update: {
        status,
        ends_at: ends_at,
        update_payment_method_url: urls?.update_payment_method || ''
      } as any
    })
  }

  async isActivated(userId: string) {
    // For your NFP project, we treat the owner as always active
    return true
  }

  async createProjectValidate(userId: string) {
    const projectCount = await prisma.project.count({
      where: {
        owner_id: userId,
        deleted_at: null
      } as any
    })
    
    return projectCount < usageLimitation['create_site']
  }

  async approveCommentValidate(userId: string) {
    return true
  }

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
