// src/pages/Register.jsx
import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister, login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { registerSchema } from '../validation/schemas'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const { login } = useAuth()
  const navigate = useNavigate()

  // Score très simple: 0..4 (UX seulement)
  const pwdScore = useMemo(() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[0-9]/.test(password)) s++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }, [password])

  const pwdLabel = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Excellente'][pwdScore]
  const pwdPercent = (pwdScore / 4) * 100
  const canSubmit = email.trim() && username.trim() && password.trim() && !loading

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      // ✅ 1) Validation Yup (récupère toutes les erreurs)
      const data = await registerSchema.validate(
        { username, email, password },
        { abortEarly: false }
      )

      // ✅ 2) Appel API avec data validé
      const reg = await apiRegister(data)

      if (reg?.token) {
        login(reg.token)
      } else {
        const res = await apiLogin({ email: data.email, password: data.password })
        if (res?.token) login(res.token)
      }

      navigate('/onboarding', { replace: true })
    } catch (e2) {
      // ✅ Erreurs Yup
      if (e2?.name === 'ValidationError') {
        const map = {}
        e2.inner?.forEach((err) => {
          if (err?.path) map[err.path] = err.message
        })
        setFieldErrors(map)
        return
      }

      // ✅ Erreurs API
      setError(e2?.response?.data?.error || 'Erreur à l’inscription')
    } finally {
      setLoading(false)
    }
  }

  const emailErr = fieldErrors.email
  const userErr = fieldErrors.username
  const pwdErr = fieldErrors.password

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      {/* Titre */}
      <div className="text-center mb-4">
        <h1 className="fw-bold mb-1">Créer un compte</h1>
        <p className="text-muted mb-0">Rejoins LevelUp et commence à gagner de l’XP 🎯</p>
      </div>

      {/* Carte */}
      <div className="card lu-card shadow-sm">
        <div className="card-body p-4">
          {/* Erreur globale */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={onSubmit} className="vstack gap-3" noValidate>
            {/* Email */}
            <div>
              <label className="form-label fw-semibold" htmlFor="reg-email">Email</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope" />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  className={`form-control ${emailErr ? 'is-invalid' : ''}`}
                  placeholder="ex: jean@mail.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailErr}
                  aria-describedby={emailErr ? 'reg-email-error' : undefined}
                />
              </div>
              {emailErr && (
                <div id="reg-email-error" className="text-danger small mt-1">
                  {emailErr}
                </div>
              )}
            </div>

            {/* Pseudo */}
            <div>
              <label className="form-label fw-semibold" htmlFor="reg-username">Pseudo</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person" />
                </span>
                <input
                  id="reg-username"
                  type="text"
                  className={`form-control ${userErr ? 'is-invalid' : ''}`}
                  placeholder="Ton pseudo"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={!!userErr}
                  aria-describedby={userErr ? 'reg-username-error' : undefined}
                />
              </div>
              {userErr && (
                <div id="reg-username-error" className="text-danger small mt-1">
                  {userErr}
                </div>
              )}
            </div>

            {/* Mot de passe + toggle + bar force */}
            <div>
              <label className="form-label fw-semibold" htmlFor="reg-password">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock" />
                </span>
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  className={`form-control ${pwdErr ? 'is-invalid' : ''}`}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!pwdErr}
                  aria-describedby={pwdErr ? 'reg-password-error' : undefined}
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
                <div id="reg-password-error" className="text-danger small mt-1">
                  {pwdErr}
                </div>
              )}

              {/* Indicateur de force (UX) */}
              <div className="mt-2">
                <div className="d-flex justify-content-between small">
                  <span className="text-muted">Force du mot de passe</span>
                  <span className="text-muted">{pwdLabel}</span>
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow={pwdPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ height: 8 }}
                >
                  <div
                    className={`progress-bar ${
                      pwdPercent < 50 ? 'bg-danger' : pwdPercent < 75 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${pwdPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary btn-lg" disabled={!canSubmit}>
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Création du compte…
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2" />
                    S’inscrire
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-3">
            <span className="text-muted">Déjà inscrit ? </span>
            <Link to="/login" className="fw-semibold">Se connecter</Link>
          </div>
        </div>
      </div>

      {/* Petits badges vibes confiance */}
      <div className="text-center mt-3">
        <span className="badge rounded-pill text-bg-primary me-2">Gratuit</span>
        <span className="badge rounded-pill text-bg-secondary">Sécurisé</span>
      </div>
    </div>
  )
}
