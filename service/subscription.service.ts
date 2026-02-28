import { prisma, resolvedConfig } from '../utils.server'
import jwt from 'jsonwebtoken'

export enum SecretKey {
  ApproveComment = 'ApproveComment',
  UnsubscribeNewComment = 'UnsubscribeNewComment'
}

export class TokenService {
  private secret = resolvedConfig.db.url // Using DB URL as a stable secret base

  async genApproveToken(commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId
      },
      select: {
        // FIXED: Capitalized 'Page' and 'Project' to match schema
        Page: {
          select: {
            Project: {
              select: {
                // FIXED: Using 'users' relation name
                users: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const userId = (comment as any)?.Page?.Project?.users?.id

    return jwt.sign({
      commentId,
      userId,
      type: SecretKey.ApproveComment
    }, this.secret, { expiresIn: '30d' })
  }

  genUnsubscribeNewCommentToken(userId: string) {
    return jwt.sign({
      userId,
      type: SecretKey.UnsubscribeNewComment
    }, this.secret)
  }

  validate(token: string, type: SecretKey): any {
    try {
      const decoded = jwt.verify(token, this.secret) as any
      if (decoded.type !== type) {
        throw new Error('Invalid token type')
      }
      return decoded
    } catch (e) {
      throw new Error('Invalid token')
    }
  }
}
