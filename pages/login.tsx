import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Container, Paper, Title, TextInput, Button, Stack, Text, Divider } from '@mantine/core'
import { FcGoogle } from 'react-icons/fc'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/` }
      })
      
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Success! Check your email for the magic link.')
      }
    } catch (err: any) {
      setMessage(err.message || 'Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) setMessage(error.message)
    } catch (err: any) {
      setMessage(err.message || 'Failed to connect with Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title align="center" order={2}>Welcome Back</Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Sign in to the Best Days With Dad Dashboard
      </Text>

      <Paper withBorder shadow="md" p={30} mt={25} radius="md">
        <Stack spacing="md">
          <Button
            leftIcon={<FcGoogle size="1.2rem" />}
            variant="default"
            color="gray"
            fullWidth
            loading={googleLoading}
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </Button>

          <Divider label="Or continue with email" labelPosition="center" my="xs" />

          <form onSubmit={handleMagicLink}>
            <Stack spacing="md">
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
            </Stack>
          </form>

          {message && (
            <Text 
              size="sm" 
              color={message.startsWith('Success') ? 'green' : 'red'} 
              align="center"
            >
              {message}
            </Text>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
