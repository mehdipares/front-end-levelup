// src/components/DashboardFab.jsx
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function DashboardFab() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Pages où l’on cache le bouton
  const HIDDEN_PATHS = new Set(['/', '/dashboard', '/login', '/register'])
  if (HIDDEN_PATHS.has(pathname)) return null

  return (
    <button
      type="button"
      className="lu-fab-fixed"
      aria-label="Aller au dashboard"
      title="Aller au dashboard"
      onClick={() => navigate('/dashboard')}
    >
      <i className="bi bi-house"></i>
    </button>
  )
}
