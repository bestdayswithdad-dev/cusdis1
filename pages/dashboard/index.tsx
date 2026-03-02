import * as React from "react"
import { createServerClient, serializeCookie (or similar) } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

export async function getServerSideProps(ctx) {
  const { req, res } = ctx

  // FIX: Provide the cookies object with getAll and setAll as required by the logs
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] || '' }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.appendHeader('Set-Cookie', `${name}=${value}`))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const projectService = new ProjectService(req)
  const defaultProject = await projectService.getFirstProject(session.user.id, {
    select: { id: true }
  })

  if (!defaultProject) {
    return { redirect: { destination: `/getting-start`, permanent: false } }
  }

  return {
    redirect: {
      destination: `/dashboard/project/${defaultProject.id}`,
      permanent: false
    }
  }
}

function Dashboard() {
  return <div style={{ padding: '20px' }}><h2>Redirecting...</h2></div>
}

export default Dashboard
