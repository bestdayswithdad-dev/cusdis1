import * as React from "react"
// CHANGED: Use 'createServerClient' to match your installed version (0.15.0)
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

function Dashboard() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Loading your dashboard...</h2>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  // Use (ctx.req, ctx.res) for this specific version of the helper
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
    // This successfully routes you to your 12 reviews
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
