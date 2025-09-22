// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import Header from './components/Header' // <-- nouveau header (Bootstrap + burger)

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Goals from './pages/Goals'
import Templates from './pages/Templates'
import Profile from './pages/Profile'
import CustomGoal from './pages/CustomGoal'

import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

export default function App() {
  return (
    <>
      <Header /> {/* visible partout */}
      <main className="pt-header"> {/* espace sous la navbar sticky/fixed */}
        <Routes>
          {/* Accueil PUBLIC : si connecté, on redirige vers le Dashboard */}
          <Route path="/" element={<HomePublic />} />

          {/* Auth publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Zones protégées */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/onboarding"
            element={<ProtectedRoute><Onboarding /></ProtectedRoute>}
          />
          <Route
            path="/goals"
            element={<ProtectedRoute><Goals /></ProtectedRoute>}
          />
          <Route
            path="/templates"
            element={<ProtectedRoute><Templates /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path="/custom-goal"
            element={<ProtectedRoute><CustomGoal /></ProtectedRoute>}
          />

          {/* 404 → Accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
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
    <div className="container py-4">
      <h1 className="mb-2">LevelUp</h1>
      <p className="text-muted">Bienvenue ! Crée un compte ou connecte-toi pour commencer.</p>
      <div className="d-flex gap-2">
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Se connecter</button>
        <button className="btn btn-outline-primary" onClick={() => navigate('/register')}>Créer un compte</button>
      </div>
    </div>
  )
}
