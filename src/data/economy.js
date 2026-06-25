// ─── Lingot economy ────────────────────────────────────────────────────────────
// Single-currency system.  All values are plain integers (no decimals).

const STORAGE_KEY = 'linguo-coins'

// ── Costs ────────────────────────────────────────────────────────────────────
export const REFILL_LIVES_COST = 90   // refill all lives to MAX_LIVES
export const EXTRA_MOVES_COST  = 30   // +5 moves
export const HINT_COST         = 20   // buy one extra hint after free ones are gone

// ── Chest coin rewards (mirrors ChestReveal tier names) ──────────────────────
export const CHEST_COINS = { gold: 50, silver: 30, bronze: 15 }

// ── Per-move efficiency bonus ────────────────────────────────────────────────
export const COINS_PER_LEFTOVER_MOVE = 2

// ── Daily-challenge completion bonus ─────────────────────────────────────────
export const CHALLENGE_COINS = 25

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return 0
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch (_) {
    return 0
  }
}

function _write(n) {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(n))))
  } catch (_) {}
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns current coin balance. */
export function loadCoins() {
  return _read()
}

/**
 * Add `n` lingots to the balance.
 * @returns {number} new balance
 */
export function addCoins(n) {
  const next = _read() + Math.max(0, Math.floor(n))
  _write(next)
  return next
}

/**
 * Attempt to spend `n` lingots.
 * @returns {boolean} true if successful (balance was sufficient), false otherwise
 */
export function spendCoins(n) {
  const current = _read()
  const cost    = Math.max(0, Math.floor(n))
  if (current < cost) return false
  _write(current - cost)
  return true
}
