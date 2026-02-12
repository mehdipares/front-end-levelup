// src/pages/CustomGoal.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listCategories } from '../api/categories'
import { createTemplate } from '../api/goalTemplates'
import { addUserGoal } from '../api/goals'
import { customGoalSchema } from '../validation/schemas'
import { sanitizeText } from '../security/sanitize'

export default function CustomGoal() {
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [categories, setCategories] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  // form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [baseXp, setBaseXp] = useState(10)
  const [frequencyType, setFrequencyType] = useState('daily') // daily | weekly
  const [frequencyInterval, setFrequencyInterval] = useState(1) // every 1 day/week
  const [maxPerPeriod, setMaxPerPeriod] = useState(1) // max completions per period

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const cats = await listCategories()
        if (!alive) return
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement catégories')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // On garde ton canSubmit (UX), mais la validation "vraie" est Yup au submit
  const canSubmit = useMemo(() => {
    return title.trim().length >= 3
      && Number.isFinite(Number(baseXp)) && Number(baseXp) > 0
      && (frequencyType === 'daily' || frequencyType === 'weekly')
  }, [title, baseXp, frequencyType])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true); setError(''); setOk(''); setFieldErrors({})

    try {
      // ✅ 1) Validation Yup
      const raw = {
        title,
        description,
        category_id: categoryId,
        base_xp: baseXp,
        frequency_type: frequencyType,
        frequency_interval: frequencyInterval,
        max_per_period: maxPerPeriod,
      }

      const data = await customGoalSchema.validate(raw, { abortEarly: false })

      // ✅ 2) Assainissement (DOMPurify) en défense en profondeur
      const payload = {
        title: sanitizeText(data.title),
        description: data.description ? sanitizeText(data.description) : null,
        category_id: data.category_id ?? null,
        base_xp: Number(data.base_xp),
        frequency_type: data.frequency_type,           // 'daily' | 'weekly'
        frequency_interval: Number(data.frequency_interval) || 1,
        max_per_period: Number(data.max_per_period) || 1,
        enabled: true,
        visibility: 'private'
      }

      // 1) Créer le template
      const tpl = await createTemplate(payload)

      // 2) L’ajouter aux objectifs de l’utilisateur
      await addUserGoal(userId, { template_id: tpl.id, cadence: payload.frequency_type })

      setOk('Objectif créé et ajouté à tes goals ✅')
      navigate('/goals', { replace: true })
    } catch (e2) {
      // ✅ Erreurs Yup champ par champ
      if (e2?.name === 'ValidationError') {
        const map = {}
        e2.inner?.forEach((err) => {
          if (err?.path) map[err.path] = err.message
        })
        setFieldErrors(map)
        return
      }

      setError(e2?.response?.data?.error || 'Erreur à la création de l’objectif')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div className="spinner-border" role="status" />
        <strong>Chargement…</strong>
      </div>
    )
  }

  const titleErr = fieldErrors.title
  const descErr = fieldErrors.description
  const catErr = fieldErrors.category_id
  const xpErr = fieldErrors.base_xp
  const ftErr = fieldErrors.frequency_type
  const fiErr = fieldErrors.frequency_interval
  const mpErr = fieldErrors.max_per_period

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <div className="mb-3">
        <h2 className="mb-2">Créer un objectif personnalisé</h2>
        <p className="text-muted mb-0">Définis ton propre template (privé) puis ajoute-le à tes objectifs.</p>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      <div className="card lu-card">
        <div className="card-body">
          <form onSubmit={onSubmit} className="vstack gap-3" noValidate>

            {/* Titre */}
            <div>
              <label className="form-label" htmlFor="cg-title">Titre *</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-flag" /></span>
                <input
                  id="cg-title"
                  className={`form-control ${titleErr ? 'is-invalid' : ''}`}
                  placeholder="Ex: Boire 2L d’eau"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  aria-invalid={!!titleErr}
                  aria-describedby={titleErr ? 'cg-title-error' : undefined}
                />
              </div>
              {titleErr ? (
                <div id="cg-title-error" className="text-danger small mt-1">{titleErr}</div>
              ) : (
                <div className="form-text">Minimum 3 caractères.</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="form-label" htmlFor="cg-desc">Description (optionnel)</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-card-text" /></span>
                <textarea
                  id="cg-desc"
                  className={`form-control ${descErr ? 'is-invalid' : ''}`}
                  placeholder="Détails ou consignes…"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  aria-invalid={!!descErr}
                  aria-describedby={descErr ? 'cg-desc-error' : undefined}
                />
              </div>
              {descErr && <div id="cg-desc-error" className="text-danger small mt-1">{descErr}</div>}
            </div>

            {/* Catégorie + XP */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="cg-cat">Catégorie (optionnel)</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-grid-1x2" /></span>
                  <select
                    id="cg-cat"
                    className={`form-select ${catErr ? 'is-invalid' : ''}`}
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    aria-invalid={!!catErr}
                    aria-describedby={catErr ? 'cg-cat-error' : undefined}
                  >
                    <option value="">— Aucune —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name || `Catégorie ${c.id}`}</option>
                    ))}
                  </select>
                </div>
                {catErr ? (
                  <div id="cg-cat-error" className="text-danger small mt-1">{catErr}</div>
                ) : (
                  <div className="form-text">Permet de bénéficier des bonus si c’est une priorité.</div>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="cg-xp">XP de base *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-stars" /></span>
                  <input
                    id="cg-xp"
                    type="number"
                    min={1}
                    className={`form-control ${xpErr ? 'is-invalid' : ''}`}
                    value={baseXp}
                    onChange={e => setBaseXp(e.target.value)}
                    aria-invalid={!!xpErr}
                    aria-describedby={xpErr ? 'cg-xp-error' : undefined}
                  />
                  <span className="input-group-text">XP</span>
                </div>
                {xpErr ? (
                  <div id="cg-xp-error" className="text-danger small mt-1">{xpErr}</div>
                ) : (
                  <div className="form-text">
                    XP gagné à chaque complétion (avant bonus). Minimum recommandé : 10 XP.
                  </div>

                )}
              </div>
            </div>

            {/* Fréquence / Intervalle / Max */}
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cg-ft">Fréquence *</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-calendar2-week" /></span>
                  <select
                    id="cg-ft"
                    className={`form-select ${ftErr ? 'is-invalid' : ''}`}
                    value={frequencyType}
                    onChange={e => setFrequencyType(e.target.value)}
                    aria-invalid={!!ftErr}
                    aria-describedby={ftErr ? 'cg-ft-error' : undefined}
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                  </select>
                </div>
                {ftErr && <div id="cg-ft-error" className="text-danger small mt-1">{ftErr}</div>}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cg-fi">Intervalle</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-arrow-repeat" /></span>
                  <input
                    id="cg-fi"
                    type="number"
                    min={1}
                    className={`form-control ${fiErr ? 'is-invalid' : ''}`}
                    value={frequencyInterval}
                    onChange={e => setFrequencyInterval(e.target.value)}
                    aria-invalid={!!fiErr}
                    aria-describedby={fiErr ? 'cg-fi-error' : undefined}
                  />
                </div>
                {fiErr ? (
                  <div id="cg-fi-error" className="text-danger small mt-1">{fiErr}</div>
                ) : (
                  <div className="form-text">
                    Ex: 1 = chaque {frequencyType === 'weekly' ? 'semaine' : 'jour'}.
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cg-mpp">Max par période</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-123" /></span>
                  <input
                    id="cg-mpp"
                    type="number"
                    min={1}
                    className={`form-control ${mpErr ? 'is-invalid' : ''}`}
                    value={maxPerPeriod}
                    onChange={e => setMaxPerPeriod(e.target.value)}
                    aria-invalid={!!mpErr}
                    aria-describedby={mpErr ? 'cg-mpp-error' : undefined}
                  />
                </div>
                {mpErr ? (
                  <div id="cg-mpp-error" className="text-danger small mt-1">{mpErr}</div>
                ) : (
                  <div className="form-text">Nombre max de complétions par jour/semaine.</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={!canSubmit || saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Création…
                  </>
                ) : (
                  'Créer et ajouter à mes objectifs'
                )}
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => navigate('/templates')}
                disabled={saving}
              >
                Retour aux templates
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
