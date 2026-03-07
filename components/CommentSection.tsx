import { useState, useEffect } from 'react'
// Added Group to the import list below
import { Stack, Textarea, TextInput, Button, Paper, Text, Divider, Badge, Center, Group } from '@mantine/core'

export default function CommentSection() {
  const [comments, setComments] = useState([])
  const [formData, setFormData] = useState({ nickname: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadComments = () => {
    fetch('/api/public-comments')
      .then(res => res.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
  }

  useEffect(() => { loadComments() }, [])

  const handleSubmit = async () => {
    if (!formData.content) return
    setLoading(true)
    const res = await fetch('/api/public-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (res.ok) {
      setMsg('Thank you for commenting! Your comment will appear once approved.')
      setFormData({ nickname: '', content: '' })
      loadComments()
    }
    setLoading(false)
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
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
          />
          <Textarea 
            placeholder="What's on your mind?" 
            minRows={3}
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
          <Button onClick={handleSubmit} loading={loading} variant="filled" color="blue">
            Submit Review
          </Button>
          {msg && <Text color="green" size="xs" align="center">{msg}</Text>}
        </Stack>
      </Paper>

      <Stack spacing="md">
        {comments.map((c: any) => (
          <Paper key={c.id} withBorder p="md" shadow="xs">
            {/* Group is now correctly imported */}
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
