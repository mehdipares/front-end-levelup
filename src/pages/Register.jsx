import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister, login as apiLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const reg = await apiRegister({ username, email, password })
      // Some backends return a token at register time; if not, do a login:
      if (reg?.token) {
        login(reg.token)
      } else {
        const res = await apiLogin({ email, password })
        if (res?.token) login(res.token)
      }
      navigate('/onboarding', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur à l’inscription')
    }
  }

  return (
    <div>
      <h2>Créer un compte</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8, maxWidth:360 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Pseudo" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">S’inscrire</button>
      </form>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <p>Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
    </div>
  )
}
