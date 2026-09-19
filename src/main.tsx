import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GOOGLE_FONTS_URL } from './lib/fonts'

const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = GOOGLE_FONTS_URL
document.head.appendChild(link)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.DEV) {
  // Expose the store for debugging and browser tests in development only.
  import('./store/useEditor').then((m) => {
    ;(window as unknown as { __editor: unknown }).__editor = m.useEditor
  })
}
