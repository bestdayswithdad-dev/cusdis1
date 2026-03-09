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
  AiOutlineClockCircle, AiOutlineGlobal
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([]) // Initialized as empty array
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

  const fetchComments = async () => {
    try {
        const res = await fetch('/api/public-comments') 
        const data = await res.json()
        
        // SAFETY CHECK: Ensure we only set the state if data is an array
        if (Array.isArray(data)) {
            setComments(data)
        } else if (data.comments && Array.isArray(data.comments)) {
            setComments(data.comments)
        } else {
            console.error("API returned non-array data:", data)
            setComments([]) // Fallback to empty list to prevent crash
        }
    } catch (err) {
        console.error("Failed to fetch comments:", err)
        setComments([])
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

  const organizedData = useMemo(() => {
    // SAFETY CHECK: If comments isn't an array yet, return empty groups
    if (!Array.isArray(comments)) return { flagged: [], pending: [], pageGroups: {} };

    const flagged = comments.filter(c => c.content?.toLowerCase().includes('http')); 
    const pending = comments.filter(c => !c.approved && !c.content?.toLowerCase().includes('http'));

    const pageGroups = comments.reduce((acc: any, c) => {
      const title = c.Page?.title || 'General / Legacy'; 
      if (!acc[title]) acc[title] = [];
      acc[title].push(c);
      return acc;
    }, {});

    return { flagged, pending, pageGroups };
  }, [comments]);

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/public-comments?id=${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
    })
    if (res.ok) fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this comment?")) {
      await fetch(`/api/public-comments?id=${id}`, { method: 'DELETE' })
      fetchComments()
    }
  }

  const CommentTable = ({ data }: { data: any[] }) => (
    <Table verticalSpacing="md" horizontalSpacing="md" fontSize="md">
      <thead>
        <tr>
          <th>User / IP</th>
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
              <Text size="md" weight={700} color="dark">{c.by_nickname || 'Guest'}</Text>
              <Text size="xs" color="dimmed" weight={500}>{c.by_email}</Text>
              <Group spacing={4} mt={4}>
                <AiOutlineGlobal size="0.8rem" color="gray" />
                <Text size="xs" color="blue" italic>{c.ip || 'No IP Captured'}</Text>
              </Group>
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
               c.content?.toLowerCase().includes('http') ? <Badge color="red">SPAM/LINK</Badge> :
               <Badge color="yellow">Pending</Badge>}
            </td>
            <td style={{ textAlign: 'right' }}>
              <Group spacing="xs" position="right">
                {!c.approved && (
                  <ActionIcon size="lg" color="green" variant="filled" onClick={() => handleApprove(c.id)} title="Approve">
                    <AiOutlineCheck size="1.4rem" />
                  </ActionIcon>
                )}
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
      </Stack>
    </Container>
  )
}
