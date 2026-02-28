import { Container, Stack, Title, Text, Divider, Textarea, Box, Button, Anchor } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Comment, Page, Project } from "@prisma/client"
import { useRouter } from "next/router"
import React from "react"
import { useMutation } from "react-query"
import { Head } from "../../components/Head"
import { CommentService } from "../../service/comment.service"
import { SecretKey, TokenService } from "../../service/token.service"
import { apiClient } from "../../utils.client"
import { prisma } from "../../utils.server"
import { ErrorCode } from "../error"

const approveComment = async ({ token }) => {
  const res = await apiClient.post(`/open/approve?token=${token}`)
  return res.data
}

const appendReply = async ({ replyContent, token }) => {
  const res = await apiClient.post(`/open/approve?token=${token}`, {
    replyContent
  })
  return res.data
}

// FIXED: Using Mapped Types to satisfy the UI while using the new DB schema
type CommentWithPage = Comment & {
  page: Page & {
    project: Project
  }
}

function ApprovePage(props: {
  comment: CommentWithPage
}) {

  const router = useRouter()
  const [replyContent, setReplyContent] = React.useState('')

  const appendReplyMutation = useMutation(appendReply, {
    onSuccess() {
      notifications.show({
        title: 'Success',
        message: 'Reply appended',
        color: 'green'
      })
      setReplyContent('')
    },
    onError(data: any) {
      const {
        error: message,
        status: statusCode
      } = data.response.data

      notifications.show({
        title: "Error",
        message,
        color: 'yellow'
      })
    }
  })

  const approveCommentMutation = useMutation(approveComment, {
    onSuccess() {
      notifications.show({
        title: 'Success',
        message: 'Comment approved',
        color: 'green'
      })
      location.reload()
    },
    onError(data: any) {
      const {
        error: message,
        status: statusCode
      } = data.response.data

      notifications.show({
        title: "Error",
        message,
        color: 'yellow'
      })
    }
  })

  if (!props.comment) {
    return (
      <Container mt={50}>
        <Title order={2}>Comment Not Found</Title>
        <Text color="gray">This link may have expired.</Text>
      </Container>
    )
  }

  return (
    <>
      <Head title="New comment - Cusdis" />
      <Container mt={12} my={12}>
        <Stack>
          <Title mb={12}>Cusdis</Title>

          <Stack spacing={4}>
            <Text>New comment on site <strong>{props.comment.page.project.title}</strong>, page <Anchor weight={'bold'} target="_blank" href={props.comment.page.url}>{props.comment.page.title || props.comment.page.slug}</Anchor></Text>
            <Text>From: <strong>{props.comment.by_nickname}</strong> ({props.comment.by_email || 'Email not provided'})</Text>
            <Text sx={theme =>({
              whiteSpace: 'pre-wrap',
              backgroundColor: theme.colors.gray[0],
              padding: theme.spacing.md
            })} component='pre' w="full" size="sm">{props.comment.content}</Text>
          </Stack>

          <Box>
            {
              props.comment.approved ? <Button disabled>Approved</Button> : <Button onClick={_ => {
                approveCommentMutation.mutate({
                  token: router.query.token as string
                })
              }} loading={approveCommentMutation.isLoading} color="telegram">
                Approve
              </Button>
            }
          </Box>

          <Divider my={24} />

          <Stack>
            <Textarea placeholder="Your comment..." value={replyContent} onChange={e => setReplyContent(e.target.value)}></Textarea>
            <Text size="sm" color="gray">* Appending reply to a comment will automatically approve the comment</Text>

            <Button onClick={_ => {
              appendReplyMutation.mutate({
                token: router.query.token as string,
                replyContent
              })
            }} loading={appendReplyMutation.isLoading} mt={4}>Append reply</Button>
          </Stack>
        </Stack>
      </Container>
    </>
  )
}

function redirectError(code: ErrorCode) {
  return {
    redirect: {
      destination: `/error?code=${code}`,
      permanent: false
    }
  }
}

export async function getServerSideProps(ctx) {
  const tokenService = new TokenService()
  const { token } = ctx.query

  if (!token) {
    return redirectError(ErrorCode.INVALID_TOKEN)
  }

  let commentId
  try {
    commentId = tokenService.validate(token, SecretKey.ApproveComment).commentId
  } catch (e) {
    return redirectError(ErrorCode.INVALID_TOKEN)
  }

  // FIXED: Prisma select block must use 'Page' (Capital P) to match your schema
  const data = await prisma.comment.findUnique({
    where: {
      id: commentId
    },
    select: {
      id: true,
      by_nickname: true,
      by_email: true,
      content: true,
      approved: true,
      Page: { 
        select: {
          title: true,
          slug: true,
          url: true,
          project: {
            select: {
              title: true
            }
          }
        }
      }
    }
  })

  // FIXED: Manually mapping the 'Page' property back to lowercase 'page' for the UI
  const comment = data ? {
    ...data,
    page: data.Page
  } : null

  return {
    props: {
      comment: JSON.parse(JSON.stringify(comment))
    }
  }
}

export default ApprovePage
