import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Title, Text, Button, Stack, Container, Paper, Center } from '@mantine/core'

export default function CustomDashboard() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
    // 1. Check existing session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    getUser()

    // 2. LISTEN for the Magic Link login event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (_event === 'SIGNED_IN') {
        console.log("Login caught! Bonus logic can trigger here.")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) return <Center h="100vh"><Text>Loading Dashboard...</Text></Center>

  return (
    <Container size="sm" py="xl">
      <Stack>
        <Paper shadow="xs" p="xl" withBorder>
          <Stack>
            <Title order={1}>My Custom Dashboard</Title>
            {user ? (
              <>
                <Text>Logged in as: <b>{user.email}</b></Text>
                <Text color="dimmed" size="sm">Your 12 reviews are safe in the database.</Text>
                
                {/* PLACEHOLDER FOR SIGNUP BONUS LOGIC */}
                <Paper p="md" bg="blue.0" withBorder>
                  <Text weight={700} color="blue">Bonus Status: Ready to Claim</Text>
                </Paper>

                <Button color="red" variant="outline" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Text>Sign in to manage your comments and claim your signup bonus.</Text>
                <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
