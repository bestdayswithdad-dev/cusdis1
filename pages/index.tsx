import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Title, Text, Button, Stack, Container, Paper, Center, Table, Badge, Group, ActionIcon } from '@mantine/core'
import { AiOutlineCheck, AiOutlineDelete } from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com' // Your specific admin account

export default function CustomDashboard() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])

  useEffect(() => {
    // 1. Initial Session Check
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user?.email === ADMIN_EMAIL) {
        fetchComments()
      }
      setLoading(false)
    }
    init()

    // 2. Listen for Magic Link Logins (The "Nothing Happened" Fix)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (_event === 'SIGNED_IN' && session?.user?.email === ADMIN_EMAIL) {
        fetchComments()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 3. Fetch the 12 Reviews via API (We will build this API route next)
  const fetchComments = async () => {
    const res = await fetch('/api/comments')
    const data = await res.json()
    setComments(data.comments || [])
  }

  if (loading) return <Center h="100vh"><Text>Loading Moderation Tools...</Text></Center>

  // THE ADMIN GATE
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder shadow="md">
          <Title order={2}>Access Denied</Title>
          <Text mt="md">Only the site owner can access the moderation dashboard.</Text>
          <Button mt="lg" onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Paper p="md" bg="blue.0" withBorder>
          <Group position="apart">
            <Text weight={700}>Moderator: {user.email}</Text>
            <Button size="xs" color="red" variant="subtle" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>
              Logout
            </Button>
          </Group>
        </Paper>

        <Title order={1}>Comment Moderation</Title>
        <Text color="dimmed">Managing {comments.length} total reviews.</Text>

        <Paper withBorder shadow="xs">
          <Table verticalSpacing="sm">
            <thead>
              <tr>
                <th>Author</th>
                <th>Comment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td><Text size="sm" weight={600}>{c.by_nickname}</Text></td>
                  <td><Text size="xs">{c.content}</Text></td>
                  <td>
                    {c.approved ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}
                  </td>
                  <td>
                    <Group spacing={4} position="right">
                      <ActionIcon color="green" variant="light"><AiOutlineCheck size="1rem" /></ActionIcon>
                      <ActionIcon color="red" variant="light"><AiOutlineDelete size="1rem" /></ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {comments.length === 0 && <Center p="xl"><Text color="dimmed">No reviews found matching your ID.</Text></Center>}
        </Paper>
      </Stack>
    </Container>
  )
}
