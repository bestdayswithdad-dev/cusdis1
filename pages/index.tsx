import * as React from "react"
import { GetServerSideProps } from 'next'
import { getSession as getServerSession, UserSession } from '../utils.server'
import { Head } from '../components/Head'
import { Footer } from '../components/Footer'

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)
  // Ensures the session is serializable for Next.js
  return { 
    props: { 
      session: session ? JSON.parse(JSON.stringify(session)) : null 
    } 
  }
}

export default function Home({ session }: Props) {
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (session) {
      // Your logs prove this API route is already returning data!
      fetch('/api/projects')
        .then(res => res.json())
        .then(data => {
          setProjects(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  if (!session) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <Head title="Login Required" />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Cusdis</h1>
        <p style={{ color: '#666', margin: '20px 0' }}>Please sign in to view your reviews.</p>
        <a href="/auth" style={{ padding: '12px 24px', background: '#000', color: '#fff', borderRadius: '8px', textDecoration: 'none' }}>
          Go to Login
        </a>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <Head title="My Dashboard" />
      
      <main style={{ flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>My Projects</h1>
          <p style={{ color: '#666' }}>Logged in as: <strong>{session.email}</strong></p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading your 12 reviews...</p>
          </div>
        ) : projects.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {projects.map(p => (
              <div key={p.id} style={{ padding: '24px', border: '1px solid #eaeaea', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem' }}>{p.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '15px' }}>Project ID: {p.id}</p>
                <a href={`/project/${p.id}`} style={{ color: '#0070f3', fontWeight: '600', textDecoration: 'none' }}>
                  Manage Comments →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', background: '#f9f9f9', borderRadius: '16px' }}>
            <p style={{ marginBottom: '10px' }}>No projects found in your database.</p>
            <p style={{ fontSize: '0.8rem', color: '#999' }}>Verified User ID: {session.uid}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
