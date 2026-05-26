/* eslint-disable no-console */
import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://level-up-8idt.onrender.com'

// Helper : logs verbeux uniquement en dev pour ne pas polluer la console en prod
// (et eviter de fuiter le contenu des bodies ex. mot de passe lors d'un login).
const DEV = import.meta.env.DEV
const logDev = (...args) => { if (DEV) console.log(...args) }

if (DEV) console.info('[API] Base URL =', API_BASE)

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false
})

// --- Helpers de log ---
function now() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
}
function fullUrl(cfg) {
  return `${cfg.baseURL || ''}${cfg.url || ''}`
}
function sizeOf(data) {
  try {
    const s = JSON.stringify(data)
    return `${(s.length / 1024).toFixed(1)} kB`
  } catch {
    return 'n/a'
  }
}

// --- Interceptors de log ---
api.interceptors.request.use(
  cfg => {
    cfg.metadata = { start: now() }
    logDev(
      `➡️ ${String(cfg.method || 'get').toUpperCase()} ${fullUrl(cfg)}`,
      {
        params: cfg.params ?? null,
        data: cfg.data ?? null,
        headers: cfg.headers ?? null
      }
    )
    return cfg
  },
  err => {
    logDev('❌ [REQ ERROR]', err?.message || err)
    return Promise.reject(err)
  }
)

api.interceptors.response.use(
  res => {
    const dur = Math.round(now() - (res.config.metadata?.start || now()))
    logDev(
      `⬅️ ${res.status} ${fullUrl(res.config)} (${dur}ms, ${sizeOf(res.data)})`,
      res.data
    )
    return res
  },
  err => {
    // Erreur avec réponse serveur (4xx/5xx)
    if (err.response) {
      const dur = Math.round(now() - (err.config?.metadata?.start || now()))
      logDev(
        `❌ ${err.response.status} ${fullUrl(err.config || {})} (${dur}ms)`,
        err.response.data
      )
    }
    // Requête partie mais pas de réponse (souvent CORS / réseau)
    else if (err.request) {
      logDev('💥 Network/CORS — aucune réponse reçue', {
        message: err.message
      })
    }
    // Erreur de config/JS
    else {
      logDev('💥 Config error', err.message)
    }
    return Promise.reject(err)
  }
)

// --- Gestion du token ---
export function setAuthToken(token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  if (DEV) console.debug('[API] Auth token défini')
}

export function clearAuthToken() {
  delete api.defaults.headers.common['Authorization']
  if (DEV) console.debug('[API] Auth token supprimé')
}

// decode JWT sans lib externe (OK pour payload simple)
export function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload?.id || payload?.userId || payload?.sub || null
  } catch {
    return null
  }
}

// Petit utilitaire pour tester rapidement la connexion
export async function ping() {
  const t0 = now()
  const res = await api.get('/')
  const dt = Math.round(now() - t0)
  logDev(`✅ PING ${res.status} en ${dt}ms:`, res.data)
  return res.data
}
