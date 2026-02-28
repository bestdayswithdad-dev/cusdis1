import { Comment, Page, Project } from '@prisma/client'
import { session, signIn } from 'next-auth/client'
import { useRouter } from 'next/router'
import React, { useRef } from 'react'
import { useMutation, useQuery } from 'react-query'
import { ProjectService } from '../../../service/project.service'
import { CommentItem, CommentWrapper } from '../../../service/comment.service'
import { apiClient } from '../../../utils.client'
import dayjs from 'dayjs'
import { useForm } from 'react-hook-form'
import { UserSession } from '../../../service'
import { Head } from '../../../components/Head'
import { getSession, resolvedConfig } from '../../../utils.server'
import { Footer } from '../../../components/Footer'
import { MainLayout } from '../../../components/Layout'
import { AiOutlineCode, AiOutlineUnorderedList, AiOutlineControl, AiOutlineCheck, AiOutlineClose, AiOutlineSmile } from 'react-icons/ai'
import { List, Stack, Box, Text, Group, Anchor, Button, Pagination, Textarea, Title, Center } from '@mantine/core'
import { MainLayoutData, ViewDataService } from '../../../service/viewData.service'
import { notifications } from '@mantine/notifications'

// API Handlers
const getComments = async ({ queryKey }) => {
  const [_key, { projectId, page }] = queryKey
  const res = await apiClient.get<{
    data: CommentWrapper,
  }>(`/project/${projectId}/comments`, {
    params: { page }
  })
  return res.data.data
}

const approveComment = async ({ commentId }) => {
  const res = await apiClient.post(`/comment/${commentId}/approve`)
  return res.data
}

const deleteComment = async ({ commentId }) => {
  const res = await apiClient.delete(`/comment/${commentId}`)
  return res.data
}

const replyAsModerator = async ({ parentId, content }) => {
  const res = await apiClient.post(`/comment/${parentId}/replyAsModerator`, {
    content
  })
  return res.data.data
}

// Components
function CommentToolbar(props: {
  comment: CommentItem,
  refetch: any,
}) {
  const [replyContent, setReplyContent] = React.useState("")
  const [isOpenReplyForm, setIsOpenReplyForm] = React.useState(false)

  const approveCommentMutation = useMutation(approveComment, {
    onSuccess() { props.refetch() },
    onError(data: any) {
      const message = data.response?.data?.error || "Error approving comment"
      notifications.show({ title: "Error", message, color: 'yellow' })
    }
  })
  const replyCommentMutation = useMutation(replyAsModerator, {
    onSuccess() {
      setIsOpenReplyForm(false)
      props.refetch()
    }
  })
  const deleteCommentMutation = useMutation(deleteComment, {
    onSuccess() { props.refetch() }
  })

  return (
    <Stack>
      <Group spacing={4}>
        {props.comment.approved ? (
          <Button leftIcon={<AiOutlineCheck />} color="green" size="xs" variant={'light'}>Approved</Button>
        ) : (
          <Button loading={approveCommentMutation.isLoading} onClick={() => {
            if (window.confirm("Approve this comment?")) {
              approveCommentMutation.mutate({ commentId: props.comment.id })
            }
          }} leftIcon={<AiOutlineSmile />} size="xs" variant={'subtle'}>Approve</Button>
        )}
        <Button onClick={() => setIsOpenReplyForm(!isOpenReplyForm)} size="xs" variant={'subtle'}>Reply</Button>
        <Button loading={deleteCommentMutation.isLoading} onClick={() => {
          if (window.confirm("Delete this comment?")) {
            deleteCommentMutation.mutate({ commentId: props.comment.id })
          }
        }} color="red" size="xs" variant={'subtle'}>Delete</Button>
      </Group>
      {isOpenReplyForm && (
        <Stack>
          <Textarea autosize minRows={2} onChange={e => setReplyContent(e.currentTarget.value)} placeholder="Reply as moderator" />
          <Button loading={replyCommentMutation.isLoading} onClick={() => {
            replyCommentMutation.mutate({ parentId: props.comment.id, content: replyContent })
          }} disabled={replyContent.length === 0} size="xs">Reply and approve</Button>
        </Stack>
      )}
    </Stack>
  )
}

// FIXED: Property types now match the Prisma Model names (snake_case)
export type ProjectServerSideProps = {
  id: string
  title: string
  owner_id: string
  token: string | null
  enable_notification: boolean
  webhook: string | null
  enable_webhook: boolean
}

function ProjectPage(props: {
  project: ProjectServerSideProps,
  session: UserSession,
  mainLayoutData: MainLayoutData
}) {
  React.useEffect(() => {
    if (!props.session) { signIn() }
  }, [props.session])

  if (!props.session) { return <div>Redirecting to signin..</div> }

  const [page, setPage] = React.useState(1)
  const router = useRouter()
  const getCommentsQuery = useQuery(['getComments', { projectId: router.query.projectId as string, page }], getComments)

  return (
    <>
      <MainLayout id="comments" project={props.project as any} {...props.mainLayoutData}>
        <Stack>
          <List listStyleType={'none'} styles={{
            root: { border: '1px solid #eee' },
            item: { backgroundColor: '#fff', padding: 12, ':not(:last-child)': { borderBottom: '1px solid #eee' } }
          }}>
            {getCommentsQuery.data?.data.map(comment => (
              <List.Item key={comment.id}>
                <Stack>
                  <Stack spacing={4}>
                    <Group spacing={8} sx={{ fontSize: 14 }}><Text sx={{ fontWeight: 500 }}>{comment.by_nickname}</Text></Group>
                    <Group spacing={8} sx={{ fontSize: 12 }}>
                      <Text>{comment.parsedCreatedAt}</Text>
                      <Text>on</Text>
                      <Anchor href={comment.page.url} target="_blank">{comment.page.slug}</Anchor>
                    </Group>
                    <Box sx={{ marginTop: 8 }}>{comment.content}</Box>
                  </Stack>
                  <Group><CommentToolbar comment={comment} refetch={getCommentsQuery.refetch} /></Group>
                </Stack>
              </List.Item>
            ))}
          </List>
          {getCommentsQuery.data?.data.length === 0 && (
            <Box p={'xl'} sx={{ backgroundColor: '#fff' }}>
              <Center><Text color="gray" size="sm">No comments yet</Text></Center>
            </Box>
          )}
          <Box><Pagination total={getCommentsQuery.data?.pageCount || 0} value={page} onChange={setPage} /></Box>
        </Stack>
      </MainLayout>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const projectService = new ProjectService(ctx.req)
  const viewDataService = new ViewDataService(ctx.req)
  const session = await getSession(ctx.req)

  if (!session) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  const project = await projectService.get(ctx.query.projectId) as any

  if (!project || project.deleted_at) {
    return { redirect: { destination: '/404', permanent: false } }
  }

  // FIXED: Validate ownership using the snake_case column
  if (session && (project.owner_id !== session.uid)) {
    return { redirect: { destination: '/forbidden', permanent: false } }
  }

  return {
    props: {
      session,
      mainLayoutData: await viewDataService.fetchMainLayoutData(),
      project: {
        id: project.id,
        title: project.title,
        owner_id: project.owner_id,
        token: project.token,
        enable_notification: !!project.enable_notification,
        enable_webhook: !!project.enable_webhook,
        webhook: project.webhook
      }
    }
  }
}

export default ProjectPage
