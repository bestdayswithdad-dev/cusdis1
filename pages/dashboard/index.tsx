import * as React from "react"
// This matches the version 0.15.0 you installed earlier
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Loading your dashboard...</h2>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  // Pass both req and res to createServerClient
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
    // This routes you to the project where your 12 reviews live
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
