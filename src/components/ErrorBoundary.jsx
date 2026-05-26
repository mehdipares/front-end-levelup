import React from 'react'

/**
 * Filet de securite global : attrape les erreurs JS de rendu React
 * pour eviter la page blanche. Wrappe les routes dans App.jsx / main.jsx.
 *
 * Bonne pratique React : un ErrorBoundary doit etre un class component
 * (les hooks n'exposent pas l'equivalent de componentDidCatch).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Eviter de fuiter des donnees sensibles : on log seulement en dev.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info)
    }
  }

  handleReload = () => {
    // On reset puis on retourne a l'accueil (plus safe qu'un location.reload
    // si l'erreur vient d'une route protegee).
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="container py-5"
        role="alert"
        aria-live="assertive"
      >
        <div className="lu-card p-4 p-md-5 text-center mx-auto" style={{ maxWidth: 560 }}>
          <div className="mb-3" style={{ fontSize: '2.5rem' }} aria-hidden="true">
            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
          </div>
          <h1 className="h4 mb-2">Oups, une erreur est survenue</h1>
          <p className="text-secondary mb-4">
            L&apos;application a rencontre un probleme inattendu.
            Pas de panique, tes donnees sont en securite.
          </p>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
            >
              <i className="bi bi-house-door me-1"></i>
              Retour a l&apos;accueil
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <pre
              className="mt-4 small text-start text-danger bg-light border rounded p-2"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
