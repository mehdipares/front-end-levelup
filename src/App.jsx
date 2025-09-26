// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

import Header from './components/Header'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Goals from './pages/Goals'
import Templates from './pages/Templates'
import Profile from './pages/Profile'
import CustomGoal from './pages/CustomGoal'
import DashboardFab from './components/DashboardFab'

import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

export default function App() {
  return (
    <>
      <Header />
      <main className="pt-header">
        <Routes>
          {/* Accueil PUBLIC : si connecté, redirection Dashboard */}
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

          {/* Bouton flottant global (caché automatiquement sur /dashboard) */}
      <DashboardFab />
      </main>
    </>
  )
}

/** Accueil public (responsive, mobile-first). Si connecté → Dashboard */
function HomePublic() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const scrollToFeatures = () => {
    // évite crash en SSR / environnements sans DOM
    if (typeof document !== 'undefined') {
      const el = document.querySelector('#features')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* HERO */}
      <section className="py-5" style={{ background: 'var(--lu-hero-grad)', color: '#fff' }}>
        <div className="container">
          <div className="row align-items-center g-4">
            {/* Texte (centré mobile) */}
            <div className="col-12 col-lg-7 text-center text-lg-start">
              <h1 className="fw-bold mb-2 home-hero-title">
                LevelUp — deviens meilleur, un objectif à la fois.
              </h1>
              <p className="lead mb-4 home-hero-lead">
                Crée tes objectifs, gagne de l’XP, passe des niveaux et suis tes priorités
                avec un onboarding intelligent.
              </p>

              {/* Boutons full width en XS */}
              <div className="d-grid gap-2 d-sm-flex justify-content-sm-start">
                <button className="btn btn-hero-main btn-lg" onClick={() => navigate('/register')}>
                  <i className="bi bi-rocket-takeoff me-2" />
                  Commencer gratuitement
                </button>
                <button className="btn btn-hero-contrast btn-lg" onClick={scrollToFeatures}>
                  <i className="bi bi-eye me-2" />
                  Voir les fonctionnalités
                </button>
              </div>


              <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center justify-content-lg-start">
                <span className="badge bg-warning text-dark">Boost d’XP</span>
                <span className="badge bg-light text-dark">Onboarding guidé</span>
                <span className="badge bg-secondary">Gratuit</span>
              </div>
            </div>

            {/* Aperçu (centré mobile) */}
            <div className="col-12 col-lg-5">
              <div className="card lu-card border-0 shadow-lg mx-auto" style={{ maxWidth: 420 }}>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold">Progression</span>
                    <span className="badge text-bg-light">Niveau 1</span>
                  </div>
                  <div className="progress xp" role="progressbar" aria-valuenow={35} aria-valuemin="0" aria-valuemax="100">
                    <div className="progress-bar" style={{ width: '35%' }} />
                  </div>
                  <ul className="list-group list-group-flush mt-3 small">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-check2-circle me-2 text-primary" />Boire 2L d’eau</span>
                      <span className="badge text-bg-secondary">+10 XP</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-check2-circle me-2 text-primary" />Lecture 15 min</span>
                      <span className="badge text-bg-secondary">+15 XP</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-check2-circle me-2 text-primary" />Sport</span>
                      <span className="badge text-bg-secondary">+20 XP</span>
                    </li>
                  </ul>
                  <small className="text-light opacity-75 d-block mt-2 text-center">Aperçu illustratif</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-5">
        <div className="container">
          <h2 className="mb-4 lu-section-title">Pourquoi LevelUp ?</h2>

          <div className="row row-cols-1 row-cols-md-3 g-3">
            <div className="col">
              <div className="card lu-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="lu-ico"><i className="bi bi-stars" /></div>
                    <h5 className="mb-0">XP & Niveaux</h5>
                  </div>
                  <p className="mb-0 text-muted">Valide, gagne de l’XP, grimpe de niveau et mesure ta progression.</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card lu-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="lu-ico"><i className="bi bi-magic" /></div>
                    <h5 className="mb-0">Templates prêts</h5>
                  </div>
                  <p className="mb-0 text-muted">Choisis un modèle par catégorie ou crée ton objectif en 30s.</p>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card lu-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="lu-ico"><i className="bi bi-lightning-charge" /></div>
                    <h5 className="mb-0">Priorités smart</h5>
                  </div>
                  <p className="mb-0 text-muted">L’onboarding met en avant ce qui compte vraiment pour toi.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps + CTA */}
          <div className="row g-3 mt-3">
            <div className="col-12 col-lg-8">
              <div className="card lu-card h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">Comment ça marche ?</h5>
                  <ol className="list-group list-group-numbered">
                    <li className="list-group-item">Fais l’onboarding (5 min) pour connaître tes priorités.</li>
                    <li className="list-group-item">Ajoute des objectifs (templates/perso) + choisis la cadence.</li>
                    <li className="list-group-item">Valide au quotidien → XP → niveaux 🎯</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card lu-card h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="card-title mb-2">Prêt à démarrer ?</h5>
                    <p className="text-muted mb-3">Crée un compte, aucune installation requise.</p>
                  </div>
                  <div className="d-grid gap-2">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                      <i className="bi bi-person-plus me-2" />
                      Créer un compte
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => navigate('/login')}>
                      <i className="bi bi-box-arrow-in-right me-2" />
                      Se connecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA final */}
      <section className="pb-5">
        <div className="container">
          <div className="lu-hero d-flex flex-column flex-md-row align-items-center justify-content-between text-center text-md-start">
            <div className="mb-3 mb-md-0">
              <div className="fw-semibold">Passe au niveau supérieur</div>
              <div className="opacity-75">Fixe tes objectifs, valide-les, progresse. Simple et motivant.</div>
            </div>
            <div className="d-grid gap-2 d-sm-flex">
              <button className="btn btn-light" onClick={() => navigate('/register')}>Créer un compte</button>
              <button className="btn btn-outline-light" onClick={() => navigate('/login')}>Se connecter</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
