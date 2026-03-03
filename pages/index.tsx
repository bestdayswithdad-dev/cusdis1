import * as React from "react"
import { GetServerSideProps, Redirect } from 'next'
import { getSession as getServerSession, resolvedConfig, UserSession } from '../utils.server'

// We will use a dynamic import for the Dashboard to bypass any pathing issues
import dynamic from 'next/dynamic'
const ProjectList = dynamic(() => import('../components/Dashboard/ProjectList'), { 
  ssr: false,
  loading: () => <p>Loading your 12 reviews...</p> 
})

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> | Redirect = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)

  // If no session, we stay on the page but show a simple login button 
  // instead of redirecting to a 404 '/login' page
  return { props: { session } }
}

export default function Home({ session }: Props) {
  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Cusdis Dashboard</h1>
        <p>Please sign in to view your comments.</p>
        <a href="/auth" style={{ padding: '10px 20px', background: '#000', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
          Go to Login
        </a>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h1>My Projects</h1>
        <p>Logged in as: <strong>{session.email}</strong></p>
      </header>
      
      <main>
        {/* This component will now finally render your 12 reviews using the Supabase UID */}
        <ProjectList />
      </main>
    </div>
  )
}
