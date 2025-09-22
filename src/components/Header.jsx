import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Offcanvas } from 'bootstrap' // ✅ API ESM fiable

export default function Header() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const linksAuthed = [
    { to: '/',            label: 'Accueil' },
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/goals',       label: 'Objectifs' },
    { to: '/templates',   label: 'Templates' },
    { to: '/profile',     label: 'Profil' },
    { to: '/custom-goal', label: 'Créer un objectif' },
  ]
  const linksPublic = [
    { to: '/',          label: 'Accueil' },
    { to: '/login',     label: 'Se connecter' },
    { to: '/register',  label: 'Créer un compte' },
  ]
  const links = isAuthenticated ? linksAuthed : linksPublic

  const getOC = () => {
    const el = document.getElementById('appNavLeft')
    if (!el) return null
    return Offcanvas.getInstance(el) || new Offcanvas(el)
  }

  const openMenu = () => { getOC()?.toggle() }
  const go = (to) => {
    navigate(to)
    // petite tempo pour laisser React Router changer la page avant fermeture
    setTimeout(() => getOC()?.hide(), 0)
  }

  return (
    <>
      <nav
        className="navbar navbar-dark sticky-top shadow-sm"
        style={{ background: 'var(--lu-grad)' }} // bleu/violet charte
      >
        <div className="container">
          {/* Burger à gauche — ouverture programmatique */}
          <button
            className="navbar-toggler me-2"
            type="button"
            aria-label="Ouvrir le menu"
            onClick={openMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Brand */}
          <NavLink className="navbar-brand fw-bold" to="/" onClick={() => go('/')}>
            LEVEL·UP
          </NavLink>

          {/* Bouton à droite */}
          <div className="ms-auto d-flex align-items-center gap-2">
            {isAuthenticated && (
              <button className="btn btn-light btn-sm" onClick={logout}>
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Offcanvas GAUCHE — fond charte */}
      <div
        className="offcanvas offcanvas-start"
        id="appNavLeft"
        aria-labelledby="appNavLeftLabel"
        style={{ background: 'var(--lu-grad)', color: '#fff' }}
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appNavLeftLabel">Navigation</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => getOC()?.hide()} aria-label="Fermer"></button>
        </div>

        <div className="offcanvas-body d-flex flex-column">
          <ul className="navbar-nav flex-grow-1">
            {links.map(link => (
              <li key={link.to} className="nav-item">
                {/* NavLink pour le style actif + navigation manuelle fiable */}
                <NavLink
                  to={link.to}
                  onClick={(e) => { e.preventDefault(); go(link.to) }}
                  className={({ isActive }) =>
                    'nav-link text-white' + (isActive ? ' active fw-semibold' : '')
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Actions en bas */}
          <div className="mt-3">
            {isAuthenticated ? (
              <button className="btn btn-light w-100" onClick={() => { logout(); getOC()?.hide() }}>
                Se déconnecter
              </button>
            ) : (
              <div className="d-grid gap-2">
                <button className="btn btn-light" onClick={() => go('/login')}>Se connecter</button>
                <button className="btn btn-outline-light" onClick={() => go('/register')}>Créer un compte</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
