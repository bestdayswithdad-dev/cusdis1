import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Title, Text, Button, Stack, Container, Paper } from '@mantine/core'

export default function CustomDashboard() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      // LOGIC FOR SIGNUP BONUS:
      // If user just signed up, you can trigger a "Bonus" API call here.
      if (session?.user && !localStorage.getItem('bonus_claimed')) {
        console.log("Triggering signup bonus for:", session.user.email)
        // fetch('/api/claim-bonus', { method: 'POST' })
      }
    }
    getUser()
  }, [])

  return (
    <Container size="sm" py="xl">
      <Paper shadow="xs" p="xl" withBorder>
        <Stack>
          <Title order={1}>My Custom Dashboard</Title>
          {user ? (
            <>
              <Text>Welcome back, <b>{user.email}</b></Text>
              <Text color="green" weight={700}>Bonus Status: Active</Text>
              <Button color="red" variant="outline" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Text>Sign in to manage your comments and claim your bonus.</Text>
              <Button onClick={() => window.location.href = '/auth'}>Go to Login</Button>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
