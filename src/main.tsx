import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ProgressionProvider } from './state/progression'
import { PomodoroProvider } from './state/pomodoro'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressionProvider>
      <PomodoroProvider>
        <App />
      </PomodoroProvider>
    </ProgressionProvider>
  </StrictMode>,
)
