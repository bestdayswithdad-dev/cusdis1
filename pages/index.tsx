import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useMemo } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  Textarea, Tabs, Modal
} from '@mantine/core'
import { 
  AiOutlineCheck, AiOutlineDelete, AiOutlineMessage, 
  AiOutlineFileText, AiOutlineClockCircle 
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  
  const [replyModal, setReplyModal] = useState({ opened: false, parentId: '', pageId: '', pageTitle: '', nickname: '' })
  const [replyContent, setReplyContent] = useState('')

  const fetchComments = async () => {
    try {
        const res = await fetch('/api/moderator-bridge') 
        const data = await res.json()
        const fetched = data.comments || data
        setComments(Array.isArray(fetched) ? fetched : [])
    } catch (err) { 
        console.error("Fetch failed", err)
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
    if (!Array.isArray(comments)) return { pending: [], pageGroups: {} };
    
    const pending = comments.filter(c => c.status === 0);
    
    const pageGroups = comments.reduce((acc: any, c) => {
      // Accessing plural 'pages' relation per project schema
      const title = c.pages?.title || 'General / Legacy'; 
      if (!acc[title]) acc[title] = [];
      acc[title].push(c);
      return acc;
    }, {});
    
    return { pending, pageGroups };
  }, [comments]);

  const handleApprove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/moderator-bridge?id=${id}`, { 
        method: 'PATCH',
        headers: { 
            'Authorization': `Bearer ${session?.access_token}` // Pattern matched to Reply button
        }
    })
    fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this comment?")) {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/moderator-bridge?id=${id}`, { 
          method: 'DELETE',
          headers: { 
              'Authorization': `Bearer ${session?.access_token}` // Pattern matched to Reply button
          }
      })
      fetchComments()
    }
  }

  const submitDashboardReply = async () => {
    if (!replyContent.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch('/api/public-comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        content: replyContent,
        nickname: "Adam - BDWD",
        pageId: replyModal.pageId,
        pageTitle: replyModal.pageTitle,
        parentId: replyModal.parentId,
        by_email: ADMIN_EMAIL
      })
    });

    if (res.ok) {
      setReplyModal({ ...replyModal, opened: false });
      setReplyContent('');
      fetchComments();
    }
  }

  const CommentTable = ({ data }: { data: any[] }) => (
    <Table verticalSpacing="md" horizontalSpacing="md">
      <thead>
        <tr>
          <th>User</th>
          <th>Comment</th>
          <th>Post</th>
          <th>Status</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((c) => (
          <tr key={c.id}>
            <td>
              <Text weight={700}>{c.by_nickname || 'Guest'}</Text>
              <Text size="xs" color="dimmed">{c.by_email}</Text>
            </td>
            <td><Text size="sm">{c.content}</Text></td>
            <td>
              <Text size="xs" weight={700}>{c.pages?.title || 'General'}</Text>
            </td>
            <td>
                {c.status === 1 ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}
            </td>
            <td>
              <Group spacing="xs" position="right">
                {c.status === 0 && (
                  <ActionIcon color="green" variant="filled" onClick={() => handleApprove(c.id)}>
                    <AiOutlineCheck />
                  </ActionIcon>
                )}
                <ActionIcon color="blue" variant="light" onClick={() => setReplyModal({ opened: true, parentId: c.id, pageId: c.pages?.slug, pageTitle: c.pages?.title, nickname: c.by_nickname })}>
                  <AiOutlineMessage />
                </ActionIcon>
                <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(c.id)}>
                  <AiOutlineDelete />
                </ActionIcon>
              </Group>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  if (loading) return <Center h="100vh"><Text>Loading...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Text>Access Denied</Text></Center>

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Title order={2}>Moderation Center</Title>

        <Tabs defaultValue="pending">
          <Tabs.List>
            <Tabs.Tab value="pending" icon={<AiOutlineClockCircle />}>
              Pending ({organizedData.pending.length})
            </Tabs.Tab>
            <Tabs.Tab value="all">
              All ({comments.length})
            </Tabs.Tab>
            {Object.entries(organizedData.pageGroups).map(([title, data]: [string, any]) => (
              <Tabs.Tab key={title} value={title} icon={<AiOutlineFileText />}>
                {title} ({data.length})
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="pending" pt="md">
            <Paper withBorder p="md"><CommentTable data={organizedData.pending} /></Paper>
          </Tabs.Panel>
          <Tabs.Panel value="all" pt="md">
            <Paper withBorder p="md"><CommentTable data={comments} /></Paper>
          </Tabs.Panel>
          {Object.entries(organizedData.pageGroups).map(([title, data]: any) => (
            <Tabs.Panel key={title} value={title} pt="md">
              <Paper withBorder p="md"><CommentTable data={data} /></Paper>
            </Tabs.Panel>
          ))}
        </Tabs>

        <Modal opened={replyModal.opened} onClose={() => setReplyModal({ ...replyModal, opened: false })} title={`Reply to ${replyModal.nickname}`}>
          <Stack>
            <Textarea placeholder="Write your response..." minRows={4} value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)} />
            <Button onClick={submitDashboardReply}>Post Reply</Button>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}
