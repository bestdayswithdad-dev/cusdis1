import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { Title, Text, Button, Stack, Container, Paper, Center, Table, Badge, Group, ActionIcon } from '@mantine/core'
import { AiOutlineCheck, AiOutlineDelete } from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function CustomDashboard() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments')
      const data = await res.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error("Fetch error:", err)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user?.email === ADMIN_EMAIL) fetchComments()
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (_event === 'SIGNED_IN' && session?.user?.email === ADMIN_EMAIL) fetchComments()
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) return <Center h="100vh"><Text>Loading...</Text></Center>

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder shadow="md">
          <Title order={2}>Moderator Login Required</Title>
          <Button mt="lg" onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
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
                  <td>{c.approved ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}</td>
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
          {comments.length === 0 && <Center p="xl"><Text color="dimmed">No reviews found.</Text></Center>}
        </Paper>
      </Stack>
    </Container>
  )
}
