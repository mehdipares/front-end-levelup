import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Goals from './pages/Goals'
import Templates from './pages/Templates'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Link to="/">Accueil</Link>
        {isAuthenticated && <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/goals">Mes objectifs</Link>
          <Link to="/templates">Templates</Link>
          <Link to="/profile">Profil</Link>
        </>}
        <span style={{ flex: 1 }} />
        {!isAuthenticated ? <>
          <Link to="/login">Se connecter</Link>
          <Link to="/register">Créer un compte</Link>
        </> : <button onClick={logout}>Se déconnecter</button>}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function Home() {
  return (
    <div>
      <h1>LevelUp</h1>
      <p>Bienvenue ! Connecte-toi pour commencer.</p>
    </div>
  )
}
