import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initAnalyticsAndSEO } from './utils/analyticsInjector'

// Initialize Google Analytics & Search Console verification tags
initAnalyticsAndSEO()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
