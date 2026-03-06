import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  TextInput, Textarea, Divider 
} from '@mantine/core'
import { AiOutlineCheck, AiOutlineDelete, AiOutlineMail } from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function CustomDashboard() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments')
      const data = await res.json()
      setComments(data.comments || [])
    } catch (err) {
      console.error("Failed to load reviews")
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

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: 'PATCH' })
    if (res.ok) fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this review forever?")) {
      const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchComments()
    }
  }

  const prepareEmail = (email: string) => {
    setEmailData({
      to: email || '',
      subject: 'Your Signup Bonus is Ready!',
      body: 'Hi! Thank you for your review. Your signup bonus is now active.'
    })
  }

  if (loading) return <Center h="100vh"><Text>Loading Command Center...</Text></Center>

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder shadow="md">
          <Title order={2}>Admin Portal Locked</Title>
          <Button mt="lg" onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation Dashboard</Title>
        <Text color="dimmed">Managing {comments.length} total reviews.</Text>

        <Paper withBorder shadow="xs" p="md">
          <Table verticalSpacing="sm" highlightOnHover>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Content</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Text size="sm" weight={600}>{c.by_nickname || 'Guest'}</Text>
                    <Text size="xs" color="dimmed">{c.by_email}</Text>
                  </td>
                  <td><Text size="xs" italic>"{c.content}"</Text></td>
                  <td>
                    {c.approved ? <Badge color="green">Live</Badge> : <Badge color="yellow">Pending</Badge>}
                  </td>
                  <td>
                    <Group spacing={4} position="right">
                      {!c.approved && (
                        <Button variant="light" color="green" size="compact-xs" onClick={() => handleApprove(c.id)}>
                          Approve
                        </Button>
                      )}
                      <ActionIcon color="blue" variant="outline" onClick={() => prepareEmail(c.by_email)}>
                        <AiOutlineMail size="1rem" />
                      </ActionIcon>
                      <ActionIcon color="red" variant="outline" onClick={() => handleDelete(c.id)}>
                        <AiOutlineDelete size="1rem" />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>

        <Divider label="Email System" labelPosition="center" />

        <Paper withBorder p="xl" shadow="sm">
          <Title order={3} mb="sm">Send Bonus Notification</Title>
          <Stack>
            <TextInput label="To" value={emailData.to} onChange={(e) => setEmailData({...emailData, to: e.target.value})} />
            <TextInput label="Subject" value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} />
            <Textarea label="Message" minRows={4} value={emailData.body} onChange={(e) => setEmailData({...emailData, body: e.target.value})} />
            <Button color="blue" onClick={() => alert("Email logic coming next!")}>Send Notification</Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
