import * as React from "react"
import { GetServerSideProps, Redirect } from 'next'
import { getSession as getServerSession, resolvedConfig, UserSession } from '../utils.server'

// FIXED: Using a specific file path to bypass folder-level confusion
import ProjectList from '../components/Dashboard/ProjectList' 
import { Head } from '../components/Head'
import { Footer } from '../components/Footer'

interface Props {
  session: UserSession | null
}

export const getServerSideProps: GetServerSideProps<Props> | Redirect = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res)

  if (!resolvedConfig.isHosted && !session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
  return {
    props: {
      session
    }
  }
}

export default function Home(props: Props) {
  if (!props.session) return null

  return (
    <div>
      <Head title="Dashboard" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        </div>

        {/* This component will now finally load your 12 reviews */}
        <ProjectList />
      </main>
      <Footer />
    </div>
  )
}
