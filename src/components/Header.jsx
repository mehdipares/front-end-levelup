import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()

  const authedLinks = [
    { to: '/',           label: 'Accueil' },
    { to: '/dashboard',  label: 'Dashboard' },
    { to: '/goals',      label: 'Objectifs' },
    { to: '/templates',  label: 'Templates' },
    { to: '/profile',    label: 'Profil' },
    { to: '/custom-goal',label: 'Créer un objectif' },
  ]
  const publicLinks = [
    { to: '/',          label: 'Accueil' },
    { to: '/login',     label: 'Se connecter' },
    { to: '/register',  label: 'Créer un compte' },
  ]

  const links = isAuthenticated ? authedLinks : publicLinks

  return (
    <>
      <nav
        className="navbar navbar-dark sticky-top shadow-sm"
        style={{ background: 'var(--lu-grad)' }} // bleu/violet de la charte
      >
        <div className="container">
          {/* Burger à gauche */}
          <button
            className="navbar-toggler me-2"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#appNavLeft"
            aria-controls="appNavLeft"
            aria-label="Ouvrir le menu"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Brand */}
          <Link className="navbar-brand fw-bold" to="/">
            LEVEL·UP
          </Link>

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

      {/* Offcanvas GAUCHE (menu burger) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="appNavLeft"
        aria-labelledby="appNavLeftLabel"
        style={{ background: 'var(--lu-grad)', color: '#fff' }} // bleu charte
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appNavLeftLabel">Navigation</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Fermer"></button>
        </div>

        <div className="offcanvas-body d-flex flex-column">
          <ul className="navbar-nav flex-grow-1">
            {links.map(link => (
              <li key={link.to} className="nav-item">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    'nav-link text-white' + (isActive ? ' active fw-semibold' : '')
                  }
                  data-bs-dismiss="offcanvas" // ferme le menu au clic
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Actions en bas du menu */}
          <div className="mt-3">
            {isAuthenticated ? (
              <button
                className="btn btn-light w-100"
                onClick={logout}
                data-bs-dismiss="offcanvas"
              >
                Se déconnecter
              </button>
            ) : (
              <div className="d-grid gap-2">
                <NavLink className="btn btn-light" to="/login" data-bs-dismiss="offcanvas">
                  Se connecter
                </NavLink>
                <NavLink className="btn btn-outline-light" to="/register" data-bs-dismiss="offcanvas">
                  Créer un compte
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
