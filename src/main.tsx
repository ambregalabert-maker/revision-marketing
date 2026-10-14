import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ProgressionProvider } from './state/progression'
import { PomodoroProvider } from './state/pomodoro'
import { CompteProvider } from './state/compte'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressionProvider>
      <CompteProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </CompteProvider>
    </ProgressionProvider>
  </StrictMode>,
)
