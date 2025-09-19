import React, { useEffect, useMemo, useState } from 'react'
import { listTemplates } from '../api/goalTemplates'
import { listCategories } from '../api/categories'
import { addUserGoal } from '../api/goals'
import { useAuth } from '../context/AuthContext'

export default function Templates() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('all') // 'all' | category_id
  const [addingId, setAddingId] = useState(null)
  const [q, setQ] = useState('') // 🔎 recherche

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const [tpls, cats] = await Promise.all([
          listTemplates(),
          listCategories().catch(() => [])
        ])
        if (!alive) return
        setTemplates(Array.isArray(tpls) ? tpls : [])
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement des templates')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const byCat = useMemo(() => {
    const m = new Map()
    for (const c of categories) m.set(String(c.id), c)
    return m
  }, [categories])

  const filtered = useMemo(() => {
    // filtre catégorie
    const base = activeCat === 'all'
      ? templates
      : templates.filter(t => String(t.category_id) === String(activeCat))

    // filtre recherche (titre, description, nom catégorie, fréquence)
    const query = q.trim().toLowerCase()
    if (!query) return base

    return base.filter(t => {
      const cat = byCat.get(String(t.category_id))
      const hay = [
        t.title,
        t.description,
        t.frequency_type,
        cat?.name
      ].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(query)
    })
  }, [templates, activeCat, q, byCat])

  const onAdd = async (t) => {
    try {
      setAddingId(t.id)
      const cadence = (t.frequency_type || 'daily').toLowerCase()
      await addUserGoal(userId, { template_id: t.id, cadence })
      alert('Objectif ajouté ✅')
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur ajout')
    } finally {
      setAddingId(null)
    }
  }

  // ---- Styles minimalistes pour les “pills” + input ----
  const pill = (active) => ({
    padding: '8px 14px',
    borderRadius: 999,
    border: active ? '2px solid #2b6df2' : '2px solid transparent',
    background: active ? '#eaf2ff' : '#f1f7ff',
    color: '#1f2a37',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: active ? '0 0 0 2px rgba(43,109,242,0.15) inset' : 'none'
  })
  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    outline: 'none',
    minWidth: 220
  }

  if (loading) return <p>Chargement…</p>
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>

  return (
    <div>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
        <h2 style={{ margin: 0 }}>Templates d’objectifs</h2>
        <small style={{ color:'#6b7280' }}>{filtered.length} / {templates.length}</small>
        <div style={{ marginLeft:'auto' }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher…"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Barre de catégories */}
      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
        margin: '12px 0 20px'
      }}>
        <button
          style={pill(activeCat === 'all')}
          onClick={() => setActiveCat('all')}
        >
          tous
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            style={pill(String(activeCat) === String(c.id))}
            onClick={() => setActiveCat(c.id)}
          >
            {c.name || `Catégorie ${c.id}`}
          </button>
        ))}
      </div>

      {/* Liste filtrée des templates */}
      {filtered.length === 0 ? (
        <p>Aucun template ne correspond à ta recherche.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          {filtered.map(t => {
            const cat = byCat.get(String(t.category_id))
            const enabled = t.enabled !== false
            return (
              <li key={t.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      {(cat?.name ? `${cat.name} · ` : '')}
                      {(t.frequency_type || 'daily')} · {t.base_xp ?? 0} XP
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        {t.description}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onAdd(t)}
                    disabled={!enabled || addingId === t.id}
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: 'white' }}
                    title={!enabled ? 'Template désactivé' : 'Ajouter à mes objectifs'}
                  >
                    {addingId === t.id ? 'Ajout…' : 'Ajouter'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
