import { Box, Button, Container, createStyles, Group, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
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

// FIXED: Property types now match the snake_case Prisma Model names
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

  const settingsMutation = useMutation(updateProjectSettings, { onSuccess: successCallback, onError: failCallback })
  const webhookInputRef = React.useRef<HTMLInputElement>(null)

  const onSaveWebhookUrl = async () => {
    const value = webhookInputRef.current?.value || ''
    settingsMutation.mutate({ projectId, body: { webhookUrl: value } })
  }

  return (
    <MainLayout id="settings" project={props.project as any} {...props.mainLayoutData}>
      <Container sx={{ marginTop: 24 }}>
        <Title sx={{ marginBottom: 12 }} order={3}>Settings</Title> 
        <Stack className={listClasses.container} spacing={0}>
          
          {/* EMAIL NOTIFICATIONS INPUT */}
          <Box className={listClasses.item}>
            <Group position="apart">
              <Text className={listClasses.label}>Email Notification</Text>
              <Switch 
                checked={!!props.project.enable_notification} 
                onChange={e => {
                  settingsMutation.mutate({ projectId, body: { enableNotification: e.target.checked } })
                }} 
              />
            </Group>
          </Box>

          {/* WEBHOOK INPUT SECTION */}
          <Box className={listClasses.item}>
            <Stack>
              <Group position="apart">
                <Text className={listClasses.label}>Webhook</Text>
                <Switch 
                  checked={!!props.project.enable_webhook} 
                  onChange={e => {
                    settingsMutation.mutate({ projectId, body: { enableWebhook: e.target.checked } })
                  }} 
                />
              </Group>
              <Group grow>
                <TextInput 
                  defaultValue={props.project.webhook || ''} 
                  ref={webhookInputRef} 
                  placeholder="https://your-webhook-url.com" 
                />
                <Button onClick={onSaveWebhookUrl} loading={settingsMutation.isLoading}>Save URL</Button>
              </Group>
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

  if (!session) return { redirect: { destination: '/dashboard', permanent: false } }

  const project = await projectService.get(ctx.query.projectId) as any
  if (!project || project.deleted_at) return { redirect: { destination: '/404', permanent: false } }

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
