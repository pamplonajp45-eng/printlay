/* eslint-disable react-refresh/only-export-components -- app entry file renders the root component */
import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'
import FeedbackInbox from './components/FeedbackInbox.jsx'

function MainRouter() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo(0, 0)
  }

  if (currentPath === '/feedback-inbox') {
    return (
      <FeedbackInbox
        onNavigateHome={() => navigate('/')}
      />
    )
  }

  if (currentPath === '/app' || currentPath === '/editor') {
    return (
      <App
        onNavigateHome={() => navigate('/')}
      />
    )
  }

  return (
    <Landing
      onOpenEditor={() => navigate('/app')}
    />
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MainRouter />
  </StrictMode>,
)
