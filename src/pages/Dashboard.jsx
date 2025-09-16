import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUser, getPriorities } from '../api/users'
import { getTodayQuote } from '../api/quotes'

export default function Dashboard() {
  const { userId } = useAuth()
  const [user, setUser] = useState(null)
  const [priorities, setPriorities] = useState([])
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [u, p, q] = await Promise.all([
          getUser(userId),
          getPriorities(userId),
          getTodayQuote('fr')
        ])
        setUser(u)
        setPriorities(p)
        setQuote(q)
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement dashboard')
      }
    })()
  }, [userId])

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>
  if (!user) return <p>Chargement...</p>

  return (
    <div>
      <h2>Dashboard</h2>
      {quote && <blockquote style={{ background:'#f7f7f7', padding:12, borderRadius:8 }}>
        <p style={{ margin:0, fontStyle:'italic' }}>&ldquo;{quote.text}&rdquo;</p>
        <small>&mdash; {quote.author || 'Inconnu'}</small>
      </blockquote>}
      <p><b>Pseudo:</b> {user.username || '—'}<br/>
         <b>Email:</b> {user.email}<br/>
         <b>Niveau:</b> {user.level} ({user.xp} XP)</p>
      <p>Progression niveau: {user.xp_progress?.percent}% ({user.xp_progress?.current}/{user.xp_progress?.span})</p>

      <h3>Priorités</h3>
      {!priorities.length ? <p>Pas de priorités calculées (fais l’onboarding).</p> :
        <ol>
          {priorities.map(p => <li key={p.category_id}>{p.Category?.name || p.category_name} — {p.score}</li>)}
        </ol>
      }
    </div>
  )
}
