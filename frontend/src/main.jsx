import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const storedTheme = localStorage.getItem('theme')
document.documentElement.classList.toggle('dark', storedTheme === 'dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
