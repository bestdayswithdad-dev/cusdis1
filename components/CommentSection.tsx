import { useState, useEffect } from 'react'
import { Stack, Textarea, TextInput, Button, Paper, Text, Divider, Badge } from '@mantine/core'

export default function CommentSection() {
  const [comments, setComments] = useState([])
  const [formData, setFormData] = useState({ nickname: '', content: '' })
  const [submitted, setSubmitted] = useState(false)

  const loadComments = () => {
    fetch('/api/public-comments').then(res => res.json()).then(setComments)
  }

  useEffect(() => { loadComments() }, [])

  const handleSubmit = async () => {
    const res = await fetch('/api/public-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      setSubmitted(true)
      setFormData({ nickname: '', content: '' })
      loadComments()
    }
  }

  return (
    <Stack spacing="xl" mt="xl">
      <Divider label="Reader Reviews" labelPosition="center" />
      
      {/* THE FORM */}
      <Paper withBorder p="md" shadow="sm">
        <Text size="sm" weight={700} mb="xs">Leave a Review</Text>
        <Stack spacing="xs">
          <TextInput 
            placeholder="Your Nickname" 
            value={formData.nickname}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
          />
          <Textarea 
            placeholder="What did you think?" 
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
          <Button onClick={handleSubmit} color="blue">Post Comment</Button>
          {submitted && <Text color="green" size="xs">Thanks! Your post is live or awaiting moderation.</Text>}
        </Stack>
      </Paper>

      {/* THE LIST */}
      <Stack spacing="md">
        {comments.map((c: any) => (
          <Paper key={c.id} withBorder p="sm" bg="gray.0">
            <Text weight={600} size="sm">{c.by_nickname} <Badge size="xs" variant="outline">Verified Buyer</Badge></Text>
            <Text size="sm" mt="xs">{c.content}</Text>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}
