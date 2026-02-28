import { Box, Button, Center, Container, createStyles, Divider, Grid, Group, List, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { Project } from "@prisma/client"
import { useRouter } from "next/router"
import React from "react"
import { useMutation } from "react-query"
import { MainLayout } from "../../../../components/Layout"
import { ProjectService } from "../../../../service/project.service"
import { MainLayoutData, ViewDataService } from "../../../../service/viewData.service"
import { apiClient } from "../../../../utils.client"
import { getSession } from "../../../../utils.server"

const deleteProject = async ({ projectId }) => {
  const res = await apiClient.delete<{
    data: string
  }>(`/project/${projectId}`)
  return res.data.data
}

const updateProjectSettings = async ({ projectId, body }) => {
  const res = await apiClient.put(`/project/${projectId}`, body)
  return res.data
}

const useListStyle = createStyles(theme => ({
  container: { border: `1px solid #eee` },
  item: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: theme.spacing.md,
    ':not(:last-child)': { borderBottom: '1px solid #eee' }
  },
  label: { fontWeight: 500 as any, fontSize: 14 }
}))

// FIXED: Properties now match the actual Prisma Model names (snake_case)
export type ProjectServerSideProps = {
  id: string
  title: string
  owner_id: string
  token: string | null
  enable_notification: boolean
  webhook: string | null
  enable_webhook: boolean
}

export default function Page(props: {
  session: any,
  project: ProjectServerSideProps,
  mainLayoutData: MainLayoutData
}) {
  const { classes: listClasses } = useListStyle()
  const router = useRouter()
  const projectId = router.query.projectId as string

  const successCallback = React.useCallback(() => {
    notifications.show({ title: 'Saved', message: 'Settings saved', color: 'green' })
  }, [])
  const failCallback = React.useCallback(() => {
    notifications.show({ title: 'Failed', message: 'Something went wrong', color: 'red' })
  }, [])

  const enableNotificationMutation = useMutation(updateProjectSettings, { onSuccess: successCallback, onError: failCallback })
  const enableWebhookMutation = useMutation(updateProjectSettings, { onSuccess: successCallback, onError: failCallback })
  const updateWebhookUrlMutation = useMutation(updateProjectSettings, { onSuccess: successCallback, onError: failCallback })
  const webhookInputRef = React.useRef<HTMLInputElement>(null)

  const deleteProjectMutation = useMutation(deleteProject, {
    onSuccess() { location.href = "/dashboard" },
    onError: failCallback 
  })

  const onSaveWebhookUrl = async _ => {
    const value = webhookInputRef.current.value
    const validUrlRegexp = /^https?:/
    if (!validUrlRegexp.exec(value)) {
      notifications.show({ title: 'Invalid URL', message: 'Please enter a valid http/https URL', color: 'red' })
      return
    }
    updateWebhookUrlMutation.mutate({ projectId, body: { webhookUrl: value } })
  }

  return (
    <MainLayout id="settings" project={props.project as any} {...props.mainLayoutData}>
      <Container sx={{ marginTop: 24 }}>
        <Title sx={{ marginBottom: 12 }} order={3}>Settings</Title> 
        <Stack className={listClasses.container} spacing={0}>
          <Box className={listClasses.item}>
            <Group>
              <Text className={listClasses.label}>Email Notification</Text>
              <Switch checked={props.project.enable_notification} onChange={e => {
                enableNotificationMutation.mutate({ projectId, body: { enableNotification: e.target.checked } })
              }} />
            </Group>
          </Box>
          <Box className={listClasses.item}>
            <Stack>
              <Group>
                <Text className={listClasses.label}>Webhook</Text>
                <Switch checked={props.project.enable_webhook} onChange={e => {
                  enableWebhookMutation.mutate({ projectId, body: { enableWebhook: e.target.checked } })
                }} />
              </Group>
              <Group grow>
                <TextInput defaultValue={props.project.webhook || ''} ref={webhookInputRef} placeholder="https://..." />
                <Box><Button onClick={onSaveWebhookUrl}>Save</Button></Box>
              </Group>
            </Stack>
          </Box>
          <Box className={listClasses.item}>
            <Stack>
              <Group><Text className={listClasses.label}>Danger zone</Text></Group>
              <Box>
                <Button onClick={_ => {
                  if (window.confirm("Are you sure?")) { deleteProjectMutation.mutate({ projectId }) }
                }} loading={deleteProjectMutation.isLoading} color="red">Delete site</Button>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </MainLayout >
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

  // Ensure DadAdmin or the session user is recognized correctly
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
