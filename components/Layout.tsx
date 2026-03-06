import React, { useCallback, useState } from "react"
import { useRouter } from "next/router"
import { AiOutlineSetting, AiOutlineComment, AiOutlineCode, AiOutlineDown } from 'react-icons/ai'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Anchor, AppShell, Button, Code, Group, Header, Modal, Navbar, NavLink, Stack, Text, TextInput, Title } from "@mantine/core"
import Link from "next/link"
import { useDisclosure } from '@mantine/hooks'
import { Head } from "./Head"

export function MainLayout(props: any) {
  const router = useRouter()
  const supabase = createClientComponentClient() // Uses the Next.js specific helper
  const [isUserPannelOpen, { open: openUserModal, close: closeUserModal }] = useDisclosure(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const projectId = router.query.projectId as string

  return (
    <>
      <Head title="Cusdis Dashboard" />
      <AppShell
        navbar={
          <Navbar width={{ base: 240 }} p="xs">
            <Stack>
              <Link href={`/dashboard/project/${projectId}`} style={{ textDecoration: 'none' }}>
                <NavLink label="Comments" icon={<AiOutlineComment />} active={props.id === 'comments'} />
              </Link>
              <Link href={`/dashboard/project/${projectId}/settings`} style={{ textDecoration: 'none' }}>
                <NavLink label="Settings" icon={<AiOutlineSetting />} active={props.id === 'settings'} />
              </Link>
            </Stack>
          </Navbar>
        }
        header={
          <Header height={48} px="md">
            <Group sx={{ height: '100%', justifyContent: 'space-between' }}>
              <Group>
                <Title order={3}><Anchor href="/">Cusdis</Anchor></Title>
                <Button size="xs" variant="outline" leftIcon={<AiOutlineCode />}>Embed Code</Button>
              </Group>
              <Button onClick={openUserModal} size="xs" variant="subtle">Account</Button>
            </Group>
          </Header>
        }
      >
        <Modal opened={isUserPannelOpen} onClose={closeUserModal} title="User Settings">
          <Stack>
             <Text size="sm">Manage your session and account settings here.</Text>
             <Button fullWidth onClick={handleLogout} color="red" variant="outline">Logout</Button>
          </Stack>
        </Modal>
        <div style={{ padding: '20px' }}>
          {props.children}
        </div>
      </AppShell>
    </>
  )
}
