import { useState, useEffect } from 'react'
import { Stack, Textarea, TextInput, Button, Paper, Text, Divider, Badge, Center, Group } from '@mantine/core'

interface CommentItem {
  id: string | number
  by_nickname?: string
  content: string
  created_at?: string
}

export default function CommentSection() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [formData, setFormData] = useState({ nickname: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadComments = async () => {
    try {
      const res = await fetch('/api/public-comments')
      if (res.ok) {
        const data = await res.json()
        setComments(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load comments:', err)
      setComments([])
    }
  }

  useEffect(() => { 
    loadComments() 
  }, [])

  const handleSubmit = async () => {
    if (!formData.content.trim()) return
    setLoading(true)
    setMsg('')

    try {
      const res = await fetch('/api/public-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setMsg('Thank you for commenting! Your comment will appear once approved.')
        setFormData({ nickname: '', content: '' })
        loadComments()
      } else {
        setMsg('Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Failed to submit comment:', err)
      setMsg('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing="xl" py="xl">
      <Divider label="Community Reviews" labelPosition="center" />
      
      <Paper withBorder p="md" shadow="xs" bg="gray.0">
        <Text size="sm" weight={700} mb="xs">Write a Review</Text>
        <Stack spacing="sm">
          <TextInput 
            placeholder="Nickname (Optional)" 
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          />
          <Textarea 
            placeholder="What's on your mind?" 
            minRows={3}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <Button onClick={handleSubmit} loading={loading} variant="filled" color="blue">
            Submit Review
          </Button>
          {msg && <Text color={msg.startsWith('Thank') ? 'green' : 'red'} size="xs" align="center">{msg}</Text>}
        </Stack>
      </Paper>

      <Stack spacing="md">
        {comments.map((c) => (
          <Paper key={c.id} withBorder p="md" shadow="xs">
            <Group position="apart" mb="xs">
              <Text weight={600} size="sm">{c.by_nickname || 'Guest'}</Text>
              <Badge size="xs" color="gray">Casual Adventurer</Badge>
            </Group>
            <Text size="sm">{c.content}</Text>
          </Paper>
        ))}
        {comments.length === 0 && (
          <Center p="xl"><Text color="dimmed" size="sm">No approved reviews yet. Be the first!</Text></Center>
        )}
      </Stack>
    </Stack>
  )
}
