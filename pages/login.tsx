import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Container, Paper, Title, TextInput, Button, Stack, Text } from '@mantine/core'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { emailRedirectTo: `${window.location.origin}/` }
    })
    
    if (error) setMessage(error.message)
    else setMessage('Success! Check your email for the magic link.')
    setLoading(false)
  }

  return (
    <Container size={420} my={40}>
      <Title align="center">Welcome Back</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleLogin}>
          <Stack>
            <TextInput 
              label="Email" 
              placeholder="you@example.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <Button type="submit" fullWidth loading={loading}>
              Send Magic Link
            </Button>
            {message && <Text size="sm" color="blue" align="center">{message}</Text>}
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
