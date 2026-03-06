import * as React from "react"
import { GetServerSideProps } from 'next'
import { getSession as getServerSession, UserSession } from '../utils.server'
import { Head } from '../components/Head'
import { Footer } from '../components/Footer'

// Using dynamic import to ensure the component loads 
// only after the Supabase session is validated.
import dynamic from 'next/dynamic'
const ProjectList = dynamic(() => import('../components/Dashboard/ProjectList'), { 
  ssr: false 
})

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)
  return { props: { session } }
}

export default function Home({ session }: Props) {
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your reviews.</p>
          <a href="/auth" className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Dashboard" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10 flex justify-between items-end border-b pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Projects</h1>
            <p className="mt-3 text-lg text-gray-500">
              Logged in as <span className="font-semibold text-black">{session.email}</span>
            </p>
          </div>
        </header>

        <section className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          {/* This component will fetch and display your 12 reviews automatically */}
          <ProjectList />
        </section>
      </main>

      <Footer />
    </div>
  )
}
