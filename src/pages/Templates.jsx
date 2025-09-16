import React, { useEffect, useState } from 'react'
import { listTemplates } from '../api/goalTemplates'
import { addUserGoal } from '../api/goals'
import { useAuth } from '../context/AuthContext'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [error, setError] = useState('')
  const { userId } = useAuth()

  useEffect(() => {
    (async () => {
      try {
        const data = await listTemplates()
        setTemplates(data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement templates')
      }
    })()
  }, [])

  const add = async (tplId) => {
    try {
      await addUserGoal(userId, { template_id: tplId, cadence: 'daily' })
      alert('Ajouté !')
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur ajout')
    }
  }

  return (
    <div>
      <h2>Templates</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      {!templates.length ? <p>Aucun template.</p> :
        <ul style={{ display:'grid', gap:8, padding:0, listStyle:'none' }}>
          {templates.map(t => (
            <li key={t.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
              <b>{t.title}</b>
              {t.description && <p style={{ marginTop:4 }}>{t.description}</p>}
              <small>Catégorie: {t.category_id || '—'} — base_xp: {t.base_xp}</small><br/>
              <button onClick={() => add(t.id)}>Ajouter à mes objectifs</button>
            </li>
          ))}
        </ul>
      }
    </div>
  )
}
