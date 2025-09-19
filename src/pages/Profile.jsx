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

    // Prochaines échéances (best effort)
    const nextUp = goals
      .filter(g => g.status === 'active')
      .map(g => ({
        g, when: g?.next_eligible_at ? new Date(g.next_eligible_at).getTime() : 0
      }))
      .sort((a, b) => a.when - b.when)
      .slice(0, 5)
      .map(x => x.g)

    return { total, active, archived, daily, weekly, eligibleToday, topCats, nextUp }
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

  if (loading) return <p>Chargement…</p>
  if (error) return <p style={{ color:'crimson' }}>{error}</p>
  if (!user) return <p>Utilisateur introuvable.</p>

  return (
    <div>
      <h2>Profil</h2>

      {/* Bloc XP */}
      <div>
        <div>Niveau <b>{level}</b> — {xp} XP</div>
        <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', margin: '6px 0' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: '#4caf50' }} />
        </div>
        <small>Prochain niveau : {current}/{span} ({percent}%) — reste {toNext} XP</small>
      </div>

      <hr />

      {/* Stats objectifs */}
      <h3>Statistiques</h3>
      <ul>
        <li>Total objectifs : <b>{stats.total}</b></li>
        <li>Actifs : <b>{stats.active}</b> — Archivés : <b>{stats.archived}</b></li>
        <li>Cadence — Daily : <b>{stats.daily}</b> · Weekly : <b>{stats.weekly}</b></li>
        <li>Éligibles aujourd’hui : <b>{stats.eligibleToday}</b></li>
      </ul>

      <h4>Catégories les plus utilisées</h4>
      {stats.topCats.length === 0 ? (
        <p>Aucune catégorie (ajoute des objectifs pour voir des stats).</p>
      ) : (
        <ol>
          {stats.topCats.map(c => (
            <li key={c.id}>{c.name} — {c.count}</li>
          ))}
        </ol>
      )}

      <h4>Prochaines échéances</h4>
      {!stats.nextUp.length ? (
        <p>Aucune échéance connue.</p>
      ) : (
        <ul>
          {stats.nextUp.map(g => (
            <li key={g.id}>{titleOf(g)} {g.next_eligible_at ? `— dès ${new Date(g.next_eligible_at).toLocaleString()}` : ''}</li>
          ))}
        </ul>
      )}

      <h4>Priorités</h4>
      {!priorities.length ? (
        <p>Pas de priorités calculées. Lance l’onboarding pour en obtenir.</p>
      ) : (
        <ol>
          {priorities.map((p, i) => (
            <li key={`${p.category_id}-${i}`}>
              {p.Category?.name ?? p.category_name ?? `Catégorie ${p.category_id}`} — score {typeof p.score === 'number' ? p.score : (p.score_value ?? 0)}
            </li>
          ))}
        </ol>
      )}

      <hr />

      {/* Édition profil */}
      <h3>Modifier le profil</h3>
      <form onSubmit={onSave} style={{ maxWidth: 420, display: 'grid', gap: 8 }}>
        <label>
          Pseudo
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <div>
          <button type="submit" disabled={saving}>{saving ? '…' : 'Enregistrer'}</button>
          {saveMsg && <span style={{ marginLeft: 8, color: 'green' }}>{saveMsg}</span>}
        </div>
      </form>
    </div>
  )
}
