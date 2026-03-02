import * as React from "react"
import { GetServerSideProps, Redirect } from 'next'
// FIXED: We now import UserSession directly from our utility to avoid the path error
import { getSession as getServerSession, resolvedConfig, sentry, UserSession } from '../utils.server'

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> | Redirect = async (ctx) => {
  // Passes the full context (req and res) to the fixed utility
  const session = await getServerSession(ctx.req, ctx.res)

  if (!resolvedConfig.isHosted && !session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
  return {
    props: {
      session
    }
  }
}

export default function Home(props: Props) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard</h1>
      <p>Welcome back! Your identity has been verified via Supabase.</p>
      <pre>{JSON.stringify(props.session, null, 2)}</pre>
    </div>
  )
}
