// TOP OF FILE: Updated import to avoid naming collision
import { getSession as getServerSession, resolvedConfig, sentry } from '../utils.server'
import { GetServerSideProps, Redirect } from 'next'
// ... rest of your imports

// BOTTOM OF FILE: Updated getServerSideProps
export const getServerSideProps: GetServerSideProps<Props> | Redirect = async (ctx) => {
  // Use the renamed import and pass BOTH req and res
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
