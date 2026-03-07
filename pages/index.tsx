import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  TextInput, Textarea, Divider
} from '@mantine/core'
import { AiOutlineCheck, AiOutlineDelete, AiOutlineAlert, AiOutlineMessage } from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

  const fetchComments = async () => {
    const res = await fetch('/api/comments')
    const data = await res.json()
    // data.comments now includes the Page relation from our API update
    setComments(data.comments || [])
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

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: 'PATCH' })
    if (res.ok) fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this comment?")) {
      await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
      fetchComments()
    }
  }

  const prepareWarning = (email: string, content: string) => {
    setEmailData({
      to: email || '',
      subject: 'Policy Violation Warning - Best Days With Dad',
      body: `Hi,\n\nYour recent comment ("${content}") has been flagged for violating our community guidelines. Please ensure future posts remain respectful.\n\nBest,\nMod Team`
    })
  }

  const prepareReply = (email: string, content: string) => {
    setEmailData({
      to: email || '',
      subject: 'Moderator Response to your Review',
      body: `\n\n--- In response to your comment ---\n"${content}"\n\nHi! Thanks for reaching out. My answer to your question is...`
    })
  }

  if (loading) return <Center h="100vh"><Text>Loading Moderation Tools...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Paper p="xl" withBorder>Access Denied</Paper></Center>

  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation & Policy Center</Title>
        
        <Paper withBorder shadow="xs" p="md">
          <Table verticalSpacing="sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Comment</th>
                <th>Post Name</th> {/* NEW COLUMN */}
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Mod Actions</th>
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
                  
                  {/* NEW: Display the Readable Title we generated */}
                  <td>
                    <Text size="xs" weight={700} color="blue">
                      {c.Page?.title || 'General / Legacy'}
                    </Text>
                    <Text size="10px" color="dimmed" truncate style={{ maxWidth: '150px' }}>
                      {c.Page?.slug}
                    </Text>
                  </td>

                  <td>{c.approved ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}</td>
                  
                  <td>
                    <Group spacing={4} position="right">
                      {!c.approved && (
                        <ActionIcon color="green" variant="filled" onClick={() => handleApprove(c.id)} title="Approve">
                          <AiOutlineCheck size="1rem" />
                        </ActionIcon>
                      )}
                      <ActionIcon color="orange" variant="light" onClick={() => prepareWarning(c.by_email, c.content)} title="Warning">
                        <AiOutlineAlert size="1rem" />
                      </ActionIcon>
                      <ActionIcon color="blue" variant="light" onClick={() => prepareReply(c.by_email, c.content)} title="Reply">
                        <AiOutlineMessage size="1rem" />
                      </ActionIcon>
                      <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(c.id)} title="Delete">
                        <AiOutlineDelete size="1rem" />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>

        <Divider label="Policy Enforcement Email" labelPosition="center" />

        <Paper withBorder p="xl" bg="gray.0">
          <Stack>
            <TextInput label="Recipient" value={emailData.to} readOnly />
            <TextInput label="Subject" value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} />
            <Textarea label="Message" minRows={6} value={emailData.body} onChange={(e) => setEmailData({...emailData, body: e.target.value})} />
            <Button color="dark" fullWidth onClick={() => alert("Email logic connection required")}>
              Send Official Mod Email
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
