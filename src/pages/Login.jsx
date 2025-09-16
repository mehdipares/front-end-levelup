import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login: setAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login({ email, password })
      if (res?.token) {
        setAuth(res.token)
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } else {
        setError('Réponse inattendue du serveur.')
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Erreur de connexion')
    }
  }

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:8, maxWidth:360 }}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Se connecter</button>
      </form>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <p>Pas de compte ? <Link to="/register">Créer un compte</Link></p>
    </div>
  )
}
