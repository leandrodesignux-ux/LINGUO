// ─── Progression system ───────────────────────────────────────────────────────
// Persistent player-level layer on top of the puzzle game state.

const PROGRESSION_KEY = 'linguo-progression'

// ── XP curve ──────────────────────────────────────────────────────────────────

/** XP required to reach player level N (1-indexed). Level 1 requires 0. */
export function xpForLevel(n) {
  if (n <= 1) return 0
  return Math.round(200 * Math.pow(n - 1, 1.4))
}

/** Total XP needed to complete level N (i.e. threshold for level N+1). */
export function xpThreshold(n) {
  return xpForLevel(n + 1)
}

/**
 * Given totalXP, return the current player level (1-indexed).
 * Searches upward until the next threshold is not crossed.
 */
export function playerLevelFromXP(totalXP) {
  const xp = (typeof totalXP === 'number' && isFinite(totalXP)) ? totalXP : 0
  let lvl = 1
  while (xp >= xpForLevel(lvl + 1)) {
    lvl++
    if (lvl > 999) break // safety cap
  }
  return lvl
}

/**
 * Returns 0..1 progress fraction within the current player level.
 * progress = (totalXP - xpFloor) / (xpCeiling - xpFloor)
 */
export function levelProgress(totalXP) {
  const xp = (typeof totalXP === 'number' && isFinite(totalXP)) ? totalXP : 0
  const lvl = playerLevelFromXP(xp)
  const floor   = xpForLevel(lvl)
  const ceiling = xpForLevel(lvl + 1)
  if (ceiling === floor) return 1 // shouldn't happen at sane levels
  const raw = (xp - floor) / (ceiling - floor)
  return (isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0)
}

// ── XP sources ────────────────────────────────────────────────────────────────

/** XP earned from a successful chain (earned = score pts awarded). */
export function xpFromChain(earned) {
  return Math.round(earned / 10)
}

/** XP earned from a successful Solve. */
export const XP_SOLVE   = 50

/** XP bonus for fully completing a puzzle level. */
export const XP_LEVEL_COMPLETE = 100

// ── Persistence ───────────────────────────────────────────────────────────────

export const DEFAULT_PROGRESSION = {
  totalXP:              0,
  playerLevel:          1,
  dailyStreakCount:      0,
  lastPlayedDate:       null,
  bestSingleChainStreak: 0,
}

export function loadProgression() {
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY)
    if (!raw) return { ...DEFAULT_PROGRESSION }
    const data = JSON.parse(raw)
    // Validate each field — old schema versions may have missing/invalid values
    const totalXP = (typeof data.totalXP === 'number' && isFinite(data.totalXP) && data.totalXP >= 0)
      ? data.totalXP : 0
    return {
      totalXP,
      playerLevel:          typeof data.playerLevel === 'number' && data.playerLevel >= 1 ? data.playerLevel : playerLevelFromXP(totalXP),
      dailyStreakCount:      typeof data.dailyStreakCount === 'number'     ? data.dailyStreakCount     : 0,
      lastPlayedDate:       typeof data.lastPlayedDate === 'string'       ? data.lastPlayedDate       : null,
      bestSingleChainStreak: typeof data.bestSingleChainStreak === 'number' ? data.bestSingleChainStreak : 0,
    }
  } catch (_) {
    return { ...DEFAULT_PROGRESSION }
  }
}

export function writeProgression(prog) {
  try {
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(prog))
  } catch (_) {}
}

// ── Daily streak logic ────────────────────────────────────────────────────────

/**
 * Computes the new dailyStreakCount given the saved lastPlayedDate and today.
 * Returns { newStreak, isNewDay } — isNewDay is true when we should persist.
 */
export function computeDailyStreak(lastPlayedDate, todayStr) {
  if (!lastPlayedDate) return { newStreak: 1, isNewDay: true }

  if (lastPlayedDate === todayStr) return { newStreak: null, isNewDay: false } // already counted

  const last  = new Date(lastPlayedDate).getTime()
  const today = new Date(todayStr).getTime()
  const diffDays = Math.round((today - last) / 86_400_000)

  if (diffDays === 1) return { newStreak: 'increment', isNewDay: true }
  return { newStreak: 1, isNewDay: true } // gap > 1 day — reset
}
