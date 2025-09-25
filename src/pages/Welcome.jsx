// src/pages/Welcome.jsx
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      {/* Hero / entête */}
      <div className="p-4 rounded-3 text-white mb-4" style={{ background: 'var(--lu-grad)' }}>
        <h1 className="h3 fw-bold mb-1">Bienvenue sur LevelUp 🎉</h1>
        <p className="mb-0" style={{ opacity: .9 }}>
          Ton questionnaire est enregistré. Voici comment démarrer pour de vrai :
        </p>
      </div>

      {/* Étapes clés */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card lu-card h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold">1) Ajoute des objectifs</h5>
              <p className="text-muted mb-3">
                Parcours les <strong>templates</strong> par catégorie et ajoute ceux qui te parlent.
              </p>
              <Link to="/templates" className="btn btn-primary">
                Explorer les templates
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card lu-card h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold">2) Crée le tien</h5>
              <p className="text-muted mb-3">
                Besoin de quelque chose de précis ? Crée un <strong>objectif personnalisé</strong> (titre, XP, cadence).
              </p>
              <Link to="/custom-goal" className="btn btn-outline-primary">
                Créer un objectif
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA principal */}
      <div className="text-center mt-4">
        <button
          className="btn btn-success btn-lg px-4"
          onClick={() => navigate('/dashboard', { replace: true })}
        >
          Continuer vers le Dashboard
        </button>
        <div className="text-muted small mt-2">
          Tu pourras valider tes objectifs du jour directement depuis le dashboard.
        </div>
      </div>
    </div>
  )
}
