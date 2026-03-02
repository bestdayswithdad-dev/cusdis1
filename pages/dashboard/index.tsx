import * as React from "react"
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
  // FIX: For version 0.15.0, pass the raw ctx as the 3rd argument
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ctx
  )

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
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
