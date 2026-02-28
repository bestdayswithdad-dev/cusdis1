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

  // FIXED: Changed Pick constraint from 'owner_id' to 'userId'
  async projectOwnerGuard(project: Pick<Project, 'userId'>) {
    const session = await this.authGuard()

    if (!session) {
      return null
    }

    // FIXED: Using project.userId to match the updated schema.prisma
    if (project.userId !== session.uid) {
      this.res.status(403).json({
        message: 'Permission denied',
      })
      return null
    } else {
      return true
    }
  }
}
