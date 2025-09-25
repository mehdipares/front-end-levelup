// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUser } from '../api/users'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, userId } = useAuth()
  const location = useLocation()
  const [needsOnboarding, setNeedsOnboarding] = useState(null) // null = loading, true/false = résultat

  // ➜ Si pas connecté → Accueil public
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // ➜ Connecté : on check l’onboarding (sauf si on est déjà sur /onboarding)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const u = await getUser(userId)
        if (alive) setNeedsOnboarding(!u?.onboarding_done)
      } catch {
        if (alive) setNeedsOnboarding(false) // en cas d’erreur, on laisse passer
      }
    })()
    return () => { alive = false }
  }, [userId])

  // Laisser passer la page d’onboarding pour éviter les boucles
  if (location.pathname === '/onboarding') return children

  // Pendant le check d’onboarding
  if (needsOnboarding === null) {
    return <p>Chargement…</p>
  }

  // Rediriger vers l’onboarding si nécessaire
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // Sinon, accès autorisé
  return children
}
