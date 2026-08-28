import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css' // styles that came with vite template, id like to make my own 
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
