import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'
import './styles/base.css'
import './styles/animations.css'
import './styles/components.css'
import './styles/domain.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LangProvider } from './LangContext.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <App />
      </LangProvider>
    </QueryClientProvider>
  </StrictMode>,
)
