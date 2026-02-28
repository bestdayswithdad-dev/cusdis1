import { nanoid } from "nanoid";
import { RequestScopeService } from ".";
import { prisma } from "../utils.server";

export class UserService extends RequestScopeService {
  async update(userId: string, options: {
    displayName?: string,
    notificationEmail?: string,
    enableNotifications?: boolean
  }) {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        // FIXED: Mapping the camelCase options to snake_case database fields
        display_name: options.displayName,
        notification_email: options.notificationEmail,
        enable_notifications: options.enableNotifications
      }
    })
  }
}
