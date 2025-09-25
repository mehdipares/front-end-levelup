// src/pages/Goals.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  listUserGoals,
  completeUserGoal,
  archiveGoal,
  unarchiveGoal,
  setGoalSchedule
} from '../api/goals'

// --- Helpers date/cadence (mêmes règles que Dashboard) ---
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

export default function Goals() {
  const { userId } = useAuth()
  const [goals, setGoals] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active') // 'active' | 'archived'
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [openCadenceFor, setOpenCadenceFor] = useState(null) // id du goal dont le menu est ouvert

  async function load(status = tab) {
    setLoading(true); setError('')
    try {
      const data = await listUserGoals(userId, status)
      setGoals(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur chargement objectifs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('active') }, [userId])
  useEffect(() => { load(tab) }, [tab]) // recharge quand on change d’onglet

  // Fermer le menu au clic en dehors
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('.lu-cadence-dropdown')) setOpenCadenceFor(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  // --- Helpers d'affichage robustes ---
  const getTitle = (g) =>
    g?.GoalTemplate?.title ??
    g?.title ??
    g?.goal_title ??
    g?.template_title ??
    g?.Template?.title ??
    g?.GoalTemplateTitle ??
    `Objectif #${g?.id ?? '—'}`

  const getCadence = (g) =>
    (g?.schedule?.cadence ?? g?.GoalTemplate?.frequency_type ?? g?.cadence ?? 'daily').toLowerCase()

  const getBaseXp = (g) =>
    g?.GoalTemplate?.base_xp ?? g?.base_xp ?? 0

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return goals
    return goals.filter(g => {
      const hay = `${getTitle(g)} ${getCadence(g)} ${String(getBaseXp(g))}`.toLowerCase()
      return hay.includes(query)
    })
  }, [goals, q])

  // --- Actions ---
  const onComplete = async (g) => {
    try {
      setBusyId(g.id)
      const res = await completeUserGoal(userId, g.id)
      alert(`+${res?.xp_awarded ?? 0} XP${res?.newLevel ? ` (niveau ${res.newLevel})` : ''}`)
      await load(tab)
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur completion')
    } finally {
      setBusyId(null)
    }
  }

  const onToggleArchive = async (g) => {
    try {
      setBusyId(g.id)
      if (g.status === 'active') {
        await archiveGoal(userId, g.id)
      } else {
        await unarchiveGoal(userId, g.id)
      }
      await load(g.status === 'active' ? 'active' : 'archived')
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur archive/unarchive')
    } finally {
      setBusyId(null)
    }
  }

  const onSetCadence = async (g, cadence) => {
    try {
      setBusyId(g.id)
      const value = String(cadence || '').toLowerCase()
      await setGoalSchedule(userId, g.id, value)
      // MAJ optimiste
      setGoals(prev => prev.map(x =>
        x.id === g.id ? { ...x, schedule: { ...(x.schedule || {}), cadence: value } } : x
      ))
      setOpenCadenceFor(null)
      await load(tab)
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur changement cadence')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container py-3">
      {/* Header + search */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mb-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Mes objectifs</h2>
          <div className="text-muted small">{filtered.length}/{goals.length} visibles</div>
        </div>

        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-search" /></span>
            <input
              type="search"
              className="form-control"
              placeholder="Rechercher un objectif…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && <button className="btn btn-outline-secondary" onClick={() => setQ('')}>Effacer</button>}
          </div>
        </div>
      </div>

      {/* Tabs Active / Archivés */}
      <ul className="nav nav-pills gap-2 mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'active' ? 'active' : ''}`}
            onClick={() => setTab('active')}
          >
            Actifs
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'archived' ? 'active' : ''}`}
            onClick={() => setTab('archived')}
          >
            Archivés
          </button>
        </li>
      </ul>

      {/* States */}
      {loading && (
        <div className="d-flex align-items-center gap-2 my-4">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <strong>Chargement…</strong>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Liste */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="alert alert-info">Aucun objectif.</div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 g-3">
              {filtered.map((g) => {
                const title = getTitle(g)
                const cadence = getCadence(g)
                const xp = getBaseXp(g)
                const eligible = isEligibleToday(g)
                const isArchived = g.status !== 'active'

                return (
                  <div key={g.id} className="col">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        {/* Title + cadence + xp */}
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="card-title mb-1" title={title} style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {title}
                          </h6>
                          <span className="badge text-bg-light">{xp} XP</span>
                        </div>
                        <div className="small text-muted mb-3 text-capitalize">
                          Cadence : {cadence}
                        </div>

                        {/* Actions */}
                        <div className="mt-auto d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onComplete(g)}
                            disabled={!eligible || busyId === g.id || isArchived}
                            title={eligible ? 'Valider maintenant' : 'Déjà validé pour la période'}
                          >
                            {busyId === g.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                …
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check2-circle me-1" />
                                Valider
                              </>
                            )}
                          </button>

                          {/* ▼ Dropdown "Cadence" contrôlé par React (pas besoin de bootstrap.js) */}
                          <div className="btn-group lu-cadence-dropdown position-relative">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm dropdown-toggle"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenCadenceFor(openCadenceFor === g.id ? null : g.id)
                              }}
                              disabled={busyId === g.id}
                              aria-expanded={openCadenceFor === g.id}
                              aria-haspopup="true"
                            >
                              Cadence
                            </button>
                            <ul
                              className={`dropdown-menu ${openCadenceFor === g.id ? 'show' : ''}`}
                              style={{ willChange: 'transform' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2"
                                  onClick={() => onSetCadence(g, 'daily')}
                                  disabled={busyId === g.id || cadence === 'daily'}
                                >
                                  {cadence === 'daily' && <i className="bi bi-check2 text-primary" />}
                                  Quotidien
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  className="dropdown-item d-flex align-items-center gap-2"
                                  onClick={() => onSetCadence(g, 'weekly')}
                                  disabled={busyId === g.id || cadence === 'weekly'}
                                >
                                  {cadence === 'weekly' && <i className="bi bi-check2 text-primary" />}
                                  Hebdo
                                </button>
                              </li>
                            </ul>
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => onToggleArchive(g)}
                            disabled={busyId === g.id}
                          >
                            {g.status === 'active' ? (
                              <>
                                <i className="bi bi-archive me-1" />
                                Archiver
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-counterclockwise me-1" />
                                Désarchiver
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
