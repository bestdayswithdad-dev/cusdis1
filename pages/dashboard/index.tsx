import * as React from "react"
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { ProjectService } from "../../service/project.service"

function Dashboard() {
  // This page will mostly act as a redirect router
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Loading your projects...</h2>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  // 1. Initialize the Supabase Server Client
  // This bypasses Vercel's NextAuth Secret issues entirely.
  const supabase = createPagesServerClient(ctx)

  // 2. Get the session directly from Supabase
  const { data: { session } } = await supabase.auth.getSession()

  // 3. If no session, go to login (Update this to your Supabase login page)
  if (!session) {
    return {
      redirect: {
        destination: '/login', 
        permanent: false,
      }
    }
  }

  // 4. Use the Supabase UID (e.g., DadAdmin's ID) to find projects
  const projectService = new ProjectService(ctx.req)
  
  // We use session.user.id instead of session.uid
  const userId = session.user.id;

  const defaultProject = await projectService.getFirstProject(userId, {
    select: {
      id: true
    }
  })

  // 5. Route the user based on their data
  if (!defaultProject) {
    return {
      redirect: {
        destination: `/getting-start`,
        permanent: false
      }
    }
  } else {
    // This will now successfully load your 12 reviews
    return {
      redirect: {
        destination: `/dashboard/project/${defaultProject.id}`,
        permanent: false
      }
    }
  }
}

export default Dashboard
