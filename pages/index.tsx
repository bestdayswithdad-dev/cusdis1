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

  if (loading) return <Center h="100vh"><Text size="xl">Loading Moderation Tools...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Paper p="xl" withBorder><Text size="lg">Access Denied</Text></Paper></Center>

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Title order={1} size="h1">Moderation & Policy Center</Title>
        
        <Paper withBorder shadow="md" p="lg">
          {/* Increased vertical spacing for better row separation */}
          <Table verticalSpacing="md" horizontalSpacing="md" fontSize="md">
            <thead>
              <tr>
                <th><Text size="md" weight={700}>User</Text></th>
                <th><Text size="md" weight={700}>Comment</Text></th>
                <th><Text size="md" weight={700}>Post Name</Text></th>
                <th><Text size="md" weight={700}>Status</Text></th>
                <th style={{ textAlign: 'right' }}><Text size="md" weight={700}>Mod Actions</Text></th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td style={{ minWidth: '180px' }}>
                    {/* Increased name to 'md' and email to 'sm' */}
                    <Text size="md" weight={600}>{c.by_nickname || 'Guest'}</Text>
                    <Text size="sm" color="dimmed">{c.by_email}</Text>
                  </td>
                  
                  <td>
                    {/* Increased comment text to 'md' for readability */}
                    <Text size="md" style={{ lineHeight: 1.5 }}>{c.content}</Text>
                  </td>
                  
                  <td style={{ minWidth: '200px' }}>
                    <Stack spacing={4}>
                      <Text size="sm" weight={700} color="blue">
                        {c.Page?.title || 'General / Legacy'}
                      </Text>
                      <Text size="xs" color="dimmed" truncate style={{ maxWidth: '200px' }}>
                        {c.Page?.slug}
                      </Text>
                    </Stack>
                  </td>

                  <td>
                    {/* Larger badges */}
                    {c.approved ? 
                      <Badge size="md" color="green" variant="filled">Public</Badge> : 
                      <Badge size="md" color="yellow" variant="filled">Pending</Badge>
                    }
                  </td>
                  
                  <td>
                    <Group spacing="xs" position="right">
                      {!c.approved && (
                        <ActionIcon size="lg" color="green" variant="filled" onClick={() => handleApprove(c.id)} title="Approve">
                          <AiOutlineCheck size="1.4rem" />
                        </ActionIcon>
                      )}
                      <ActionIcon size="lg" color="orange" variant="light" onClick={() => prepareWarning(c.by_email, c.content)} title="Warning">
                        <AiOutlineAlert size="1.4rem" />
                      </ActionIcon>
                      <ActionIcon size="lg" color="blue" variant="light" onClick={() => prepareReply(c.by_email, c.content)} title="Reply">
                        <AiOutlineMessage size="1.4rem" />
                      </ActionIcon>
                      <ActionIcon size="lg" color="red" variant="subtle" onClick={() => handleDelete(c.id)} title="Delete">
                        <AiOutlineDelete size="1.4rem" />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Paper>

        <Divider label={<Text size="lg">Policy Enforcement Email</Text>} labelPosition="center" />

        <Paper withBorder p="xl" bg="gray.0" shadow="sm">
          <Stack spacing="md">
            {/* Increased input and label sizes */}
            <TextInput 
              label={<Text size="md">Recipient</Text>} 
              size="md"
              value={emailData.to} 
              readOnly 
            />
            <TextInput 
              label={<Text size="md">Subject</Text>} 
              size="md"
              value={emailData.subject} 
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})} 
            />
            <Textarea 
              label={<Text size="md">Message</Text>} 
              size="md"
              minRows={8} 
              value={emailData.body} 
              onChange={(e) => setEmailData({...emailData, body: e.target.value})} 
            />
            <Button size="lg" color="dark" fullWidth onClick={() => alert("Email logic connection required")}>
              Send Official Mod Email
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
