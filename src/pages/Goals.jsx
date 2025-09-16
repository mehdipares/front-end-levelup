import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listUserGoals, completeUserGoal, archiveGoal, unarchiveGoal, setGoalSchedule } from '../api/goals'

export default function Goals() {
  const { userId } = useAuth()
  const [goals, setGoals] = useState([])
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await listUserGoals(userId, 'active')
      setGoals(data || [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur chargement objectifs')
    }
  }

  useEffect(() => { load() }, [userId])

  const complete = async (g) => {
    try {
      const res = await completeUserGoal(userId, g.id)
      alert(`+${res.xp_awarded} XP (niveau ${res.newLevel})`)
      load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur completion')
    }
  }

  const toggleArchive = async (g) => {
    try {
      if (g.status === 'active') {
        await archiveGoal(userId, g.id)
      } else {
        await unarchiveGoal(userId, g.id)
      }
      load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur archive/unarchive')
    }
  }

  const setCadence = async (g, cadence) => {
    try {
      await setGoalSchedule(userId, g.id, cadence)
      load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Erreur changement cadence')
    }
  }

  return (
    <div>
      <h2>Mes objectifs</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      {!goals.length ? <p>Aucun objectif.</p> :
        <ul style={{ display:'grid', gap: 8, padding:0, listStyle:'none' }}>
          {goals.map(g => (
            <li key={g.id} style={{ border:'1px solid #ddd', borderRadius:8, padding:12 }}>
              <b>{g.GoalTemplate?.title || 'Objectif'}</b><br/>
              <small>Cadence: {g.GoalTemplate?.frequency_type} / XP de base: {g.GoalTemplate?.base_xp}</small>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button onClick={() => complete(g)}>Marquer comme fait</button>
                <button onClick={() => toggleArchive(g)}>{g.status === 'active' ? 'Archiver' : 'Désarchiver'}</button>
                <button onClick={() => setCadence(g, 'daily')}>Quotidien</button>
                <button onClick={() => setCadence(g, 'weekly')}>Hebdo</button>
              </div>
            </li>
          ))}
        </ul>
      }
    </div>
  )
}
