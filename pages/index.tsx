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

  const fetchComments = async () => {
    try {
        const res = await fetch('/api/public-comments') 
        const data = await res.json()
        if (Array.isArray(data)) setComments(data)
        else if (data.comments) setComments(data.comments)
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
    const pending = comments.filter(c => !c.approved && !c.content?.toLowerCase().includes('http'));
    const pageGroups = comments.reduce((acc: any, c) => {
      const title = c.Page?.title || 'General / Legacy'; 
      if (!acc[title]) acc[title] = [];
      acc[title].push(c);
      return acc;
    }, {});
    return { flagged, pending, pageGroups };
  }, [comments]);

  // DIRECT TO WEBSITE REPLY LOGIC
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
        nickname: "Host",
        pageId: replyModal.pageId,
        pageTitle: replyModal.pageTitle,
        parentId: replyModal.parentId, // Correctly threads the reply
      })
    });

    if (res.ok) {
      setReplyModal({ ...replyModal, opened: false });
      setReplyContent('');
      fetchComments();
    }
  }

  const handleApprove = async (id: string) => {
    await fetch(`/api/public-comments?id=${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
    })
    fetchComments()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this comment?")) {
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
            <td>
              <Text size="md" weight={700}>{c.by_nickname || 'Guest'}</Text>
              <Text size="xs" color="dimmed">{c.by_email}</Text>
              <Group spacing={4} mt={4}>
                <AiOutlineGlobal size="0.8rem" color="gray" />
                <Text size="xs" color="blue" italic>{c.ip || '0.0.0.0'}</Text>
              </Group>
            </td>
            <td><Text size="md" style={{ lineHeight: 1.5 }}>{c.content}</Text></td>
            <td>
              <Stack spacing={4}>
                <Text size="sm" weight={700} color="blue">{c.Page?.title || 'General'}</Text>
                <Text size="xs" color="dimmed" truncate>{c.Page?.slug}</Text>
              </Stack>
            </td>
            <td>{c.approved ? <Badge color="green">Public</Badge> : <Badge color="yellow">Pending</Badge>}</td>
            <td>
              <Group spacing="xs" position="right">
                {!c.approved && (
                  <ActionIcon size="lg" color="green" variant="filled" onClick={() => handleApprove(c.id)} title="Approve">
                    <AiOutlineCheck size="1.4rem" />
                  </ActionIcon>
                )}
                {/* RESTORED REPLY BUTTON */}
                <ActionIcon size="lg" color="blue" variant="light" onClick={() => setReplyModal({ opened: true, parentId: c.id, pageId: c.Page?.slug, pageTitle: c.Page?.title, nickname: c.by_nickname })} title="Reply to Site">
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

  if (loading) return <Center h="100vh"><Text>Loading...</Text></Center>
  if (!user || user.email !== ADMIN_EMAIL) return <Center h="100vh"><Text>Access Denied</Text></Center>

  return (
    <Container size="xl" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Moderation Center</Title>

        <Tabs defaultValue="pending" variant="outline" color="blue">
          <Tabs.List mb="md">
            <Tabs.Tab value="pending" icon={<AiOutlineClockCircle size="1.2rem" />} color="yellow">Pending ({organizedData.pending.length})</Tabs.Tab>
            <Tabs.Tab value="all" icon={<AiOutlineMessage size="1.2rem" />}>All</Tabs.Tab>
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

        {/* DIRECT REPLY MODAL */}
        <Modal opened={replyModal.opened} onClose={() => setReplyModal({ ...replyModal, opened: false })} title={`Reply to ${replyModal.nickname}`}>
          <Stack>
            <Text size="sm" color="dimmed">Your reply will appear instantly on the website under the "{replyModal.pageTitle}" post.</Text>
            <Textarea placeholder="Write your response..." minRows={4} value={replyContent} onChange={(e) => setReplyContent(e.currentTarget.value)} />
            <Button color="blue" onClick={submitDashboardReply}>Post Reply to Website</Button>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  )
}
