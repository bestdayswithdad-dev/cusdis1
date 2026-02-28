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
        // FIXED: Relation name 'users' as requested by generated client
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
        // FIXED: Reverted to camelCase for the 'where' filter
        deletedAt: null,
        ownerId: session.uid,
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
        // FIXED: Reverted to camelCase
        ownerId,
        deletedAt: null
      },
      orderBy: {
        // FIXED: Reverted to camelCase
        createdAt: 'asc'
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
        // FIXED: Comment model might still need snake_case or camelCase; 
        // based on the Project error, let's try camelCase here too
        createdAt: 'desc',
      },
      take: options?.take || 20,
      where: {
        deletedAt: null,
        approved: false,
        moderatorId: null,
        Page: {
          projectId,
        },
        createdAt: {
          gte: options?.from ? options?.from : undefined,
        },
      },
      select: {
        by_email: true,
        by_nickname: true,
        content: true,
        createdAt: true,
      },
    })

    if (options?.markAsRead) {
      await prisma.project.update({
        where: {
          id: projectId
        },
        data: {
          // FIXED: Reverted to camelCase
          fetchLatestCommentsAt: now
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
        deletedAt: new Date()
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
        deletedAt: true
      }
    })

    if (project && !project.deletedAt) {
      return false
    }

    return true
  }
}
