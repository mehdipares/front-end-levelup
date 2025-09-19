import React, { useEffect, useMemo, useState } from 'react'
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
      setLoading(true)
      setError('')
      try {
        const [u, p, q, g] = await Promise.all([
          getUser(userId),
          getPriorities(userId),
          getTodayQuote('fr').catch(() => null),
          listUserGoals(userId, 'active')
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

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>
  }

  if (!user) {
    return <div className="alert alert-warning" role="alert">Impossible de récupérer le profil utilisateur.</div>
  }

  // ---- calculs XP / Level (robuste) ----
  const level = Number(user.level ?? 0)
  const xp = Number(user.xp ?? 0)
  const progress = user.xp_progress || {}
  const span = Number(progress.span ?? 0)
  const current = Number(progress.current ?? 0)
  let percent = Number(progress.percent ?? NaN)
  if (!Number.isFinite(percent)) {
    if (span > 0 && current >= 0) {
      percent = Math.min(100, Math.max(0, Math.round((current / span) * 100)))
    } else {
      percent = 0
    }
  }

  const titleOf = (g) =>
    g?.GoalTemplate?.title || g?.title || g?.template_title || `Objectif #${g?.id ?? ''}`

  const handleComplete = async (g) => {
    try {
      setDoingId(g.id)
      const res = await completeUserGoal(userId, g.id)
      console.log('completed', { xp: res?.xp_awarded, newLevel: res?.newLevel })
      // maj XP + liste des objectifs
      const [u2, g2] = await Promise.all([
        getUser(userId),
        listUserGoals(userId, 'active')
      ])
      setUser(u2 || user)
      setGoals(Array.isArray(g2) ? g2 : [])
    } catch (e) {
      alert(e?.response?.data?.error || 'Impossible de valider pour le moment')
    } finally {
      setDoingId(null)
    }
  }

  return (
    <div className="container px-0">
      {/* Quote */}
      {quote && (
        <div className="alert alert-secondary" role="alert">
          <em>&ldquo;{quote.text}&rdquo;</em>
          {quote.author && <span className="ms-2">— {quote.author}</span>}
        </div>
      )}
      

      {/* Profil + XP */}
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Profil</h5>
              <div className="row">
                <div className="col-6">
                  <div className="text-muted">Pseudo</div>
                  <div className="fw-semibold">{user.username || '—'}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Email</div>
                  <div className="fw-semibold">{user.email || '—'}</div>
                </div>
              </div>
              <hr />
              <div className="mb-2">
                <span className="badge text-bg-primary me-2">Niveau {level}</span>
                <span className="badge text-bg-light">{xp} XP</span>
              </div>

              <div className="mb-1 d-flex justify-content-between">
                <small className="text-muted">Progression niveau {level}</small>
                <small className="text-muted">{current}/{span} ({percent}%)</small>
              </div>
              <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" style={{ height: 12 }}>
                <div className="progress-bar" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Mes objectifs aujourd’hui */}
      <div className="mt-4">
        <h5 className="mb-2">Mes objectifs aujourd’hui</h5>
        {!goals.length ? (
          <p>Aucun objectif actif.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {goals.map((g) => {
              const eligible = isEligibleToday(g)
              return (
                <li
                  key={g.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    padding: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8
                  }}
                >
                  <span>{titleOf(g)}</span>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleComplete(g)}
                    disabled={!eligible || doingId === g.id}
                  >
                    {doingId === g.id ? '...' : 'Valider'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

        {/* Priorités */}
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title mb-3">Priorités</h5>
              {!priorities?.length ? (
                <div className="alert alert-info mb-0">
                  Pas de priorités calculées pour l’instant.
                  <div className="mt-2">
                    <a className="btn btn-sm btn-outline-primary" href="/onboarding">Faire l’onboarding</a>
                  </div>
                </div>
              ) : (
                <ol className="list-group list-group-numbered">
                  {priorities.map((p, idx) => {
                    const name = p.Category?.name ?? p.category_name ?? `Catégorie ${p.category_id}`
                    const score = typeof p.score === 'number' ? p.score : (p.score_value ?? 0)
                    return (
                      <li key={`${p.category_id}-${idx}`} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{name}</span>
                        <span className="badge text-bg-secondary">{score}</span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  )
}
