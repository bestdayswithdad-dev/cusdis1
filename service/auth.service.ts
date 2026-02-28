import { Project } from '@prisma/client'
import { RequestScopeService } from '.'

export class AuthService extends RequestScopeService {
  constructor(req, private res) {
    super(req)
  }

  async authGuard() {
    const session = await this.getSession()
    if (!session) {
      this.res.status(403).json({
        message: 'Sign in required',
      })
      return null
    }
    return session
  }

  // UPDATED: Changed ownerId to owner_id to match the new schema
  async projectOwnerGuard(project: Pick<Project, 'owner_id'>) {
    const session = await this.authGuard()

    if (!session) {
      return null
    }

    // UPDATED: Using project.owner_id instead of ownerId
    if (project.owner_id !== session.uid) {
      this.res.status(403).json({
        message: 'Permission denied',
      })
      return null
    } else {
      return true
    }
  }
}
