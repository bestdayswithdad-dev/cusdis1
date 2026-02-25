import { nanoid } from "nanoid";
import { RequestScopeService } from ".";
import { prisma } from "../utils.server";

export class UserService extends RequestScopeService {
  async update(userId: string, options: {
    displayName?: string,
    notificationEmail?: string,
    // RENAME THIS:
    enableNotifications?: boolean
  }) {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        displayName: options.displayName,
        notificationEmail: options.notificationEmail,
        // RENAME THIS:
        enableNotifications: options.enableNotifications
      }
    })
  }
}
