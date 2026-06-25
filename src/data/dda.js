// ─── Dynamic Difficulty Adjustment ────────────────────────────────────────────
// Tracks consecutive fails per level and silently assists struggling players.
// No UI changes — intervention is invisible to the player.

const STORAGE_KEY = 'linguo-dda'

// ── Internal read/write ───────────────────────────────────────────────────────

/** @returns {{ [levelId: string]: number }} */
function _read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (data && typeof data === 'object' && !Array.isArray(data)) return data
  } catch (_) {}
  return {}
}

function _write(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (_) {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Record a failed attempt for this level (increments consecutive fail counter). */
export function recordFail(levelId) {
  const map = _read()
  map[levelId] = (map[levelId] ?? 0) + 1
  _write(map)
}

/** Record a win for this level (resets consecutive fail counter to 0). */
export function recordWin(levelId) {
  const map = _read()
  map[levelId] = 0
  _write(map)
}

/** Returns the current consecutive fail count for a level. */
export function getFails(levelId) {
  const map = _read()
  return map[levelId] ?? 0
}

/**
 * Returns true when the player needs silent assistance (>= 3 consecutive fails).
 */
export function shouldAssist(levelId) {
  return getFails(levelId) >= 3
}

/**
 * Returns the assistance parameters for the given level.
 * @returns {{ extraMoves: number, revealCount: number }}
 *   extraMoves  — bonus moves to add on top of the default 20
 *   revealCount — number of letters to silently pre-reveal
 */
export function getAssistance(levelId) {
  const fails = getFails(levelId)
  if (fails >= 5) return { extraMoves: 8, revealCount: 2 }
  if (fails >= 3) return { extraMoves: 6, revealCount: 1 }
  return { extraMoves: 0, revealCount: 0 }
}
