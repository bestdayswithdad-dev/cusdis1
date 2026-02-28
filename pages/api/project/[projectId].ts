import { Project } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../../service/auth.server"; // Note: Ensure path is correct
import { ProjectService } from "../../../service/project.service";
import { prisma } from "../../../utils.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authService = new AuthService(req, res)
  const projectService = new ProjectService(req)

  const { projectId } = req.query as { projectId: string }

  if (req.method === 'PUT') {
    const body = req.body as {
      enableNotification?: boolean,
      webhookUrl?: string,
      enableWebhook?: boolean
    }

    // FIXED: Removed the double conversion and standardized on userId
    const project = (await projectService.get(projectId, {
      select: {
        userId: true, 
      },
    })) as any

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        enable_notification: body.enableNotification, 
        enable_webhook: body.enableWebhook,           
        webhook: body.webhookUrl
      },
    })

    return res.json({ message: 'success' })

  } else if (req.method === 'DELETE') {
    // FIXED: Updated DELETE method to use userId as well
    const project = (await projectService.get(projectId, {
      select: {
        userId: true,
      },
    })) as any

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await projectService.delete(projectId)

    return res.json({ message: 'success' })
  }
}
