import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ProgressionProvider } from './state/progression'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressionProvider>
      <App />
    </ProgressionProvider>
  </StrictMode>,
)
