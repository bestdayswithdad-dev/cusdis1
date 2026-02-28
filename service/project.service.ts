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
        // FIXED: Using 'users' relation as requested by Prisma Client
        users: {
          connect: {
            id: session.uid,
          },
        },
      },
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

  // list all projects
  async list() {
    const session = await (await this.getSession() as any)
    const projects = await prisma.project.findMany({
      where: {
        // FIXED: Using snake_case to match DB
        deleted_at: null,
        owner_id: session.uid,
      },
      select: {
        id: true,
        title: true,
      }
    })

    return projects
  }

  // (re)generate token
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
        // FIXED: Using snake_case
        owner_id: ownerId,
        deleted_at: null
      },
      orderBy: {
        // FIXED: Using snake_case
        created_at: 'asc'
      },
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
        // FIXED: Using snake_case
        created_at: 'desc',
      },
      take: options?.take || 20,
      where: {
        // FIXED: Using snake_case
        deleted_at: {
          equals: null
        },
        approved: false,
        moderatorId: {
          equals: null
        },
        // FIXED: Capitalized relation name
        Page: {
          projectId,
        },
        created_at: {
          gte: options?.from ? options?.from : undefined,
        },
      },
      select: {
        by_email: true,
        by_nickname: true,
        content: true,
        // FIXED: Mapping back to snake_case result
        created_at: true,
      },
    })

    if (options?.markAsRead) {
      await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          // FIXED: Mapping back to snake_case
          fetch_latest_comments_at: now
        }
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
        // FIXED: Using snake_case
        deleted_at: new Date()
      }
    })

    statService.capture('project_delete')
  }

  async isDeleted(projectId: string) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      },
      select: {
        // FIXED: Using snake_case
        deleted_at: true
      }
    })

    if (project && !(project as any).deleted_at) {
      return false
    }

    return true
  }
}
