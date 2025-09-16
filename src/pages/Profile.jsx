import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUser, updateUser } from '../api/users'

export default function Profile() {
  const { userId } = useAuth()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const data = await getUser(userId)
        setUser(data)
        setEmail(data.email || '')
        setUsername(data.username || '')
      } catch (e) {
        setError(e?.response?.data?.error || 'Erreur chargement profil')
      }
    })()
  }, [userId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setOk(''); setError('')
    try {
      const res = await updateUser(userId, { email, username })
      setUser(res)
      setOk('Profil mis à jour ✅')
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur mise à jour')
    }
  }

  if (error) return <p style={{ color:'crimson' }}>{error}</p>
  if (!user) return <p>Chargement...</p>

  return (
    <div>
      <h2>Profil</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8, maxWidth:360 }}>
        <label>Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>Pseudo
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <button type="submit">Enregistrer</button>
      </form>
      {ok && <p style={{ color:'green' }}>{ok}</p>}
      {error && <p style={{ color:'crimson' }}>{error}</p>}
    </div>
  )
}
