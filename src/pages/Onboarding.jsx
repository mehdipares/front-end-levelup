// src/pages/Onboarding.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getQuestions, submitAnswers } from '../api/onboarding'

export default function Onboarding() {
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Charge les questions (si le back renvoie 409 = déjà fait, on file au dashboard)
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const data = await getQuestions(userId, 'fr')
        const qs = (data?.items ?? data?.questions ?? [])
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        if (!alive) return
        setQuestions(qs)
        setStep(0)
      } catch (e) {
        if (e?.response?.status === 409) {
          navigate('/dashboard', { replace: true })
          return
        }
        setError(e?.response?.data?.error || 'Erreur chargement questionnaire')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId, navigate])

  const total = questions.length
  const current = questions[step]
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const stepPercent = useMemo(
    () => (total ? Math.round(((step + 1) / total) * 100) : 0),
    [step, total]
  )

  const setValue = (qid, value) => setAnswers(prev => ({ ...prev, [qid]: value }))
  const next = () => { if (step < total - 1) setStep(s => s + 1) }
  const prev = () => { if (step > 0) setStep(s => s - 1) }

  // Soumission finale → on envoie au back, puis on VA DIRECTEMENT sur /welcome
  const onSubmit = async (e) => {
    e.preventDefault()
    if (answeredCount !== total) return
    setSubmitting(true); setError('')
    try {
      const list = Object.entries(answers).map(([qid, val]) => ({
        question_id: Number(qid),
        value: Number(val)
      }))
      await submitAnswers(userId, list, 'fr')

      // 🔁 Pas de “wait” : on redirige sur /welcome, le temps que la BDD bascule.
      navigate('/welcome', { replace: true })
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  // Raccourcis clavier (1..5, ← →)
  const handleKey = useCallback((e) => {
    if (!current) return
    if (e.key >= '1' && e.key <= '5') {
      setValue(current.id, Number(e.key))
    } else if (e.key === 'ArrowRight') {
      if (answers[current.id] != null) next()
    } else if (e.key === 'ArrowLeft') {
      prev()
    }
  }, [current, answers])
  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" aria-hidden="true" />
        <div className="mt-2 fw-semibold">Chargement du questionnaire…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
        <button className="btn btn-outline-primary" onClick={() => navigate('/dashboard', { replace: true })}>
          Revenir au dashboard
        </button>
      </div>
    )
  }

  if (!total) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold mb-1">Onboarding</h2>
        <p className="text-muted">Aucune question disponible pour le moment.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard', { replace: true })}>
          Passer et aller au Dashboard
        </button>
      </div>
    )
  }

  // Garde-fou (rare) si step out-of-range
  if (!current) {
    setStep(0)
    return <div className="container py-5 text-center">Préparation du questionnaire…</div>
  }

  const answered = answers[current.id] != null

  return (
    <div className="container py-4" style={{ maxWidth: 760 }}>
      {/* Entête + progression */}
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div>
            <h2 className="fw-bold mb-1">Onboarding</h2>
            <div className="text-muted">Question <b>{step + 1}</b> / {total}</div>
          </div>
          <span className="badge rounded-pill text-bg-primary">
            {Math.max(answeredCount, step + 1)}/{total}
          </span>
        </div>
        <div className="progress xp mt-2" role="progressbar" aria-valuenow={stepPercent} aria-valuemin="0" aria-valuemax="100" style={{ height: 12 }}>
          <div className="progress-bar" style={{ width: `${stepPercent}%` }} />
        </div>
      </div>

      {/* Carte question */}
      <form onSubmit={onSubmit}>
        <div className="card lu-card shadow-sm">
          <div className="card-body p-4">
            <p className="fs-5 fw-semibold mb-3">{current.question}</p>

            <div className="d-flex flex-wrap gap-2">
              {[1,2,3,4,5].map((v) => {
                const inputId = `q_${current.id}_${v}`
                const checked = Number(answers[current.id] || 0) === v
                return (
                  <div key={v} className="form-check form-check-inline">
                    <input
                      className="btn-check"
                      type="radio"
                      name={`q_${current.id}`}
                      id={inputId}
                      value={v}
                      checked={checked}
                      onChange={() => setValue(current.id, v)}
                    />
                    <label className={`btn ${checked ? 'btn-primary' : 'btn-outline-primary'}`} htmlFor={inputId} style={{ minWidth: 48 }}>
                      {v}
                    </label>
                  </div>
                )
              })}
            </div>

            <div className="small text-muted mt-2">
              1 = Pas du tout d’accord · 5 = Tout à fait d’accord
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <button type="button" className="btn btn-outline-secondary" onClick={prev} disabled={step === 0}>
                <i className="bi bi-arrow-left me-1" /> Précédent
              </button>

              {step < total - 1 ? (
                <button type="button" className="btn btn-primary" onClick={next} disabled={!answered}>
                  Suivant <i className="bi bi-arrow-right ms-1" />
                </button>
              ) : (
                <button type="submit" className="btn btn-success" disabled={answeredCount !== total || submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle me-1" />
                      Terminer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="text-center text-muted small mt-3">
        Astuce : <kbd>1</kbd>…<kbd>5</kbd> pour répondre, <kbd>←</kbd>/<kbd>→</kbd> pour naviguer.
      </div>
    </div>
  )
}
