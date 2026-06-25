// ─── Linguo Events ────────────────────────────────────────────────────────────
// "Cake o'clock": complete 3 levels in a day → 15 minutes of infinite lives.
// Progress resets each calendar day (keyed by YYYY-MM-DD).

import { grantInfiniteLives } from './lives.js'

const STORAGE_KEY      = 'linguo-event-cakeoclock'
export const CAKE_TARGET       = 3               // levels to complete
export const CAKE_REWARD_MS    = 15 * 60 * 1000  // 15 minutes in ms
export const CAKE_EVENT_LABEL  = "Cake o'clock"

// ── Persistence ───────────────────────────────────────────────────────────────

function _storageKey(dateStr) {
  return `${STORAGE_KEY}-${dateStr}`
}

/** @returns {{ progress: number, granted: boolean }} */
function _read(dateStr) {
  try {
    const raw = localStorage.getItem(_storageKey(dateStr))
    if (!raw) return { progress: 0, granted: false }
    const data = JSON.parse(raw)
    return {
      progress: typeof data.progress === 'number' ? data.progress : 0,
      granted:  Boolean(data.granted),
    }
  } catch (_) {
    return { progress: 0, granted: false }
  }
}

function _write(dateStr, progress, granted) {
  try {
    localStorage.setItem(_storageKey(dateStr), JSON.stringify({ progress, granted }))
  } catch (_) {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Load today's event state. */
export function loadCakeEvent(dateStr) {
  return _read(dateStr)
}

/**
 * Call when a normal (non-daily) level is completed.
 * Returns { progress, granted, justGranted } where `justGranted` is true
 * only on the exact call that crosses the target for the first time today.
 */
export function recordCakeLevelComplete(dateStr) {
  const current = _read(dateStr)
  if (current.granted) {
    // Already rewarded today — just bump progress without re-granting
    const newProgress = current.progress + 1
    _write(dateStr, newProgress, true)
    return { progress: newProgress, granted: true, justGranted: false }
  }

  const newProgress = current.progress + 1
  const justGranted = newProgress >= CAKE_TARGET

  if (justGranted) {
    grantInfiniteLives(CAKE_REWARD_MS)
    _write(dateStr, newProgress, true)
  } else {
    _write(dateStr, newProgress, false)
  }

  return { progress: newProgress, granted: justGranted, justGranted }
}
