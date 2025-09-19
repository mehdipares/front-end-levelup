import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listCategories } from '../api/categories'
import { createTemplate } from '../api/goalTemplates'
import { addUserGoal } from '../api/goals'

export default function CustomGoal() {
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [categories, setCategories] = useState([])

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

  const canSubmit = useMemo(() => {
    return title.trim().length >= 3
      && Number.isFinite(Number(baseXp)) && Number(baseXp) > 0
      && (frequencyType === 'daily' || frequencyType === 'weekly')
  }, [title, baseXp, frequencyType])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true); setError(''); setOk('')

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId ? Number(categoryId) : null,
        base_xp: Number(baseXp),
        frequency_type: frequencyType,           // 'daily' | 'weekly'
        frequency_interval: Number(frequencyInterval) || 1,
        max_per_period: Number(maxPerPeriod) || 1,
        enabled: true,
        visibility: 'private'                    // 👈 template privé à l'utilisateur
      }

      // 1) Créer le template
      const tpl = await createTemplate(payload)

      // 2) L’ajouter aux objectifs de l’utilisateur, cadence = fréquence choisie
      await addUserGoal(userId, { template_id: tpl.id, cadence: frequencyType })

      setOk('Objectif créé et ajouté à tes goals ✅')
      // 3) Redirige vers la page des objectifs
      navigate('/goals', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur à la création de l’objectif')
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

  return (
    <div className="container px-0" style={{ maxWidth: 720 }}>
      <h2 className="mb-3">Créer un objectif personnalisé</h2>
      <p className="text-muted">Crée un template privé, puis ajoute-le à tes objectifs en un clic.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      <form onSubmit={onSubmit} className="vstack gap-3">
        <div>
          <label className="form-label">Titre *</label>
          <input
            className="form-control"
            placeholder="Ex: Boire 2L d’eau"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <div className="form-text">Minimum 3 caractères.</div>
        </div>

        <div>
          <label className="form-label">Description (optionnel)</label>
          <textarea
            className="form-control"
            placeholder="Détails ou consignes…"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Catégorie (optionnel)</label>
            <select
              className="form-select"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">— Aucune —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name || `Catégorie ${c.id}`}</option>
              ))}
            </select>
            <div className="form-text">Permet de bénéficier des bonus si c’est une priorité.</div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">XP de base *</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={baseXp}
              onChange={e => setBaseXp(e.target.value)}
            />
            <div className="form-text">XP gagné à chaque complétion (avant bonus).</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label">Fréquence *</label>
            <select
              className="form-select"
              value={frequencyType}
              onChange={e => setFrequencyType(e.target.value)}
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Intervalle</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={frequencyInterval}
              onChange={e => setFrequencyInterval(e.target.value)}
            />
            <div className="form-text">Ex: 1 = chaque {frequencyType === 'weekly' ? 'semaine' : 'jour'}.</div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Max par période</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={maxPerPeriod}
              onChange={e => setMaxPerPeriod(e.target.value)}
            />
            <div className="form-text">Nombre max de complétions par jour/semaine.</div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={!canSubmit || saving}>
            {saving ? 'Création…' : 'Créer et ajouter à mes objectifs'}
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/templates')}>Retour aux templates</button>
        </div>
      </form>
    </div>
  )
}
