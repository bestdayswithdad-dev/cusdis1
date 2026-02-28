import { Prisma, Project, User } from '@prisma/client'
import { randomBytes } from 'crypto'
import { RequestScopeService } from '.'
import { prisma } from '../utils.server'
import { statService } from './stat.service'

const generateId = () => randomBytes(8).toString('hex')

export class ProjectService extends RequestScopeService {
  async create(title: string) {
    const session = await (await this.getSession() as any)
    const created = await prisma.project.create({
      data: {
        id: generateId(),
        title,
        // FIXED: Using 'user' (singular) as defined in your schema
        user: {
          connect: {
            id: session.uid,
          },
        },
      } as any,
    })

    statService.capture('project_create')
    return created
  }

  async get(
    projectId: string,
    options?: {
      select?: Prisma.ProjectSelect
    },
  ) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: options?.select,
    })

    return project
  }

  async list() {
    const session = await (await this.getSession() as any)
    const projects = await prisma.project.findMany({
      where: {
        deleted_at: null,
        // FIXED: Changed owner_id to userId
        userId: session.uid,
      } as any,
      select: {
        id: true,
        title: true,
      }
    })

    return projects
  }

  async regenerateToken(projectId: string) {
    const id = randomBytes(12).toString('hex')
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        token: id,
      },
    })

    return id
  }

  async getFirstProject(ownerId: string, options?: {
    select?: Prisma.ProjectSelect
  }) {
    const project = await prisma.project.findFirst({
      where: {
        // FIXED: Changed owner_id to userId
        userId: ownerId,
        deleted_at: null
      } as any,
      orderBy: {
        created_at: 'asc'
      } as any,
      select:  options?.select
    })

    return project as Project
  }

  async fetchLatestComment(
    projectId: string,
    options?: {
      from?: Date
      take?: number,
      markAsRead?: boolean
    },
  ) {
    const now = new Date()
    const results = await prisma.comment.findMany({
      orderBy: {
        created_at: 'desc',
      } as any,
      take: options?.take || 20,
      where: {
        deleted_at: null,
        approved: false,
        moderatorId: null,
        Page: {
          projectId,
        },
        created_at: {
          gte: options?.from ? options?.from : undefined,
        },
      } as any,
      select: {
        by_email: true,
        by_nickname: true,
        content: true,
        created_at: true,
      } as any,
    })

    if (options?.markAsRead) {
      await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          fetch_latest_comments_at: now
        } as any
      })
    }

    return results
  }

  async delete(projectId: string) {
    await prisma.project.update({
      where: {
        id: projectId
      },
      data:{
        deleted_at: new Date()
      } as any
    })

    statService.capture('project_delete')
  }

  async isDeleted(projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      select: {
        deleted_at: true
      } as any
    })

    if (project && !(project as any).deleted_at) {
      return false
    }

    return true
  }
}
