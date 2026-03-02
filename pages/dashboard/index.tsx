import * as React from "react"
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

export async function getServerSideProps(ctx) {
  const { req, res } = ctx

  // Initialize Supabase with the manual cookie handlers required by version 0.15.0/SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({ name, value: req.cookies[name] || '' }))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.setHeader('Set-Cookie', `${name}=${value}`)
          })
        },
      },
    }
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

  const projectService = new ProjectService(req)
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
    // This will finally load your 12 reviews
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

function Dashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Redirecting to your project...</h2>
    </div>
  )
}

export default Dashboard
