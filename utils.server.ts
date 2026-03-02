import { PrismaClient } from '@prisma/client'
import { UserSession } from './service'
// REMOVED: next-auth/client import to stop the 307 loops
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import * as Sentry from '@sentry/node'
import { NextApiRequest, NextApiResponse } from 'next'
import nc from 'next-connect'
import Boom from '@hapi/boom'

type EnvVariable = string | undefined

export const resolvedConfig = {
  useLocalAuth: process.env.USERNAME && process.env.PASSWORD,
  useGithub: process.env.GITHUB_ID && process.env.GITHUB_SECRET,
  useGitlab: process.env.GITLAB_ID && process.env.GITLAB_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  isHosted: process.env.IS_HOSTED === 'true',
  host: process.env.HOST || 'https://cusdis.com',
  checkout: {
    enabled: process.env.CHECKOUT_URL ? true : false,
    url: process.env.CHECKOUT_URL as string,
    lemonSecret: process.env.LEMON_SECRET as string,
    lemonApiKey: process.env.LEMON_API_KEY as string,
  },
  umami: {
    id: process.env.UMAMI_ID as EnvVariable,
    src: process.env.UMAMI_SRC as EnvVariable,
  },
  google: {
    id: process.env.GOOGLE_ID as EnvVariable,
    secret: process.env.GOOGLE_SECRET as EnvVariable,
  },
  smtp: {
    host: process.env.SMTP_HOST as EnvVariable,
    port: Number((process.env.SMTP_PORT as EnvVariable) || '587'),
    secure: Boolean((process.env.SMTP_SECURE as EnvVariable) || 'true'),
    auth: {
      user: process.env.SMTP_USER as EnvVariable,
      pass: process.env.SMTP_PASSWORD as EnvVariable,
    },
    senderAddress:
      (process.env.SMTP_SENDER as EnvVariable) ||
      'Cusdis Notification<notification@cusdis.com>',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY as EnvVariable,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN as EnvVariable,
  },
  minicapture: {
    apiKey: process.env.MINICAPTURE_API_KEY as EnvVariable,
  },
}

export const singleton = async <T>(id: string, fn: () => Promise<T>) => {
  if (process.env.NODE_ENV === 'production') {
    return await fn()
  } else {
    if (!global[id]) {
      global[id] = await fn()
    }
    return global[id] as T
  }
}

export const singletonSync = <T>(id: string, fn: () => T) => {
  if (process.env.NODE_ENV === 'production') {
    return fn()
  } else {
    if (!global[id]) {
      global[id] = fn()
    }
    return global[id] as T
  }
}

export const prisma = singletonSync('prisma', () => {
  return new PrismaClient()
})

export const sentry = singletonSync('sentry', () => {
  if (resolvedConfig.sentry.dsn) {
    Sentry.init({
      dsn: resolvedConfig.sentry.dsn,
      tracesSampleRate: 1.0,
    })
    return Sentry
  }
})

export function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result)
        }
        return resolve(result)
      })
    })
}

export const HTTPException = Boom

export const apiHandler = () => {
  return nc<NextApiRequest, NextApiResponse>({
    onError(e, req, res, next) {
      if (Boom.isBoom(e)) {
        res.status(e.output.payload.statusCode)
        res.json({
          error: e.output.payload.error,
          message: e.output.payload.message,
        })
      } else {
        res.status(500)
        res.json({
          message: 'Unexpected error',
        })
        console.error(e)
      }
    },
  })
}

// FIXED: Using Supabase session to unlock your 12 reviews
export const getSession = async (req: NextApiRequest, res?: NextApiResponse) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      req, 
      res: res || ({} as NextApiResponse) 
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    return {
      user: session.user,
      uid: session.user.id, // Maps Supabase ID to your project ownership
      email: session.user.email
    } as UserSession
  }

  return null
}
