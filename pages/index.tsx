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

// KEEP the fixed getServerSideProps we wrote!
// But REPLACE the default function Home(props) with your original dashboard code:

export default function Home(props: Props) {
  // If session is missing but build passed, we show a simple state
  if (!props.session) {
    return <div>Loading session...</div>
  }

  return (
    <>
      {/* Restore your original Dashboard components here */}
      <Dashboard session={props.session} /> 
      {/* Ensure your components use props.session.uid to fetch the 12 reviews */}
    </>
  )
}
