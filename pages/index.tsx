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
  
  // State for the Email Section
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

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
  }, [supabase])

  // BUTTON LOGIC: Approve a comment
  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: 'PATCH' })
    if (res.ok) fetchComments()
  }

  // BUTTON LOGIC: Delete a comment
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchComments()
    }
  }

  // PRE-FILL EMAIL: Helper to quickly message a reviewer
  const prepareEmail = (email: string) => {
    setEmailData({
      to: email,
      subject: 'Your Signup Bonus is Ready!',
      body: 'Hi! Thank you for your review. Your bonus code is: '
    })
  }

  if (loading) return <Center h="100vh"><Text>Loading Dashboard...</Text></Center>

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder shadow="md">
          <Title order={2}>Admin Access Required</Title>
          <Button mt="lg" onClick={() => window.location.href = '/login'}>Login</Button>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation Dashboard</Title>
        
        {/* REVIEWS TABLE */}
        <Paper withBorder shadow="xs" p="md">
          <Text weight={700} mb="md">Recent Reviews ({comments.length})</Text>
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
                  <td>
                    <Text size="sm" weight={600}>{c.by_nickname}</Text>
                    <Text size="xs" color="dimmed">{c.by_email}</Text>
                  </td>
                  <td><Text size="xs">{c.content}</Text></td>
                  <td>{c.approved ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}</td>
                  <td>
                    <Group spacing={4} position="right">
                      {!c.approved && (
                        <ActionIcon color="green" variant="light" onClick={() => handleApprove(c.id)}>
                          <AiOutlineCheck size="1rem" />
                        </ActionIcon>
                      )}
                      <ActionIcon color="blue" variant="light" onClick={() => prepareEmail(c.by_email)}>
                        <AiOutlineMail size="1rem" />
                      </ActionIcon>
                      <ActionIcon color="red" variant="light" onClick={() => handleDelete(c.id)}>
                        <AiOutlineDelete size="1rem" />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>

        <Divider />

        {/* EMAIL SECTION */}
        <Paper withBorder p="xl" shadow="sm">
          <Title order={3} mb="sm">Email Reviewer</Title>
          <Stack>
            <TextInput 
              label="To" 
              value={emailData.to} 
              onChange={(e) => setEmailData({...emailData, to: e.target.value})} 
            />
            <TextInput 
              label="Subject" 
              value={emailData.subject}
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
            />
            <Textarea 
              label="Message" 
              minRows={4} 
              value={emailData.body}
              onChange={(e) => setEmailData({...emailData, body: e.target.value})}
            />
            <Button color="blue" leftIcon={<AiOutlineMail />}>Send Notification</Button>
          </Stack>
        </Paper>

        <Button color="gray" variant="outline" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>
          Logout
        </Button>
      </Stack>
    </Container>
  )
}
