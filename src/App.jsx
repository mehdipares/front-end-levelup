import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import CustomGoal from './pages/CustomGoal'
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
          <Link to="/custom-goal">Créer un objectif</Link>
        </>}
        <span style={{ flex: 1 }} />
        {!isAuthenticated ? <>
          <Link to="/login">Se connecter</Link>
          <Link to="/register">Créer un compte</Link>
        </> : <button onClick={logout}>Se déconnecter</button>}
      </nav>

      <Routes>
        {/* Accueil PUBLIC : si connecté, on redirige vers le Dashboard */}
        <Route path="/" element={<HomePublic />} />

        {/* Auth publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Zones protégées */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/custom-goal" element={<ProtectedRoute><CustomGoal /></ProtectedRoute>} />
        

        {/* 404 → Accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

/** Accueil public : visible si non connecté, sinon redirection vers Dashboard */
function HomePublic() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <h1>LevelUp</h1>
      <p>Bienvenue ! Crée un compte ou connecte-toi pour commencer.</p>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => navigate('/login')}>Se connecter</button>
        <button onClick={() => navigate('/register')}>Créer un compte</button>
      </div>
    </div>
  )
}
