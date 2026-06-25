// ─── Difficulty config by CEFR level ─────────────────────────────────────────
//
// decoyCount      — decorative cells that will carry a fake letter (distractors)
// timerSeconds    — soft timer for the level in seconds
// tapBudgetMargin — extra taps allowed above the phrase's letter count
//
// Consumed by the game mechanics once the difficulty layer is wired in.
// Do NOT import game state here — this is pure data.

/** @typedef {{ decoyCount: number, timerSeconds: number, tapBudgetMargin: number, decoyRotateSeconds: number|null }} DifficultyConfig */

/**
 * Grid size options in ascending capacity order.
 * @type {{ rows: number, cols: number, capacity: number }[]}
 */
const GRID_SIZES = [
  { rows: 4, cols: 4, capacity: 16 },
  { rows: 5, cols: 5, capacity: 25 },
  { rows: 6, cols: 5, capacity: 30 },
  { rows: 6, cols: 6, capacity: 36 },
]

/**
 * Returns the smallest grid that fits neededCells.
 * Caps at 6×6 (36 cells).
 *
 * @param {number} neededCells
 * @returns {{ rows: number, cols: number }}
 */
export function pickGridSize(neededCells) {
  for (const size of GRID_SIZES) {
    if (neededCells <= size.capacity) return { rows: size.rows, cols: size.cols }
  }
  return { rows: 6, cols: 6 }
}

/** @type {Record<string, DifficultyConfig>} */
export const DIFFICULTY_BY_CEFR = {
  A2: { decoyCount: 1, timerSeconds: 90, tapBudgetMargin: 4, decoyRotateSeconds: null },
  B1: { decoyCount: 2, timerSeconds: 75, tapBudgetMargin: 3, decoyRotateSeconds: null },
  B2: { decoyCount: 3, timerSeconds: 60, tapBudgetMargin: 2, decoyRotateSeconds: null },
  C1: { decoyCount: 4, timerSeconds: 50, tapBudgetMargin: 2, decoyRotateSeconds: 10 },
  C2: { decoyCount: 5, timerSeconds: 45, tapBudgetMargin: 1, decoyRotateSeconds: 8 },
}

/** Maximum wrong taps allowed before a strike penalty is applied. */
export const MAX_STRIKES = 3

/**
 * Returns the difficulty config for a given CEFR level.
 * Falls back to B1 for unknown or missing values.
 *
 * @param {string | undefined} cefr
 * @returns {DifficultyConfig}
 */
export function getDifficulty(cefr) {
  return DIFFICULTY_BY_CEFR[cefr] ?? DIFFICULTY_BY_CEFR.B1
}
