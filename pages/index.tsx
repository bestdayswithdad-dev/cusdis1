import * as React from "react"
import { GetServerSideProps } from 'next'
import { getSession as getServerSession, UserSession } from '../utils.server'

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)
  // We return the session to the frontend. If it's null, we show the sign-in prompt.
  return { props: { session } }
}

export default function Home({ session }: Props) {
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    // If the server found a session, we fetch the 12 reviews
    if (session) {
      fetch('/api/projects')
        .then(res => res.json())
        .then(json => setData(json))
        .catch(err => console.error("Fetch error:", err))
    }
  }, [session])

  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Dashboard</h1>
        <p style={{ color: '#666' }}>Your session could not be verified.</p>
        <div style={{ marginTop: '20px', padding: '20px', background: '#fff3cd', borderRadius: '5px', display: 'inline-block' }}>
            <strong>Debug Info:</strong> No Supabase cookie found. Please log in through your Auth page.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #eee', marginBottom: '30px', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px' }}>My Projects</h1>
        <p>Verified Identity: <strong>{session.email}</strong></p>
      </header>

      {data ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {data.length > 0 ? (
            data.map((project: any) => (
              <div key={project.id} style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{project.title}</h3>
                <p style={{ fontSize: '12px', color: '#888' }}>Project ID: {project.id}</p>
                <a href={`/project/${project.id}`} style={{ color: '#0070f3', textDecoration: 'none' }}>Manage Comments →</a>
              </div>
            ))
          ) : (
            <p>No projects found for this account. Your UID is: {session.uid}</p>
          )}
        </div>
      ) : (
        <p>Loading your reviews from the database...</p>
      )}
    </div>
  )
}
