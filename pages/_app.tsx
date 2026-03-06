import { QueryClient, QueryClientProvider } from 'react-query'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

import '../style.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

export default function App({ Component, pageProps }) {
  // We REMOVED the <Provider> from next-auth/client.
  // This stops the 404/405 errors in your console.
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={{
        primaryColor: 'gray'
      }} withGlobalStyles withNormalizeCSS>
        <ModalsProvider>
          <Notifications position='top-center' />
          <Component {...pageProps} />
        </ModalsProvider>
      </MantineProvider>
    </QueryClientProvider>
  )
}
