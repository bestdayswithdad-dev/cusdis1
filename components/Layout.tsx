import React, { useCallback, useState } from "react"
import { useMutation, useQuery } from "react-query"
import { useRouter } from "next/router"
import { AiOutlineLogout, AiOutlineSetting, AiOutlineFileText, AiOutlineAlert, AiOutlinePlus, AiOutlineComment, AiOutlineCode, AiOutlineRight, AiOutlineDown } from 'react-icons/ai'

/** * FIXED: Removed next-auth imports and added Supabase helpers 
 */
import { useSupabaseClient } from '@supabase/auth-helpers-react'

import { Anchor, AppShell, Avatar, Badge, Box, Button, Code, Grid, Group, Header, List, Menu, Modal, Navbar, NavLink, Paper, Progress, ScrollArea, Select, Space, Stack, Switch, Text, TextInput, Title } from "@mantine/core"
import Link from "next/link"
import type { ProjectServerSideProps } from "../pages/dashboard/project/[projectId]/settings"
import { modals } from "@mantine/modals"
import { useClipboard, useDisclosure } from '@mantine/hooks';
import { notifications } from "@mantine/notifications"
import { apiClient } from "../utils.client"
import { useForm } from "react-hook-form"
import { MainLayoutData } from "../service/viewData.service"
import { Head } from "./Head"
import dayjs from "dayjs"
import { usageLimitation } from "../config.common"

function validateEmail(email) {
  if (email === '') return true
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const updateUserSettings = async (params: {
  notificationEmail?: string,
  enableNotifications?: boolean,
  displayName?: string,
}) => {
  const res = await apiClient.put(`/user`, params)
  return res.data
}

export function MainLayout(props: {
  children?: any,
  id: 'comments' | 'settings'
  project: ProjectServerSideProps,
} & MainLayoutData) {
  const router = useRouter()
  const clipboard = useClipboard()
  const supabase = useSupabaseClient() // FIXED: Using Supabase client for auth actions
  const [isUserPannelOpen, { open: openUserModal, close: closeUserModal }] = useDisclosure(false);

  const userSettingsForm = useForm({
    defaultValues: {
      username: String(props.userInfo?.name || ""),
      displayName: String(props.userInfo?.display_name || ""),
      email: String(props.userInfo?.email || ""),
      notificationEmail: String(props.userInfo?.notification_email || ""),
    },
  })

  const updateUserSettingsMutation = useMutation(updateUserSettings, {
    onSuccess() {
      notifications.show({ title: 'Success', message: 'User settings updated', color: 'green' })
    },
    onError() {
      notifications.show({ title: 'Error', message: 'Something went wrong', color: 'red' })
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut() // FIXED: Proper Supabase logout
    router.push('/auth')
  }

  const projectId = router.query.projectId as string

  const ProjectMenu = React.useCallback(() => {
    return (
      <Menu>
        <Menu.Target>
          <Button size='xs' variant={'light'} rightIcon={<AiOutlineDown />}>{props.project.title}</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Link href="/getting-start" style={{ textDecoration: 'none' }}>
            <Menu.Item icon={<AiOutlinePlus />}>New site</Menu.Item>
          </Link>
          <Menu.Divider />
          <Menu.Label>Sites</Menu.Label>
          {props.projects.map(project => (
            <Menu.Item key={project.id} onClick={() => { location.href = `/dashboard/project/${project.id}` }}>
              {project.title}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    )
  }, [props.project.id, props.projects])

  const Menubar = React.useMemo(() => {
    const navStyles = { label: { fontWeight: 500 as any, color: '#343A40' } }
    return (
      <Stack p="sm">
        <Link href={`/dashboard/project/${projectId}`} style={{ textDecoration: 'none' }}>
          <NavLink active={props.id === "comments"} styles={navStyles} label="Comments" icon={<AiOutlineComment />} />
        </Link>
        <Link href={`/dashboard/project/${projectId}/settings`} style={{ textDecoration: 'none' }}>
          <NavLink active={props.id === 'settings'} styles={navStyles} label="Site settings" icon={<AiOutlineSetting />} />
        </Link>
      </Stack>
    )
  }, [projectId, props.id])

  const openEmbededCodeModal = React.useCallback(() => {
    const code = `<div id="cusdis_thread"\n  data-host="${location.origin}"\n  data-app-id="${props.project.id}"\n  data-page-id="{{ PAGE_ID }}"\n  data-page-url="{{ PAGE_URL }}"\n  data-page-title="{{ PAGE_TITLE }}"\n></div>\n<script async defer src="${location.origin}/js/cusdis.es.js"></script>`
    modals.openConfirmModal({
      title: "Embedded Code",
      labels: { cancel: 'Cancel', confirm: 'Copy' },
      onConfirm: () => {
        clipboard.copy(code)
        notifications.show({ title: 'Success', message: 'Code copied to clipboard' })
      },
      children: <Code block>{code}</Code>
    })
  }, [props.project.id, clipboard])

  return (
    <>
      <Head title={`${props.project.title} - Cusdis`} />
      <AppShell
        navbar={<Navbar width={{ base: 240 }}>{Menubar}</Navbar>}
        header={
          <Header height={48} px="md">
            <Group sx={{ height: '100%', justifyContent: 'space-between' }}>
              <Group>
                <Title order={3}><Anchor href="/">Cusdis</Anchor></Title>
                <ProjectMenu />
                <Button leftIcon={<AiOutlineCode />} onClick={openEmbededCodeModal} size="xs" variant="outline">Embed code</Button>
              </Group>
              <Button onClick={openUserModal} size="xs" variant="subtle">{props.session.user.name}</Button>
            </Group>
          </Header>
        }
      >
        <Modal opened={isUserPannelOpen} onClose={closeUserModal} title="User Settings">
          <Stack>
            <TextInput label="Email" value={props.session.user.email} disabled />
            <TextInput label="Display Name" {...userSettingsForm.register("displayName")} />
            <Button fullWidth onClick={handleLogout} variant="outline" color="red">Logout</Button>
          </Stack>
        </Modal>
        {props.children}
      </AppShell>
    </>
  )
}
