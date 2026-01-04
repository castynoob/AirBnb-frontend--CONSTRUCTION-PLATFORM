import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SocketProvider } from './contexts/SocketContext'
import { LanguageProvider } from './contexts/LanguageContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </LanguageProvider>
  </StrictMode>,
)
