import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function DashboardFab() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Masquer le FAB sur la page Dashboard
  if (pathname === '/dashboard') return null

  return (
    <button
      type="button"
      className="lu-fab-fixed"
      aria-label="Aller au Dashboard"
      title="Aller au Dashboard"
      onClick={() => navigate('/dashboard')}
    >
      <i className="bi bi-speedometer2" aria-hidden="true" />
    </button>
  )
}
