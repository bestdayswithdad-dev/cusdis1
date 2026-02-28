import { prisma } from '../utils.server'
import { RequestScopeService } from '.'
import { randomBytes } from 'crypto'

// Simple unique ID generator to satisfy Prisma's ID requirement
const generateId = () => randomBytes(8).toString('hex')

export class PageService extends RequestScopeService {
  async upsertPage(
    slug: string, 
    projectId: string, 
    options?: { pageTitle?: string, pageUrl?: string }
  ) {
    // Check if the page already exists for this project
    const exist = await prisma.page.findFirst({
      where: {
        slug,
        projectId
      }
    })

    if (!exist) {
      // Create new page with a manual ID and relational connection
      return await prisma.page.create({
        data: {
          id: generateId(),
          title: options?.pageTitle || slug,
          url: options?.pageUrl || '',
          slug,
          // FIXED: Using Project relation connect syntax instead of raw projectId
          Project: {
            connect: { id: projectId }
          }
        }
      })
    }

    // Update the title or URL if they've changed
    if (options?.pageTitle || options?.pageUrl) {
      await prisma.page.update({
        where: { id: exist.id },
        data: {
          title: options?.pageTitle || exist.title,
          url: options?.pageUrl || exist.url
        }
      })
    }

    return exist
  }

  // Added list helper to ensure Capitalized 'Comment' count works for the dashboard
  async list(projectId: string) {
    return await prisma.page.findMany({
      where: {
        projectId
      },
      include: {
        _count: {
          select: {
            Comment: true // FIXED: Capitalized to match schema
          }
        }
      }
    })
  }
}
