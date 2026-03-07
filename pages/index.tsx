import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useMemo } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  TextInput, Textarea, Divider, Tabs
} from '@mantine/core'
import { 
  AiOutlineCheck, AiOutlineDelete, AiOutlineAlert, 
  AiOutlineMessage, AiOutlineFlag, AiOutlineFileText,
  AiOutlineClockCircle
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

  const fetchComments = async () => {
    // Note: Ensure this matches your API route name (e.g., /api/admin-bridge)
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

  // UPDATED: Logic to separate Pending from Flagged
  const organizedData = useMemo(() => {
    // "Flagged" is now strictly for posts containing links
    const flagged = comments.filter(c => c.content.toLowerCase().includes('http')); 
    
    // "Pending" is for unapproved posts that aren't flagged
    const pending = comments.filter(c => !c.approved && !c.content.toLowerCase().includes('http'));

    const pageGroups = comments.reduce((acc: any, c) => {
      const title = c.Page?.title || 'General / Legacy';
      if (!acc[title]) acc[title] = [];
      acc[title].push(c);
      return acc;
    }, {});

    return { flagged, pending, pageGroups };
  }, [comments]);

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

  const CommentTable = ({ data }: { data: any[] }) => (
    <Table verticalSpacing="md" horizontalSpacing="md" fontSize="md">
      <thead>
        <tr>
          <th>User</th>
          <th>Comment</th>
          <th>Post Name</th>
          <th>Status</th>
          <th style={{ textAlign: 'right' }}>Mod Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id}>
            <td style={{ minWidth: '180px' }}>
              <Text size="md" weight={600}>{c.by_nickname || 'Guest'}</Text>
              <Text size="sm" color="dimmed">{c.by_email}</Text>
            </td>
            <td><Text size="md" style={{ lineHeight: 1.5 }}>{c.content}</Text></td>
            <td style={{ minWidth: '200px' }}>
              <Stack spacing={4}>
                <Text size="sm" weight={700} color="blue">{c.Page?.title || 'General / Legacy'}</Text>
                <Text size="xs" color="dimmed" truncate>{c.Page?.slug}</Text>
              </Stack>
            </td>
            <td>
              {c.approved ? <Badge color="green">Public</Badge> : 
               c.content.toLowerCase().includes('http') ? <Badge color="red">SPAM/LINK</Badge> :
               <Badge color="yellow">Pending</Badge>}
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
  );

  if (loading) return <Center h="100vh"><Text size="xl">Loading Moderation Tools...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Paper p="xl" withBorder><Text size="lg">Access Denied</Text></Paper></Center>

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation & Policy Center</Title>

        <Tabs defaultValue="pending" variant="outline" color="blue">
          <Tabs.List mb="md">
            <Tabs.Tab value="pending" icon={<AiOutlineClockCircle size="1.2rem" />} color="yellow">
              <Text weight={600}>Pending ({organizedData.pending.length})</Text>
            </Tabs.Tab>
            <Tabs.Tab value="all" icon={<AiOutlineMessage size="1.2rem" />}>
              All ({comments.length})
            </Tabs.Tab>
            <Tabs.Tab value="flagged" icon={<AiOutlineFlag size="1.2rem" />} color="red">
              Flagged ({organizedData.flagged.length})
            </Tabs.Tab>
            {Object.keys(organizedData.pageGroups).map(title => (
              <Tabs.Tab key={title} value={title} icon={<AiOutlineFileText size="1.2rem" />}>
                {title}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="pending">
            <Paper withBorder shadow="md" p="lg">
              <CommentTable data={organizedData.pending} />
              {organizedData.pending.length === 0 && <Center p="xl"><Text color="dimmed">No pending reviews.</Text></Center>}
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="all">
            <Paper withBorder shadow="md" p="lg">
              <CommentTable data={comments} />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="flagged">
            <Paper withBorder shadow="md" p="lg" sx={{ borderColor: '#fa5252' }}>
              <CommentTable data={organizedData.flagged} />
              {organizedData.flagged.length === 0 && <Center p="xl"><Text color="dimmed">Clear of spam links!</Text></Center>}
            </Paper>
          </Tabs.Panel>

          {Object.entries(organizedData.pageGroups).map(([title, data]: any) => (
            <Tabs.Panel key={title} value={title}>
              <Paper withBorder shadow="md" p="lg">
                <CommentTable data={data} />
              </Paper>
            </Tabs.Panel>
          ))}
        </Tabs>

        <Divider label="Policy Enforcement Email" labelPosition="center" />
        <Paper withBorder p="xl" bg="gray.0" shadow="sm">
          <Stack spacing="md">
            <TextInput label="Recipient" value={emailData.to} readOnly />
            <TextInput label="Subject" value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} />
            <Textarea label="Message" minRows={6} value={emailData.body} onChange={(e) => setEmailData({...emailData, body: e.target.value})} />
            <Button size="lg" color="dark" fullWidth onClick={() => alert("Email logic connection required")}>
              Send Official Mod Email
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
