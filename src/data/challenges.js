// ─── Daily Challenges ─────────────────────────────────────────────────────────

// ── Template pool ─────────────────────────────────────────────────────────────

/**
 * Each template defines a challenge type.
 * `targets` is an array of possible target values picked deterministically.
 * `xpRewards` matches targets index-for-index.
 * `label` uses {target} as a placeholder.
 */
const CHALLENGE_POOL = [
  {
    type: 'reveals',
    targets:   [5, 6, 7, 8, 9, 10],
    xpRewards: [30, 35, 40, 45, 50, 55],
    label: 'Reveal {target} letters today',
  },
  {
    type: 'duel-wins',
    targets:   [3, 4, 5],
    xpRewards: [35, 50, 70],
    label: 'Answer {target} Grammar Duel questions correctly',
  },
  {
    type: 'builder-solves',
    targets:   [2, 3, 4],
    xpRewards: [30, 45, 65],
    label: 'Solve {target} Sentence Builder puzzles correctly',
  },
  {
    type: 'review-due',
    targets:   [2, 3],
    xpRewards: [40, 60],
    label: 'Review {target} grammar categories that are due for practice',
  },
  {
    type: 'streak3',
    targets:   [3, 4, 5],
    xpRewards: [40, 60, 80],
    label: 'Reach a ×{target} combo streak',
  },
  {
    type: 'solve-early',
    targets:   [1, 2],
    xpRewards: [50, 90],
    label: 'Solve {target} puzzle(s) with the Solve button',
  },
  {
    type: 'no-hints',
    targets:   [1],
    xpRewards: [45],
    label: 'Complete a level without using a hint',
  },
  {
    type: 'perfect-moves',
    targets:   [8, 10, 12],
    xpRewards: [70, 55, 40],
    label: 'Complete a level in {target} moves or fewer',
  },
]

// ── Deterministic hash (same algorithm as getDailyLevelIndex) ─────────────────

function djb2(str, seed = 5381) {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  }
  return h
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns exactly 3 challenge objects for the given date string.
 * The selection and target values are fully deterministic.
 *
 * Each returned challenge:
 * {
 *   id:        string  — unique id for this challenge on this day
 *   type:      string  — 'reveals' | 'streak3' | 'solve-early' | 'no-hints' | 'perfect-moves'
 *   target:    number
 *   xpReward:  number
 *   label:     string  — human-readable, {target} already substituted
 * }
 */
export function getDailyChallenges(dateStr) {
  const h1 = djb2(dateStr)
  const h2 = djb2(dateStr, h1)
  const h3 = djb2(dateStr, h2)
  const h4 = djb2(dateStr, h3)

  // Pick 3 distinct indices from CHALLENGE_POOL
  const poolLen = CHALLENGE_POOL.length
  const i0 = h1 % poolLen
  let   i1 = h2 % poolLen
  let   i2 = h3 % poolLen
  if (i1 === i0)                   i1 = (i1 + 1) % poolLen
  if (i2 === i0 || i2 === i1)      i2 = (i2 + 1) % poolLen
  if (i2 === i0 || i2 === i1)      i2 = (i2 + 2) % poolLen

  const indices = [i0, i1, i2]

  return indices.map((poolIdx, slot) => {
    const tpl    = CHALLENGE_POOL[poolIdx]
    const tHash  = djb2(dateStr, h4 + slot)
    const tIdx   = tHash % tpl.targets.length
    const target = tpl.targets[tIdx]
    const xp     = tpl.xpRewards[tIdx]
    return {
      id:       `${dateStr}-${tpl.type}`,
      type:     tpl.type,
      target,
      xpReward: xp,
      label:    tpl.label.replace('{target}', target),
    }
  })
}

// ── Persistence ───────────────────────────────────────────────────────────────

export function challengeProgressKey(dateStr) {
  return `linguo-challenges-${dateStr}`
}

/** Load today's challenge progress map { [challengeId]: count }. */
export function loadChallengeProgress(dateStr) {
  try {
    const raw = localStorage.getItem(challengeProgressKey(dateStr))
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (typeof data === 'object' && data !== null) return data
  } catch (_) {}
  return {}
}

/** Persist the progress map. */
export function writeChallengeProgress(dateStr, progress) {
  try {
    localStorage.setItem(challengeProgressKey(dateStr), JSON.stringify(progress))
  } catch (_) {}
}
