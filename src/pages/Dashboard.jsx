import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUser, getPriorities } from '../api/users'
import { getTodayQuote } from '../api/quotes'
import { listUserGoals, completeUserGoal } from '../api/goals'

// Helpers date/cadence
function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate()
}
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1))
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7)
}
function isSameISOWeek(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getUTCFullYear() === db.getUTCFullYear() && getISOWeek(da) === getISOWeek(db)
}
function isEligibleToday(g) {
  if (g?.next_eligible_at) {
    try { return new Date(g.next_eligible_at).getTime() <= Date.now() } catch {}
  }
  const last = g?.last_completed_at || g?.lastCompletedAt
  const cadence = (g?.schedule?.cadence || g?.GoalTemplate?.frequency_type || 'daily').toLowerCase()
  if (!last) return true
  if (cadence === 'weekly') return !isSameISOWeek(last, new Date())
  return !isSameDay(last, new Date())
}

export default function Dashboard() {
  const { userId } = useAuth()
  const [user, setUser] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [quote, setQuote] = useState(null)
  const [goals, setGoals] = useState([])
  const [doingId, setDoingId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const [u, p, q, g] = await Promise.all([
          getUser(userId).catch(() => null),
          getPriorities(userId).catch(() => []),
          getTodayQuote('fr').catch(() => null),
          listUserGoals(userId, 'active').catch(() => [])
        ])
        if (!alive) return
        setUser(u || null)
        setPriorities(Array.isArray(p) ? p : [])
        setQuote(q || null)
        setGoals(Array.isArray(g) ? g : [])
      } catch (e) {
        console.error('[Dashboard] load error:', e)
        setError(e?.response?.data?.error || 'Erreur chargement dashboard')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <strong>Chargement du dashboard…</strong>
      </div>
    )
  }
  if (error) return <div className="alert alert-danger" role="alert">{error}</div>

  // XP / Level safe
  const level   = Number(user?.level ?? 0)
  const span    = Number(user?.xp_progress?.span ?? 0)
  const current = Number(user?.xp_progress?.current ?? 0)
  let percent   = Number(user?.xp_progress?.percent ?? NaN)
  if (!Number.isFinite(percent)) {
    percent = span > 0 ? Math.min(100, Math.max(0, Math.round((current / span) * 100))) : 0
  }

  const titleOf = (g) => g?.GoalTemplate?.title || g?.title || g?.template_title || `Objectif #${g?.id ?? ''}`
  const eligibleCount = goals.filter(isEligibleToday).length

  const scores   = priorities.map(p => Number(p.score ?? p.score_value ?? 0))
  const maxScore = Math.max(1, ...scores)

  const handleComplete = async (g) => {
    try {
      setDoingId(g.id)
      await completeUserGoal(userId, g.id)
      const [u2, g2] = await Promise.all([
        getUser(userId).catch(() => user),
        listUserGoals(userId, 'active').catch(() => goals)
      ])
      setUser(u2 || user)
      setGoals(Array.isArray(g2) ? g2 : goals)
    } catch (e) {
      alert(e?.response?.data?.error || 'Impossible de valider pour le moment')
    } finally {
      setDoingId(null)
    }
  }

  const goalEmoji = (g) => {
    const name = (g?.GoalTemplate?.title || '').toLowerCase()
    if (name.includes('sport') || name.includes('muscu') || name.includes('run')) return '🏋️'
    if (name.includes('médit') || name.includes('respir')) return '🧘'
    if (name.includes('lecture') || name.includes('lire')) return '📚'
    if (name.includes('sommeil') || name.includes('dodo')) return '😴'
    if (name.includes('eau') || name.includes('hydrate')) return '💧'
    return '✅'
  }

  return (
    <div className="container py-3">
      {/* Barre d’XP (hero) */}
      <div className="d-flex justify-content-center mb-4">
        <div className="w-100 lu-hero" style={{ maxWidth: 920 }}>
          <div className="lu-hero-caption">
            <span>Niveau {level}</span>
            <span>{current}/{span} ({percent}%)</span>
          </div>
          <div className="progress xp">
            <div className="progress-bar" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* Citation */}
      {quote && (
        <div className="lu-quote text-center mb-4">
          <em>&ldquo;{quote.text}&rdquo;</em>
          {quote.author && <span className="ms-2">— {quote.author}</span>}
        </div>
      )}

      {/* Grille responsive */}
      <div className="row g-4 align-items-start">
        {/* OBJECTIFS — conteneur invisible */}
        <div className="col-12 col-lg-6">
          <div className="text-center mb-3">
            <h5 className="lu-section-title mb-1">Mes objectifs aujourd’hui</h5>
            <div className="small text-muted">{eligibleCount}/{goals.length} prêts</div>
          </div>

          {!goals.length ? (
            <div className="text-center">
              <div className="alert alert-light border mb-2">Aucun objectif actif.</div>
              {/* 👉 CTA vers Templates quand il n'y a aucun objectif (SPA) */}
              <Link to="/templates" className="btn btn-primary" role="button">
                Ajouter des objectifs
              </Link>
            </div>
          ) : (
            <>
              <div className="lu-goal-group">
                {goals.map((g) => {
                  const eligible = isEligibleToday(g)
                  return (
                    <div key={g.id} className="lu-goal-card">
                      <div className="lu-goal-left">
                        <span className="lu-ico">{goalEmoji(g)}</span>
                        <span className="fw-semibold text-truncate">{titleOf(g)}</span>
                      </div>
                      <button
                        className={`btn btn-sm ${eligible ? 'btn-success' : 'btn-secondary'} lu-pill-btn`}
                        onClick={() => handleComplete(g)}
                        disabled={!eligible || doingId === g.id}
                        title={eligible ? 'Valider' : 'Indisponible pour le moment'}
                      >
                        {doingId === g.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Validation…
                          </>
                        ) : (eligible ? 'Valider' : 'Indispo')}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* 👉 CTA sous la liste en SPA */}
              <div className="d-grid d-sm-flex gap-2 mt-3">
                <Link to="/templates" className="btn btn-outline-primary flex-fill" role="button">
                  Ajouter des objectifs
                </Link>
                <Link to="/goals" className="btn btn-primary d-none d-md-inline-flex" role="button">
                  Gérer mes objectifs
                </Link>
              </div>
            </>
          )}

          {/* Bouton "Gérer mes objectifs" pour MOBILE (SPA) */}
          <Link to="/goals" className="btn btn-primary w-100 d-md-none mt-3" role="button">
            gérer mes objectifs
          </Link>
        </div>

        {/* PRIORITÉS — carte violette, items transparents */}
        <div className="col-12 col-lg-6">
          <div className="lu-prio">
            <div className="card-body">
              <h5 className="lu-section-title mb-3">Priorités</h5>

              {!priorities?.length ? (
                <div className="alert alert-info mb-0">
                  Pas de priorités calculées pour l’instant.
                  <div className="mt-2">
                    <Link className="btn btn-sm btn-outline-primary" to="/onboarding" role="button">
                      Commencer l’onboarding
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="list-group">
                  {priorities.map((p, idx) => {
                    const name  = p.Category?.name ?? p.category_name ?? `Catégorie ${p.category_id}`
                    const score = Number(p.score ?? p.score_value ?? 0)
                    const w = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)))
                    return (
                      <li key={`${p.category_id}-${idx}`} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">{name}</span>
                          <span className="badge text-bg-secondary">{score}</span>
                        </div>
                        <div className="lu-meter">
                          <div className="lu-meter-fill" style={{ '--w': `${w}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
