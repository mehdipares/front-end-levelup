import React, { useEffect, useState, useCallback } from 'react'

/**
 * Bouton / bannière d'installation PWA (Bootstrap friendly).
 * - S'affiche seulement si l'app N'EST PAS installée.
 * - Web (Chrome/Edge/Android) : bouton "Installer".
 * - iOS (Safari) : mini-guide "Partager → Ajouter à l'écran d'accueil".
 * - Dismiss sauvegardé en localStorage (évite de spammer l'utilisateur).
 */

const STORAGE_KEY = 'lu_pwa_prompt_dismissed_at'
const DISMISS_DAYS = 30 // ne plus remontrer pendant 30 jours

function isDismissedRecently() {
  try {
    const ts = Number(localStorage.getItem(STORAGE_KEY) || 0)
    if (!ts) return false
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24)
    return days < DISMISS_DAYS
  } catch { return false }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  // Détection "déjà installé"
  const isStandalone = (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true)
  )

  // iOS ?
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  // Ne rien montrer si déjà installé ou si récemment dismiss
  const shouldShow = !isStandalone && !isDismissedRecently()

  useEffect(() => {
    if (!shouldShow) return

    // Event natif: avant l'installation (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault() // on gère le prompt nous-mêmes
      setDeferredPrompt(e)
      setVisible(true)
    }

    // Si l'app est installée → on masque définitivement
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setVisible(false)
      markDismissed()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cas iOS: pas d'event — on affiche directement le guide
    if (isIOS) setVisible(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [shouldShow, isIOS])

  const onInstallClick = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    try {
      const { outcome } = await deferredPrompt.userChoice
      // Optionnel: analytics du choix
      // console.log('[PWA] User choice:', outcome)
    } catch {/* ignore */}
    setDeferredPrompt(null)
    setVisible(false)
    markDismissed()
  }, [deferredPrompt])

  const onDismiss = () => {
    setVisible(false)
    markDismissed()
  }

  if (!shouldShow || !visible) return null

  // UI
  // - Si deferredPrompt existe => bouton Installer (Android/Chrome/Edge)
  // - Sinon, iOS guide (Share -> Add to Home Screen)
  const canInstallDirect = Boolean(deferredPrompt) && !isIOS

  return (
    <div className="container mb-3" style={{ maxWidth: 920 }}>
      <div className="alert alert-light border d-flex align-items-start gap-3 shadow-sm" role="region" aria-label="Installer l'application">
        <div className="flex-shrink-0">
          <div className="rounded-circle d-flex align-items-center justify-content-center"
               style={{ width: 40, height: 40, background: 'var(--lu-hero-grad)', color: '#fff' }}>
            <i className="bi bi-download"></i>
          </div>
        </div>

        <div className="flex-grow-1">
          <div className="fw-semibold mb-1">Installer LevelUp sur ton appareil</div>

          {canInstallDirect ? (
            <div className="text-muted small">
              Installe l’app pour un accès rapide, en plein écran, et des performances optimisées.
            </div>
          ) : (
            <div className="text-muted small">
              Sur iPhone/iPad : appuie sur <i className="bi bi-share"></i> “Partager”, puis choisis
              <strong> “Ajouter à l’écran d’accueil”</strong>.
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {canInstallDirect ? (
            <button className="btn btn-primary btn-sm" onClick={onInstallClick}>
              Installer
            </button>
          ) : (
            <a className="btn btn-primary btn-sm" href="https://support.apple.com/fr-fr/guide/iphone/iph42ab2f3a7/ios" target="_blank" rel="noreferrer">
              Voir comment faire
            </a>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={onDismiss} aria-label="Ne plus afficher">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
