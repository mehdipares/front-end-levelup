// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { getUser } from '../api/users'
import { getUserIdFromToken } from '../api/client'
import { loginSchema } from '../validation/schemas'
import { sanitizeText } from '../security/sanitize' // ✅ DOMPurify

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      // ✅ 0) Assainissement (DOMPurify) — avant validation Yup
      const cleanEmail = sanitizeText(email)

      // ✅ 1) Validation Yup (abortEarly:false → récupère toutes les erreurs)
      const data = await loginSchema.validate(
        { email: cleanEmail, password },
        { abortEarly: false }
      )

      // ✅ 2) Appel API avec data validé (trim/format)
      const res = await login(data)
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
      // ✅ Gestion erreurs Yup
      if (e2?.name === 'ValidationError') {
        const map = {}
        e2.inner?.forEach((err) => {
          if (err?.path) map[err.path] = err.message
        })
        setFieldErrors(map)
        return
      }

      // ✅ Erreurs API
      setError(e2?.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() && password.trim() && !loading

  const emailErr = fieldErrors.email
  const pwdErr = fieldErrors.password

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
          {/* Message d’erreur global */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={onSubmit} className="vstack gap-3" noValidate>
            {/* Email */}
            <div>
              <label className="form-label fw-semibold" htmlFor="login-email">Email</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  id="login-email"
                  type="email"
                  className={`form-control ${emailErr ? 'is-invalid' : ''}`}
                  placeholder="ex: jean@mail.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailErr}
                  aria-describedby={emailErr ? 'login-email-error' : undefined}
                />
              </div>
              {emailErr && (
                <div id="login-email-error" className="text-danger small mt-1">
                  {emailErr}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label fw-semibold" htmlFor="login-password">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  className={`form-control ${pwdErr ? 'is-invalid' : ''}`}
                  placeholder="Ton mot de passe"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!pwdErr}
                  aria-describedby={pwdErr ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPwd((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {pwdErr && (
                <div id="login-password-error" className="text-danger small mt-1">
                  {pwdErr}
                </div>
              )}
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
