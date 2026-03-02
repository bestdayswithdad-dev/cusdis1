import * as React from "react"
/** * FIX: Use createServerClient as suggested by your Vercel logs 
 * to resolve the "has no exported member" error.
 */
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

function Dashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Redirecting to your project...</h2>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  // 1. Initialize the Client with context-aware request/response
  const supabase = createServerClient(ctx.req, ctx.res)

  // 2. Get the session directly from Supabase Cloud
  const { data: { session } } = await supabase.auth.getSession()

  // 3. If no session, go to login
  if (!session) {
    return {
      redirect: {
        destination: '/login', 
        permanent: false,
      }
    }
  }

  // 4. Identity Hub: Use session.user.id (matches your Website Script identity)
  const projectService = new ProjectService(ctx.req)
  const userId = session.user.id;

  const defaultProject = await projectService.getFirstProject(userId, {
    select: {
      id: true
    }
  })

  // 5. Route to your Project Dashboard
  if (!defaultProject) {
    return {
      redirect: {
        destination: `/getting-start`,
        permanent: false
      }
    }
  } else {
    // SUCCESS: This will now bypass the NextAuth 302 loops 
    // and load the 12 reviews from the 'usages' table.
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
