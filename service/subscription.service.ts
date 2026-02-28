import { UsageLabel, usageLimitation } from "../config.common"
import { prisma, resolvedConfig } from "../utils.server"

export class SubscriptionService {
  async update(body) {
    const {
      order_id,
      product_id,
      variant_id,
      customer_id,
      status,
      ends_at,
      urls: {
        update_payment_method
      }
    } = body.data.attributes

    const lemonSubscriptionId = body.data.id

    const {
      user_id
    } = body.meta.custom_data

    await prisma.subscription.upsert({
      where: {
        user_id: user_id // FIXED: Using user_id to match DB column mapping
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
        update_payment_method_url: update_payment_method
      } as any,
      update: {
        order_id: `${order_id}`,
        product_id: `${product_id}`,
        variant_id: `${variant_id}`,
        customer_id: `${customer_id}`,
        lemon_subscription_id: lemonSubscriptionId,
        ends_at: ends_at,
        status,
        update_payment_method_url: update_payment_method
      } as any
    })
  }

  async isActivated(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: {
        user_id: userId // FIXED: Using user_id
      } as any,
    })

    if (!subscription) {
      return false
    }

    let isActived = (subscription as any)?.status === 'active' || (subscription as any)?.status === 'cancelled'

    return isActived
  }

  async getStatus(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: {
        user_id: userId // FIXED: Using user_id
      } as any,
    })

    return {
      isActived: await this.isActivated(userId),
      status: (subscription as any)?.status || '',
      endAt: (subscription as any)?.ends_at?.toISOString() || '',
      updatePaymentMethodUrl: (subscription as any)?.update_payment_method_url || ''
    }
  }

  async createProjectValidate(userId: string) {
    if (!resolvedConfig.checkout.enabled) {
      return true
    }

    const projectCount = await prisma.project.count({
      where: {
        owner_id: userId, // FIXED: Using owner_id
        deleted_at: null // FIXED: Using deleted_at
      } as any
    })

    if (projectCount < usageLimitation['create_site']) {
      return true
    }

    if (await this.isActivated(userId)) {
      return true
    }

    return false
  }

  async approveCommentValidate(userId: string) {
    if (!resolvedConfig.checkout.enabled) {
      return true
    }

    const usage = await prisma.usage.findUnique({
      where: {
        userId_label: {
          user_id: userId, // FIXED: Using user_id inside composite key
          label: UsageLabel.ApproveComment
        }
      } as any
    })

    if (await this.isActivated(userId)) {
      return true
    }

    if (!usage) {
      return true
    }

    if ((usage as any).count <= usageLimitation[UsageLabel.ApproveComment]) {
      return true
    }

    return false
  }

  async quickApproveValidate(userId: string) {
    if (!resolvedConfig.checkout.enabled) {
      return true
    }

    const usage = await prisma.usage.findUnique({
      where: {
        userId_label: {
          user_id: userId, // FIXED: Using user_id
          label: UsageLabel.QuickApprove
        }
      } as any
    })

    if (!usage) {
      return true
    }

    if ((usage as any).count <= usageLimitation[UsageLabel.QuickApprove]) {
      return true
    }

    return false
  }
}
