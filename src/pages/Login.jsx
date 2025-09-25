// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getUser } from '../api/users'
import { getUserIdFromToken } from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      if (!res?.token) {
        setError('Réponse inattendue du serveur.')
        return
      }
      setAuth(res.token)

      const id = getUserIdFromToken(res.token)
      if (!id) {
        setError('Token invalide: userId introuvable')
        return
      }
      const user = await getUser(id)
      const dest = user?.onboarding_done
        ? (location.state?.from?.pathname || '/dashboard')
        : '/onboarding'
      navigate(dest, { replace: true })
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() && password.trim() && !loading

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      {/* Titre & sous-titre */}
      <div className="text-center mb-4">
        <h1 className="fw-bold mb-1">Connexion</h1>
        <p className="text-muted mb-0">Ravi de te revoir !</p>
      </div>

      {/* Carte login */}
      <div className="card lu-card shadow-sm">
        <div className="card-body p-4">
          {/* Message d’erreur */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={onSubmit} className="vstack gap-3">
            {/* Email */}
            <div>
              <label className="form-label fw-semibold">Email</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ex: jean@mail.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label fw-semibold">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Ton mot de passe"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPwd(s => !s)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Connexion…
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Se connecter
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer form */}
          <div className="text-center mt-3">
            <span className="text-muted">Pas de compte ? </span>
            <Link to="/register" className="fw-semibold">Créer un compte</Link>
          </div>
        </div>
      </div>

      {/* Bonus : petite accroche visuelle */}
      <div className="text-center mt-3">
        <span className="badge rounded-pill text-bg-primary me-2">Sécurisé</span>
        <span className="badge rounded-pill text-bg-secondary">Rapide</span>
      </div>
    </div>
  )
}
