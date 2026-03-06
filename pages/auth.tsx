import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AuthPage() {
  const supabase = useSupabaseClient()
  const router = useRouter()

  // This listener detects when the user successfully signs in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Once signed in, send them back to the dashboard
        router.push('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return (
    <div style={{ 
      maxWidth: '420px', 
      margin: '80px auto', 
      padding: '40px', 
      borderRadius: '16px', 
      backgroundColor: '#fff',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Welcome to Cusdis</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Sign in to manage your comments.</p>
      
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="light"
        providers={[]} 
      />
    </div>
  )
}
