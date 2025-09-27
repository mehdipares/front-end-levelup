import React, { useEffect, useMemo, useState } from 'react'

/**
 * Bouton “Télécharger l’app”
 * - Android/Chrome : affiche le prompt d’installation (beforeinstallprompt)
 * - iOS : affiche un guide (Partager → Ajouter à l’écran d’accueil)
 * - Caché si l’app est installée (standalone) ou si l’utilisateur a dit “Plus tard” récemment
 *
 * Props:
 * - className?: string (pour styler/placer le bouton)
 * - daysSnooze?: number (par défaut 7 jours de pause après “Plus tard”)
 */
export default function InstallAppButton({ className = '', daysSnooze = 7 }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showGuide, setShowGuide] = useState(false) // guide iOS
  const [installed, setInstalled] = useState(false)
  const [dismissedUntil, setDismissedUntil] = useState(0)

  // ───────── Helpers ─────────
  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false
    // iOS Safari expose navigator.standalone, Chrome/Edge gèrent display-mode
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone === true
    )
  }, [])

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(ua)
  }, [])

  // ───────── Stockage local (install/dismiss) ─────────
  useEffect(() => {
    try {
      const until = Number(localStorage.getItem('lu_install_dismiss_until') || 0)
      setDismissedUntil(until)
      const done = localStorage.getItem('lu_pwa_installed') === '1'
      if (done) setInstalled(true)
    } catch {}
  }, [])

  // ───────── Events PWA ─────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Intercepte le prompt d’installation et le garde “en attente”
    const onBIP = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Quand l’app est installée (tous OS compatibles)
    const onInstalled = () => {
      try { localStorage.setItem('lu_pwa_installed', '1') } catch {}
      setInstalled(true)
      setShowGuide(false)
    }

    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // ───────── Masquage si pas le moment ─────────
  const now = Date.now()
  const snoozed = dismissedUntil > now
  const canShowButton = !installed && !isStandalone && !snoozed && (isIOS || deferredPrompt)

  if (!canShowButton) return null

  // ───────── Actions ─────────
  const snooze = (days = daysSnooze) => {
    const until = Date.now() + days * 24 * 60 * 60 * 1000
    try { localStorage.setItem('lu_install_dismiss_until', String(until)) } catch {}
    setDismissedUntil(until)
    setShowGuide(false)
  }

  const onClick = async () => {
    if (isIOS) {
      // iOS : pas d’API, on affiche un guide
      setShowGuide(true)
      return
    }
    if (!deferredPrompt) return
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === 'dismissed') {
        // utilisateur a refusé → on fait une pause pour éviter de le spammer
        snooze(daysSnooze)
      } else {
        // accepté → l’event appinstalled mettra installed=true
      }
    } catch {
      // s’il y a une erreur, on propose de réessayer plus tard
      snooze(1)
    }
  }

  return (
    <>
      {/* Bouton principal */}
      <button
        type="button"
        onClick={onClick}
        className={`btn btn-warning ${className}`}
        style={{ fontWeight: 700 }}
      >
        <i className="bi bi-download me-2" aria-hidden="true" />
        Télécharger l’app
      </button>

      {/* Guide iOS simple (overlay maison, sans JS Bootstrap) */}
      {showGuide && isIOS && (
        <div className="a2hs-overlay" role="dialog" aria-modal="true" aria-labelledby="a2hs-title">
          <div className="a2hs-card">
            <h5 id="a2hs-title" className="mb-2">Ajouter à l’écran d’accueil</h5>
            <p className="text-muted mb-3">
              Sur iPhone, appuie sur <strong>Partager</strong> <span aria-hidden>▵</span> puis
              <strong> “Ajouter à l’écran d’accueil”</strong>.
            </p>

            {/* Petites “étapes” visuelles */}
            <ol className="list-group list-group-numbered mb-3 small">
              <li className="list-group-item">Ouvre le menu <em>Partager</em> de Safari.</li>
              <li className="list-group-item">Choisis <em>“Ajouter à l’écran d’accueil”</em>.</li>
              <li className="list-group-item">Valide le nom et appuie sur <em>Ajouter</em>.</li>
            </ol>

            <div className="d-flex gap-2">
              <button className="btn btn-primary flex-fill" onClick={() => setShowGuide(false)}>
                J’ai compris
              </button>
              <button className="btn btn-outline-secondary" onClick={() => snooze(7)}>
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
