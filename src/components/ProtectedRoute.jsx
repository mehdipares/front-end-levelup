// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUser } from '../api/users'

/**
 * IMPORTANT :
 *  - Tous les hooks (useState/useEffect/…) sont appelés à CHAQUE rendu et AVANT tout "return".
 *  - On évite les early returns avant les hooks → sinon ordre des hooks ≠ entre rendus -> crash.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, userId } = useAuth()
  const location = useLocation()

  // Always declare hooks first (stable order)
  const [needsOnboarding, setNeedsOnboarding] = useState(null) // null = checking, true/false = result
  // Pages à laisser passer sans check d'onboarding pour éviter les boucles
  const onOnboardingRoute =
    location.pathname === '/onboarding' || location.pathname === '/welcome'

  // Check onboarding state only when connected AND not already on onboarding/welcome
  useEffect(() => {
    let alive = true

    // Si pas co → on ne lance pas l'appel, on remet l'état à "pas besoin"
    if (!isAuthenticated) {
      setNeedsOnboarding(false)
      return () => { alive = false }
    }

    // Si déjà sur /onboarding ou /welcome → pas de check (évite les boucles)
    if (onOnboardingRoute) {
      setNeedsOnboarding(false)
      return () => { alive = false }
    }

    ;(async () => {
      try {
        const u = await getUser(userId)
        if (alive) setNeedsOnboarding(!u?.onboarding_done)
      } catch {
        // En cas d’erreur API, on laisse passer pour ne pas bloquer l’app
        if (alive) setNeedsOnboarding(false)
      }
    })()

    return () => { alive = false }
  }, [isAuthenticated, userId, onOnboardingRoute])

  // --- Gating (ces returns arrivent APRÈS la déclaration des hooks ci-dessus) ---

  // 1) Non connecté → vers accueil public
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // 2) On laisse passer l’onboarding et la page de bienvenue sans check
  if (onOnboardingRoute) {
    return children
  }

  // 3) Pendant le check d’onboarding (premier rendu/cochage) → petit loader
  if (needsOnboarding === null) {
    return <div className="container py-4">Chargement…</div>
  }

  // 4) Onboarding requis → redirect
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // 5) OK → on rend la page protégée
  return children
}
