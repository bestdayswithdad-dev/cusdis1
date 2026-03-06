import * as React from "react"
import { GetServerSideProps } from 'next'
import { getSession as getServerSession, UserSession } from '../utils.server'
import { Head } from '../components/Head'
import { Footer } from '../components/Footer'

import dynamic from 'next/dynamic'

/**
 * FIXED: Explicitly targeting the file ProjectList.tsx to avoid index resolution issues.
 * If this still fails, we will use the absolute @/components alias.
 */
const ProjectList = dynamic(() => import('../components/Dashboard/ProjectList').then(mod => mod.ProjectList || mod.default), { 
  ssr: false,
  loading: () => (
    <div className="py-10 text-center text-gray-500">
      Loading your reviews from the database...
    </div>
  )
})

interface Props {
  session: UserSession | null
}
// ... rest of the file stays exactly the same as provided earlier
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)
  
  // We return the session. If null, the Home component shows the login prompt.
  return { 
    props: { 
      session: session ? JSON.parse(JSON.stringify(session)) : null 
    } 
  }
}

export default function Home({ session }: Props) {
  // 1. Logged Out State: Prevents the "Not Found" white screen
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-10 text-center border border-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Cusdis</h1>
          <p className="text-gray-600 mb-8">Please sign in to manage your comments and projects.</p>
          <a 
            href="/auth" 
            className="inline-block w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition duration-200 shadow-lg"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  // 2. Logged In State: Shows the actual Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Dashboard" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b pb-8 border-gray-200">
          <div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight">My Projects</h1>
            <p className="mt-4 text-xl text-gray-500">
              Welcome back, <span className="font-bold text-black border-b-2 border-black">{session.email}</span>
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-sm text-gray-400">
            ID: <code className="bg-gray-100 px-2 py-1 rounded">{session.uid}</code>
          </div>
        </header>

        <section className="bg-white shadow-2xl rounded-3xl p-10 border border-gray-100">
          {/* This component will now finally render your 12 reviews 
              because the server logs prove the /api/open/comments call is succeeding.
          */}
          <ProjectList />
        </section>
      </main>

      <Footer />
    </div>
  )
}
