import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import OverlayWindow from './components/OverlayWindow'
import './styles.css'

const isOverlay = window.location.hash === '#overlay'
if (isOverlay) document.body.classList.add('is-overlay')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isOverlay ? <OverlayWindow /> : <App />}
  </React.StrictMode>
)
