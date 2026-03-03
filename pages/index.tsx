import * as React from "react"
import { GetServerSideProps } from 'next'
import { getSession as getServerSession, UserSession } from '../utils.server'

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)
  return { props: { session } }
}

export default function Home({ session }: Props) {
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (session) {
      // This calls ProjectService.list() under the hood
      fetch('/api/projects') 
        .then(res => res.json())
        .then(data => {
          setProjects(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (!session) return <div style={{padding: '50px'}}>Please sign in.</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>My Dashboard</h1>
        <p>Logged in as: {session.email}</p>
      </header>

      <section>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Your Projects</h2>
        {loading ? (
          <p>Fetching your 12 reviews...</p>
        ) : projects.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {projects.map(p => (
              <li key={p.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }}>
                <strong>{p.title}</strong> (ID: {p.id})
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <p>No projects found. If you have 12 reviews, they might be under a different User ID.</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Your current UID: {session.uid}</p>
          </div>
        )}
      </section>
    </div>
  )
}
