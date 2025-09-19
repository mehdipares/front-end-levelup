import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUser } from '../api/users'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, userId } = useAuth()
  const location = useLocation()
  const [needsOnboarding, setNeedsOnboarding] = useState(null) // null=loading, true/false=résultat

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const u = await getUser(userId)
        if (alive) setNeedsOnboarding(!u?.onboarding_done)
      } catch {
        if (alive) setNeedsOnboarding(false) // on laisse passer si erreur
      }
    })()
    return () => { alive = false }
  }, [userId])

  // si on est déjà sur /onboarding, on laisse passer pour éviter loop
  if (location.pathname === '/onboarding') return children

  if (needsOnboarding === null) return <p>Chargement…</p>
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return children
}
