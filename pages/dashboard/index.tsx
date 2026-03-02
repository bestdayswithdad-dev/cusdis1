import * as React from "react"
// Use createServerClient - this matches the version currently on your server
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
  // Use (ctx.req, ctx.res) for this version of the library
  const supabase = createServerClient(ctx.req, ctx.res)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const projectService = new ProjectService(ctx.req)
  const defaultProject = await projectService.getFirstProject(session.user.id, {
    select: { id: true }
  })

  if (!defaultProject) {
    return { redirect: { destination: `/getting-start`, permanent: false } }
  } else {
    return { redirect: { destination: `/dashboard/project/${defaultProject.id}`, permanent: false } }
  }
}

export default Dashboard
