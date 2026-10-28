import { useEffect, useState } from 'react'
import Header from './components/Header'
import Organiser from './components/Organiser'
import Reveal from './components/Reveal'
import Snow from './components/Snow'

type Route = { page: 'organiser' } | { page: 'gift'; token: string }

// Hash routing keeps the gift token out of server logs and lets the app be
// hosted on any static host without rewrite rules.
function useHashRoute(): Route {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const match = hash.match(/^#\/gift\/([\w-]+)/)
  return match ? { page: 'gift', token: match[1] } : { page: 'organiser' }
}

export default function App() {
  const route = useHashRoute()

  return (
    <>
      <Snow />
      <main className="page">
        <Header small={route.page === 'gift'} />
        {route.page === 'gift' ? (
          // Keyed by token so each link starts wrapped, even when opened in a
          // tab that already unwrapped a different one.
          <Reveal key={route.token} token={route.token} />
        ) : (
          <Organiser />
        )}
      </main>
      <footer className="footer">Made with mince pies &amp; mulled wine 🍷</footer>
    </>
  )
}
