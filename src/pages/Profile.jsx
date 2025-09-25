// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUser, getPriorities, updateUser } from '../api/users'
import { listUserGoals } from '../api/goals'
import { listCategories } from '../api/categories'

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
function cadenceOf(g) {
  return (g?.schedule?.cadence || g?.GoalTemplate?.frequency_type || 'daily').toLowerCase()
}
function isEligibleToday(g) {
  if (g?.next_eligible_at) {
    try { return new Date(g.next_eligible_at).getTime() <= Date.now() } catch {}
  }
  const last = g?.last_completed_at || g?.lastCompletedAt
  const cad = cadenceOf(g)
  if (!last) return true
  if (cad === 'weekly') return !isSameISOWeek(last, new Date())
  return !isSameDay(last, new Date())
}
function titleOf(g) {
  return g?.GoalTemplate?.title || g?.title || g?.template_title || `Objectif #${g?.id ?? ''}`
}

export default function Profile() {
  const { userId } = useAuth()
  const [user, setUser] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Form profil
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError(''); setSaveMsg('')
      try {
        const [u, p, g, cats] = await Promise.all([
          getUser(userId),
          getPriorities(userId),
          listUserGoals(userId, 'all'),
          listCategories().catch(() => [])
        ])
        if (!alive) return
        setUser(u || null)
        setPriorities(Array.isArray(p) ? p : [])
        setGoals(Array.isArray(g) ? g : [])
        setCategories(Array.isArray(cats) ? cats : [])
        setUsername(u?.username || '')
        setEmail(u?.email || '')
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement profil')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [userId])

  // Maps utiles
  const catName = useMemo(() => {
    const m = new Map()
    categories.forEach(c => m.set(String(c.id), c.name || `Catégorie ${c.id}`))
    return m
  }, [categories])

  // Stats objectifs
  const stats = useMemo(() => {
    const total = goals.length
    const active = goals.filter(g => g.status === 'active').length
    const archived = goals.filter(g => g.status === 'archived').length
    const daily = goals.filter(g => cadenceOf(g) === 'daily').length
    const weekly = goals.filter(g => cadenceOf(g) === 'weekly').length
    const eligibleToday = goals.filter(g => g.status === 'active' && isEligibleToday(g)).length

    // Comptage par catégorie (actifs uniquement)
    const byCat = new Map()
    goals.filter(g => g.status === 'active').forEach(g => {
      const cid = String(g?.GoalTemplate?.category_id ?? g?.category_id ?? '')
      if (!cid) return
      byCat.set(cid, (byCat.get(cid) || 0) + 1)
    })
    // top 5 catégories
    const topCats = Array.from(byCat.entries())
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([cid, count]) => ({ id: cid, name: catName.get(cid) || `Catégorie ${cid}`, count }))

    // Prochaines échéances
    const nextUp = goals
      .filter(g => g.status === 'active')
      .map(g => ({
        g, when: g?.next_eligible_at ? new Date(g.next_eligible_at).getTime() : 0
      }))
      .sort((a, b) => a.when - b.when)
      .slice(0, 5)
      .map(x => x.g)

    // pour barres %
    const maxCount = topCats.reduce((m, c) => Math.max(m, c.count), 0) || 1

    return { total, active, archived, daily, weekly, eligibleToday, topCats, nextUp, maxCount }
  }, [goals, catName])

  // Progression XP
  const level = Number(user?.level ?? 0)
  const xp = Number(user?.xp ?? 0)
  const pr = user?.xp_progress || {}
  const span = Number(pr.span ?? 0)
  const current = Number(pr.current ?? 0)
  const percent = Number.isFinite(pr.percent) ? pr.percent : (span > 0 ? Math.round((current / span) * 100) : 0)
  const toNext = span > 0 ? Math.max(0, span - current) : 0

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true); setSaveMsg(''); setError('')
    try {
      await updateUser(userId, { username, email })
      setSaveMsg('Profil mis à jour ✅')
      const fresh = await getUser(userId)
      setUser(fresh || user)
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Échec de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div className="spinner-border" role="status" aria-hidden="true" />
        <strong>Chargement…</strong>
      </div>
    )
  }
  if (error) return <div className="alert alert-danger">{error}</div>
  if (!user) return <div className="alert alert-warning">Utilisateur introuvable.</div>

  return (
    <div className="container py-3">
      {/* Titre */}
      <div className="d-flex align-items-baseline justify-content-between mb-3">
        <h2 className="mb-0">Profil</h2>
        <span className="badge text-bg-primary">Niveau {level}</span>
      </div>

      {/* Bandeau XP */}
      <div className="lu-hero mb-4">
        <div className="lu-hero-caption">
          <span>Progression vers le niveau {level + 1}</span>
          <span>{current}/{span} ({percent}%)</span>
        </div>
        <div className="progress xp" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <div className="d-flex justify-content-between mt-2 small">
          <span className="badge text-bg-light">{xp} XP total</span>
          <span className="text-white-50">Reste {toNext} XP</span>
        </div>
      </div>

      <div className="row g-3">
        {/* Colonne gauche: Édition profil + Statistiques clés */}
        <div className="col-12 col-lg-6">
          {/* Formulaire profil */}
          <div className="card lu-card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Informations du compte</h5>

              <form onSubmit={onSave} className="vstack gap-3" style={{ maxWidth: 480 }}>
                <div>
                  <label className="form-label">Pseudo</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-person" /></span>
                    <input
                      className="form-control"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Ton pseudo"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text"><i className="bi bi-envelope" /></span>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Enregistrement…
                      </>
                    ) : 'Enregistrer'}
                  </button>
                  {saveMsg && <span className="text-success">{saveMsg}</span>}
                </div>
              </form>
            </div>
          </div>

          {/* Statistiques clés */}
          <div className="card lu-card">
            <div className="card-body">
              <h5 className="card-title mb-3">Statistiques</h5>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="p-3 border-soft rounded-2xl text-center">
                    <div className="text-muted small">Total objectifs</div>
                    <div className="fs-5 fw-bold">{stats.total}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 border-soft rounded-2xl text-center">
                    <div className="text-muted small">Actifs</div>
                    <div className="fs-5 fw-bold">{stats.active}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 border-soft rounded-2xl text-center">
                    <div className="text-muted small">Archivés</div>
                    <div className="fs-5 fw-bold">{stats.archived}</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 border-soft rounded-2xl text-center">
                    <div className="text-muted small">Éligibles aujourd’hui</div>
                    <div className="fs-5 fw-bold">{stats.eligibleToday}</div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <span className="lu-chip">Daily: {stats.daily}</span>
                <span className="lu-chip">Weekly: {stats.weekly}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite: Catégories, Prochaines échéances, Priorités */}
        <div className="col-12 col-lg-6">
          {/* Catégories top */}
          <div className="card lu-card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Catégories les plus utilisées</h5>
              {stats.topCats.length === 0 ? (
                <div className="alert alert-info mb-0">Aucune catégorie (ajoute des objectifs pour voir des stats).</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {stats.topCats.map(c => {
                    const pct = Math.round((c.count / stats.maxCount) * 100)
                    return (
                      <li key={c.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-truncate">{c.name}</strong>
                          <span className="badge text-bg-secondary">{c.count}</span>
                        </div>
                        <div className="lu-meter">
                          <div className="lu-meter-fill" style={{ '--w': `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Prochaines échéances */}
          <div className="card lu-card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Prochaines échéances</h5>
              {!stats.nextUp.length ? (
                <div className="alert alert-light mb-0">Aucune échéance connue.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {stats.nextUp.map(g => (
                    <li key={g.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="text-truncate">
                        <i className="bi bi-calendar-check me-2" />
                        {titleOf(g)}
                      </div>
                      {g.next_eligible_at && (
                        <small className="text-muted">
                          {new Date(g.next_eligible_at).toLocaleString()}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Priorités (fond violet doux) */}
          <div className="card lu-prio">
            <div className="card-body">
              <h5 className="card-title mb-3">Priorités</h5>
              {!priorities.length ? (
                <div className="alert alert-light mb-0">
                  Pas de priorités calculées. Lance l’onboarding pour en obtenir.
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {priorities.map((p, i) => {
                    const name = p.Category?.name ?? p.category_name ?? `Catégorie ${p.category_id}`
                    const score = typeof p.score === 'number' ? p.score : (p.score_value ?? 0)
                    return (
                      <li key={`${p.category_id}-${i}`} className="list-group-item d-flex justify-content-between align-items-center" style={{ background:'transparent' }}>
                        <span className="text-truncate">{name}</span>
                        <span className="badge text-bg-light">{score}</span>
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
