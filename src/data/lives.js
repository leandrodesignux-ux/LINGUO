// ─── Lives system ─────────────────────────────────────────────────────────────
// Homescapes-style: 5 lives max, one regenerates every 30 min.

export const MAX_LIVES  = 5
export const REGEN_MS   = 30 * 60 * 1000   // 30 minutes in ms

const STORAGE_KEY = 'linguo-lives'

/** @typedef {{ lives: number, lastRegenTimestamp: number, infiniteUntil: number }} LivesShape */

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data.lives === 'number' && typeof data.lastRegenTimestamp === 'number') {
      return data
    }
  } catch (_) {}
  return null
}

function _write(lives, lastRegenTimestamp, infiniteUntil = 0) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lives, lastRegenTimestamp, infiniteUntil }))
  } catch (_) {}
}

// ─── Infinite lives ───────────────────────────────────────────────────────────

/** Returns true while an infinite-lives grant is still active. */
export function hasInfiniteLives() {
  try {
    const data = _read()
    return data ? Date.now() < (data.infiniteUntil ?? 0) : false
  } catch (_) { return false }
}

/** Returns milliseconds remaining on the infinite-lives grant (0 if not active). */
export function getInfiniteRemainingMs() {
  try {
    const data = _read()
    if (!data) return 0
    return Math.max(0, (data.infiniteUntil ?? 0) - Date.now())
  } catch (_) { return 0 }
}

/**
 * Grant `durationMs` milliseconds of infinite lives.
 * Stacks: if already active, extends from the current expiry.
 */
export function grantInfiniteLives(durationMs) {
  try {
    const data = _read() ?? { lives: MAX_LIVES, lastRegenTimestamp: Date.now(), infiniteUntil: 0 }
    const base  = Math.max(Date.now(), data.infiniteUntil ?? 0)
    const newUntil = base + durationMs
    _write(data.lives, data.lastRegenTimestamp, newUntil)
    return newUntil
  } catch (_) { return 0 }
}

/**
 * Compute how many lives have regenerated since `lastRegenTimestamp`,
 * capped at MAX_LIVES.  Returns the updated { lives, lastRegenTimestamp }.
 */
function _applyRegen(lives, lastRegenTimestamp) {
  if (lives >= MAX_LIVES) {
    // Full — anchor timestamp to now so the counter resets correctly
    // when a life is spent later.
    return { lives: MAX_LIVES, lastRegenTimestamp: Date.now() }
  }
  const now     = Date.now()
  const elapsed = now - lastRegenTimestamp
  const gained  = Math.floor(elapsed / REGEN_MS)
  if (gained <= 0) return { lives, lastRegenTimestamp }

  const newLives = Math.min(lives + gained, MAX_LIVES)
  // Advance timestamp by exactly the ms consumed so partial progress carries over.
  const newTs    = lastRegenTimestamp + gained * REGEN_MS
  return { lives: newLives, lastRegenTimestamp: newTs }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load lives from localStorage, apply regeneration, persist the result,
 * and return the current state including the ms remaining until the next life.
 *
 * @returns {{ lives: number, lastRegenTimestamp: number, nextLifeMs: number }}
 */
export function loadLives() {
  const saved = _read() ?? { lives: MAX_LIVES, lastRegenTimestamp: Date.now(), infiniteUntil: 0 }
  const { lives, lastRegenTimestamp } = _applyRegen(saved.lives, saved.lastRegenTimestamp)
  _write(lives, lastRegenTimestamp, saved.infiniteUntil ?? 0)

  const nextLifeMs = lives >= MAX_LIVES
    ? 0
    : Math.max(0, REGEN_MS - (Date.now() - lastRegenTimestamp))

  const infiniteRemainingMs = Math.max(0, (saved.infiniteUntil ?? 0) - Date.now())

  return { lives, lastRegenTimestamp, nextLifeMs, infiniteRemainingMs }
}

/**
 * Spend one life.  No-op if already at 0.
 * Returns the updated { lives, lastRegenTimestamp, nextLifeMs }.
 */
export function spendLife() {
  const current = loadLives()   // apply regen first
  // No-op during infinite lives
  if (hasInfiniteLives()) return current
  if (current.lives <= 0) return current

  const now           = Date.now()
  const data          = _read()
  const infiniteUntil = data?.infiniteUntil ?? 0
  const wasFullBefore = current.lives >= MAX_LIVES
  const newLives      = current.lives - 1
  const newTs         = wasFullBefore ? now : current.lastRegenTimestamp
  _write(newLives, newTs, infiniteUntil)

  const nextLifeMs = newLives >= MAX_LIVES
    ? 0
    : Math.max(0, REGEN_MS - (Date.now() - newTs))

  return { lives: newLives, lastRegenTimestamp: newTs, nextLifeMs, infiniteRemainingMs: 0 }
}

/**
 * Add `n` lives (capped at MAX_LIVES).
 * Returns the updated { lives, lastRegenTimestamp, nextLifeMs }.
 */
export function addLives(n) {
  const current       = loadLives()
  const data          = _read()
  const infiniteUntil = data?.infiniteUntil ?? 0
  const newLives      = Math.min(current.lives + n, MAX_LIVES)
  const newTs         = newLives >= MAX_LIVES ? Date.now() : current.lastRegenTimestamp
  _write(newLives, newTs, infiniteUntil)

  const nextLifeMs = newLives >= MAX_LIVES
    ? 0
    : Math.max(0, REGEN_MS - (Date.now() - newTs))

  return { lives: newLives, lastRegenTimestamp: newTs, nextLifeMs, infiniteRemainingMs: Math.max(0, infiniteUntil - Date.now()) }
}
