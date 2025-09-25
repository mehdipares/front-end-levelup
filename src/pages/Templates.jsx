// src/pages/Templates.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listTemplates } from '../api/goalTemplates'
import { listCategories } from '../api/categories'
import { addUserGoal } from '../api/goals'
import { Toast } from 'bootstrap' // ✅ API Bootstrap pour afficher la toast

export default function Templates() {
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState(null)

  // Toast refs/state
  const toastRef = useRef(null)
  const toastInstRef = useRef(null)
  const [toastMsg, setToastMsg] = useState('')

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

  // Instancier la Toast Bootstrap une fois le DOM monté
  useEffect(() => {
    if (toastRef.current) {
      toastInstRef.current = Toast.getOrCreateInstance(toastRef.current, {
        autohide: true,
        delay: 2600
      })
    }
  }, [])

  // Afficher la toast quand le message change
  useEffect(() => {
    if (toastMsg && toastInstRef.current) {
      toastInstRef.current.show()
    }
  }, [toastMsg])

  const catById = useMemo(() => {
    const m = new Map()
    for (const c of categories) m.set(String(c.id), c)
    return m
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter(t => {
      const inCat = activeCat === 'all' || String(t.category_id) === String(activeCat)
      if (!inCat) return false
      if (!q) return true
      const hay = `${t.title ?? ''} ${(t.description ?? '')} ${(t.frequency_type ?? '')} ${(catById.get(String(t.category_id))?.name ?? '')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [templates, activeCat, search, catById])

  const onAdd = async (t) => {
    try {
      setAddingId(t.id)
      const cadence = (t.frequency_type || 'daily').toLowerCase()
      await addUserGoal(userId, { template_id: t.id, cadence })

      // ✅ Notif “stylée” au lieu de alert()
      setToastMsg(`“${t.title}” ajouté à tes objectifs 🎉`)
    } catch (e) {
      // En cas d’erreur réseau/API, on garde une vraie alerte rouge Bootstrap
      setError(e?.response?.data?.error || 'Erreur ajout')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="container py-3">
      {/* Toast container (fixe, en bas à droite) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 1080 }}
      >
        <div
          ref={toastRef}
          className="toast border-0 text-white"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 35%, #7C3AED 100%)',
            boxShadow: '0 10px 30px rgba(16,24,40,.2)',
            minWidth: 280
          }}
        >
          <div className="toast-body d-flex align-items-start">
            <i className="bi bi-check2-circle fs-5 me-2" />
            <div className="flex-grow-1">
              <strong>Objectif ajouté !</strong>
              <div className="small opacity-90">{toastMsg}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Titre + compteur + recherche */}
      <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3 mb-3">
        <div className="flex-grow-1">
          <h2 className="mb-1">Templates d’objectifs</h2>
          <div className="text-muted small">{filtered.length}/{templates.length} visibles</div>
        </div>

        <div className="w-100" style={{ maxWidth: 480 }}>
          <label className="visually-hidden" htmlFor="tplSearch">Rechercher</label>
          <div className="input-group">
            <span className="input-group-text" id="tplSearchIcon">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input
              id="tplSearch"
              type="search"
              className="form-control"
              placeholder="Rechercher un template…"
              aria-describedby="tplSearchIcon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                Effacer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catégories (pills scrollables & contrastées) */}
      <nav className="mb-3">
        <ul className="nav nav-pills gap-2 flex-nowrap overflow-auto pb-1 lu-catbar">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeCat === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCat('all')}
            >
              <i className="bi bi-stars me-1" aria-hidden="true" /> Tous
            </button>
          </li>
          {categories.map((c) => (
            <li className="nav-item" key={c.id}>
              <button
                type="button"
                className={`nav-link ${String(activeCat) === String(c.id) ? 'active' : ''}`}
                onClick={() => setActiveCat(c.id)}
                title={c.name}
              >
                {c.name || `Catégorie ${c.id}`}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* États */}
      {loading && (
        <div className="d-flex align-items-center gap-2 my-4">
          <div className="spinner-border" role="status" aria-hidden="true"></div>
          <strong>Chargement…</strong>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Grille responsive */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="alert alert-info">
              Aucun template ne correspond à votre recherche/catégorie.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {filtered.map(t => {
                const cat = catById.get(String(t.category_id))
                const enabled = t.enabled !== false
                const freq = (t.frequency_type || 'daily').toLowerCase()

                return (
                  <div key={t.id} className="col">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        {/* Titre + état */}
                        <div className="d-flex align-items-start justify-content-between mb-1">
                          <h6 className="card-title mb-1 text-truncate" title={t.title}>{t.title}</h6>
                          {!enabled && <span className="badge text-bg-secondary ms-2">Off</span>}
                        </div>

                        {/* Métadonnées */}
                        <div className="mb-2 small text-muted">
                          {(cat?.name ? `${cat.name} · ` : '')}
                          {freq} · {t.base_xp ?? 0} XP
                        </div>

                        {/* Description clampée */}
                        {t.description && (
                          <p
                            className="card-text small text-muted mb-3"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '2.8em'
                            }}
                            title={t.description}
                          >
                            {t.description}
                          </p>
                        )}

                        {/* CTA */}
                        <div className="mt-auto d-grid">
                          <button
                            className="btn btn-primary"
                            onClick={() => onAdd(t)}
                            disabled={!enabled || addingId === t.id}
                            title={!enabled ? 'Template désactivé' : 'Ajouter à mes objectifs'}
                          >
                            {addingId === t.id ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Ajout…
                              </>
                            ) : (
                              <>
                                <i className="bi bi-plus-lg me-1" /> Ajouter
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
