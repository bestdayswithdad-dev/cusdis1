import * as React from "react"
// FIX: Using the correct exported member for version 0.15.0
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Redirecting to your project...</h2>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  // Use ctx.req and ctx.res for this version of the helper
  const supabase = createServerClient(ctx.req, ctx.res)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return {
      redirect: {
        destination: '/login', 
        permanent: false,
      }
    }
  }

  const projectService = new ProjectService(ctx.req)
  
  // session.user.id identifies you as DadAdmin
  const userId = session.user.id;

  const defaultProject = await projectService.getFirstProject(userId, {
    select: { id: true }
  })

  if (!defaultProject) {
    return {
      redirect: {
        destination: `/getting-start`,
        permanent: false
      }
    }
  } else {
    // This unlocks the 12 reviews
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
