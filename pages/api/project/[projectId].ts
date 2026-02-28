import { Project } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { AuthService } from "../../../service/auth.service";
import { ProjectService } from "../../../service/project.service";
import { prisma } from "../../../utils.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const authService = new AuthService(req, res)
  const projectService = new ProjectService(req)

  if (req.method === 'PUT') {
    const { projectId } = req.query as {
      projectId: string
    }
    const body = req.body as {
      enableNotification?: boolean,
      webhookUrl?: string,
      enableWebhook?: boolean
    }

    // UPDATED: Changed ownerId to owner_id to match the new schema
    const project = (await projectService.get(projectId, {
      select: {
        owner_id: true,
      },
    })) as Pick<Project, 'owner_id'>

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        // UPDATED: Both key and value must match the new schema names
        enable_notification: body.enableNotification, 
        enable_webhook: body.enableWebhook,           
        webhook: body.webhookUrl
      },
    })

    res.json({
      message: 'success'
    })
  } else if (req.method === 'DELETE') {
    const { projectId } = req.query as {
      projectId: string
    }

    // UPDATED: Changed ownerId to owner_id
    const project = (await projectService.get(projectId, {
      select: {
        owner_id: true,
      },
    })) as Pick<Project, 'owner_id'>

    if (!(await authService.projectOwnerGuard(project))) {
      return
    }

    await projectService.delete(projectId)

    res.json({
      message: 'success'
    })
  }
}
