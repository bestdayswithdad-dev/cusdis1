import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, useMemo } from 'react'
import { 
  Title, Text, Button, Stack, Container, Paper, 
  Center, Table, Badge, Group, ActionIcon, 
  Textarea, Divider, Tabs, Modal
} from '@mantine/core'
import { 
  AiOutlineCheck, AiOutlineDelete, AiOutlineMessage, 
  AiOutlineFlag, AiOutlineFileText, AiOutlineClockCircle, 
  AiOutlineGlobal 
} from 'react-icons/ai'

const ADMIN_EMAIL = 'bestdayswithdad@gmail.com'

export default function ModerationCenter() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  
  // REPLY MODAL STATE
  const [replyModal, setReplyModal] = useState({ opened: false, parentId: '', pageId: '', pageTitle: '', nickname: '' })
  const [replyContent, setReplyContent] = useState('')

  // Hits the specific moderator bridge for secure admin actions
  const fetchComments = async () => {
    try {
        const res = await fetch('/api/moderator-bridge') 
        const data = await res.json()
        if (data.comments) setComments(data.comments)
        else if (Array.isArray(data)) setComments(data)
    } catch (err) { console.error("Fetch failed", err); setComments([]) }
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
    if (!Array.isArray(comments)) return { flagged: [], pending: [], pageGroups: {} };
    const flagged = comments.filter(c => c.content?.toLowerCase().includes('http')); 
    // Status 0 is Pending, Status 1 is Approved
    const pending = comments.filter(c => c.status === 0 && !c.content?.toLowerCase().includes('http'));
    const pageGroups = comments.reduce((acc: any, c) => {
      // Use plural 'pages' as per schema
      const title = c.pages?.title || 'General / Legacy'; 
      if (!acc[title]) acc[title] = [];
      acc[title].push(c);
      return acc;
    }, {});
    return { flagged, pending, pageGroups };
  }, [comments]);

  // Submit reply using the public endpoint with Host email for badge trigger
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
        by_email: ADMIN_EMAIL // Ensures badge is set to MOD
      })
    });

    if (res.ok) {
      setReplyModal({ ...replyModal, opened: false });
      setReplyContent('');
      fetchComments();
    }
  }

  const handleApprove = async (id: string) => {
    // Pass ID in query string as expected by moderator-bridge
    await fetch(`/api/moderator-bridge?id=${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    })
    fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this comment?")) {
      await fetch(`/api/moderator-bridge?id=${id}`, { method: 'DELETE' })
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
            <td>
              <Text size="md" weight={700}>{c.by_nickname || 'Guest'}</Text>
              <Text size="xs" color="dimmed">{c.by_email}</Text>
            </td>
            <td><Text size="md" style={{ lineHeight: 1.5 }}>{c.content}</Text></td>
            <td>
              <Stack spacing={4}>
                <Text size="sm" weight={700} color="blue">{c.pages?.title || 'General'}</Text>
                <Text size="xs" color="dimmed" truncate>{c.pages?.slug}</Text>
              </Stack>
            </td>
            <td>{c.status === 1 ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}</td>
            <td>
              <Group spacing="xs" position="right">
                {c.status !== 1 && (
                  <ActionIcon size="lg" color="green" variant="filled" onClick={() => handleApprove(c.id)} title="Approve">
                    <AiOutlineCheck size="1.4rem" />
                  </ActionIcon>
                )}
                <ActionIcon size="lg" color="blue" variant="light" onClick={() => setReplyModal({ opened: true, parentId: c.id, pageId: c.pages?.slug, pageTitle: c.pages?.title, nickname: c.by_nickname })} title="Reply as Host">
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

  if (loading) return <Center h="100vh"><Text>Authenticating Mod Access...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Text>Unauthorized Access</Text></Center>

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation Center</Title>

        <Tabs defaultValue="pending" variant="outline" color="blue">
          <Tabs.List mb="md">
            <Tabs.Tab value="pending" icon={<AiOutlineClockCircle size="1.2rem" />} color="yellow">Pending ({organizedData.pending.length})</Tabs.Tab>
            <Tabs.Tab value="all" icon={<AiOutlineMessage size="1.2rem" />}>All Comments</Tabs.Tab>
            {Object.keys(organizedData.pageGroups).map(title => (
              <Tabs.Tab key={title} value={title} icon={<AiOutlineFileText size="1.2rem" />}>{title}</Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="pending"><Paper withBorder p="lg"><CommentTable data={organizedData.pending} /></Paper></Tabs.Panel>
          <Tabs.Panel value="all"><Paper withBorder p="lg"><CommentTable data={comments} /></Paper></Tabs.Panel>
          {Object.entries(organizedData.pageGroups).map(([title, data]: any) => (
            <Tabs.Panel key={title} value={title}><Paper withBorder p="lg"><CommentTable data={data} /></Paper></Tabs.Panel>
          ))}
        </Tabs>

        <Modal opened={replyModal.opened} onClose={() => setReplyModal({ ...replyModal, opened: false })} title={`Reply to ${replyModal.nickname}`}>
          <Stack>
            <Text size="sm" color="dimmed">Post a reply as the host. This will automatically set your badge to MOD.</Text>
            <Textarea placeholder="Write your response..." minRows={4} value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)} />
            <Button color="blue" onClick={submitDashboardReply}>Post Reply to Website</Button>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}
