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
  // body will contain camelCase keys like enableNotification
  // which the API [projectId].ts then converts to snake_case for the DB
  const res = await apiClient.put(`/project/${projectId}`, body)
  return res.data
}

const useListStyle = createStyles(theme => ({
  container: { 
    border: `1px solid #eee`,
    borderRadius: theme.radius.sm,
    overflow: 'hidden' 
  },
  item: {
    backgroundColor: '#fff',
    padding: theme.spacing.md,
    borderBottom: '1px solid #eee',
    '&:last-child': { borderBottom: 0 }
  },
  label: { fontWeight: 500, fontSize: 14 }
}))

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
    notifications.show({ title: 'Saved', message: 'Settings updated successfully', color: 'green' })
  }, [])
  
  const failCallback = React.useCallback(() => {
    notifications.show({ title: 'Failed', message: 'Could not save settings', color: 'red' })
  }, [])

  const settingsMutation = useMutation(updateProjectSettings, { 
    onSuccess: successCallback, 
    onError: failCallback 
  })
  
  const webhookInputRef = React.useRef<HTMLInputElement>(null)

  const onSaveWebhookUrl = () => {
    const value = webhookInputRef.current?.value || ''
    settingsMutation.mutate({ projectId, body: { webhookUrl: value } })
  }

  return (
    <MainLayout id="settings" project={props.project as any} {...props.mainLayoutData}>
      <Container size="md" sx={{ marginTop: 24 }}>
        <Title sx={{ marginBottom: 20 }} order={3}>Project Settings</Title> 
        
        <Box className={listClasses.container}>
          {/* EMAIL NOTIFICATIONS */}
          <Box className={listClasses.item}>
            <Group position="apart" noWrap>
              <Box>
                <Text className={listClasses.label}>Email Notifications</Text>
                <Text size="xs" color="dimmed">Receive an email when a new comment is posted.</Text>
              </Box>
              <Switch 
                checked={!!props.project.enable_notification} 
                onChange={e => {
                  settingsMutation.mutate({ 
                    projectId, 
                    body: { enableNotification: e.target.checked } 
                  })
                }} 
              />
            </Group>
          </Box>

          {/* WEBHOOK SECTION */}
          <Box className={listClasses.item}>
            <Stack spacing="md">
              <Group position="apart" noWrap>
                <Box>
                  <Text className={listClasses.label}>Webhook</Text>
                  <Text size="xs" color="dimmed">Send a POST request to this URL on new comments.</Text>
                </Box>
                <Switch 
                  checked={!!props.project.enable_webhook} 
                  onChange={e => {
                    settingsMutation.mutate({ 
                      projectId, 
                      body: { enableWebhook: e.target.checked } 
                    })
                  }} 
                />
              </Group>
              
              <Group grow>
                <TextInput 
                  label="Webhook URL"
                  defaultValue={props.project.webhook || ''} 
                  ref={webhookInputRef} 
                  placeholder="https://example.com/webhook" 
                />
                <Box sx={{ alignSelf: 'flex-end' }}>
                  <Button 
                    onClick={onSaveWebhookUrl} 
                    loading={settingsMutation.isLoading}
                    fullWidth
                  >
                    Save URL
                  </Button>
                </Box>
              </Group>
            </Stack>
          </Box>
        </Box>
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
