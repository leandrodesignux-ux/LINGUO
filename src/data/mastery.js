// ─── Grammar Mastery — Spaced Repetition (Leitner/SM-2 lite) ─────────────────
//
// Tracks mastery per grammar CATEGORY (not per individual level/item).
// Persisted in localStorage as 'linguo-mastery'.
//
// CategoryRecord shape:
// {
//   seen:        number   total answers recorded
//   correct:     number   total correct answers
//   wrong:       number   total wrong answers
//   lastSeenTs:  number   Date.now() of last interaction
//   nextDueTs:   number   Date.now() + interval — when to review again
//   ease:        number   1.3..2.5 — spacing multiplier (SM-2 style)
//   interval:    number   days until next review (grows on success)
// }

const MASTERY_KEY = 'linguo-mastery'

// ── SM-2 lite constants ────────────────────────────────────────────────────────

const EASE_MIN     = 1.3
const EASE_MAX     = 2.5
const EASE_START   = 2.0
const EASE_CORRECT = +0.15   // boost ease on correct answer
const EASE_WRONG   = -0.25   // drop ease on wrong answer

const INTERVAL_START     = 1    // days: first success → 1 day
const INTERVAL_AGAIN     = 0.25 // days: wrong → review in ~6 hours
const MS_PER_DAY         = 86_400_000

// ── Persistence ───────────────────────────────────────────────────────────────

function _read() {
  try {
    const raw = localStorage.getItem(MASTERY_KEY)
    if (!raw) return {}
    const d = JSON.parse(raw)
    return typeof d === 'object' && d !== null ? d : {}
  } catch (_) {
    return {}
  }
}

function _write(data) {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(data))
  } catch (_) {}
}

// ── Internal: get or create a CategoryRecord ──────────────────────────────────

function _getRecord(data, category) {
  return data[category] ?? {
    seen:       0,
    correct:    0,
    wrong:      0,
    lastSeenTs: 0,
    nextDueTs:  0,
    ease:       EASE_START,
    interval:   INTERVAL_START,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a player answer for a grammar category.
 * Updates counters, ease factor, and next-due timestamp.
 *
 * @param {string}  category    — grammar category string (e.g. 'Inversion')
 * @param {boolean} wasCorrect
 */
export function recordResult(category, wasCorrect) {
  if (!category) return
  const now  = Date.now()
  const data = _read()
  const rec  = _getRecord(data, category)

  rec.seen      += 1
  rec.lastSeenTs = now

  if (wasCorrect) {
    rec.correct += 1
    // Increase ease (up to max), grow interval
    rec.ease     = Math.min(EASE_MAX, rec.ease + EASE_CORRECT)
    rec.interval = rec.seen <= 1
      ? INTERVAL_START
      : Math.round(rec.interval * rec.ease * 10) / 10
    rec.nextDueTs = now + rec.interval * MS_PER_DAY
  } else {
    rec.wrong    += 1
    // Lower ease, reset interval to "soon"
    rec.ease     = Math.max(EASE_MIN, rec.ease + EASE_WRONG)
    rec.interval = INTERVAL_AGAIN
    rec.nextDueTs = now + INTERVAL_AGAIN * MS_PER_DAY
  }

  data[category] = rec
  _write(data)
}

/**
 * Returns the mastery score (0..1) for a category.
 * 0 = never seen / low accuracy, 1 = perfect accuracy + high ease.
 *
 * @param {string} category
 * @returns {number} 0..1
 */
export function masteryScore(category) {
  const data = _read()
  const rec  = data[category]
  if (!rec || rec.seen === 0) return 0
  const accuracy = rec.correct / rec.seen                          // 0..1
  const easeFactor = (rec.ease - EASE_MIN) / (EASE_MAX - EASE_MIN) // 0..1
  // Weight: 70% accuracy, 30% spacing ease
  return Math.min(1, accuracy * 0.7 + easeFactor * 0.3)
}

/**
 * Returns all categories that are "due" for review (nextDueTs <= now)
 * sorted by urgency: most overdue + lowest mastery first.
 *
 * @param {number} [now]  — timestamp, defaults to Date.now()
 * @returns {string[]}    — sorted category names
 */
export function dueCategories(now = Date.now()) {
  const data = _read()
  return Object.entries(data)
    .filter(([, rec]) => rec.seen > 0 && rec.nextDueTs <= now)
    .sort(([catA, recA], [catB, recB]) => {
      // Primary: lowest accuracy first
      const accA = recA.seen ? recA.correct / recA.seen : 0
      const accB = recB.seen ? recB.correct / recB.seen : 0
      if (Math.abs(accA - accB) > 0.05) return accA - accB
      // Secondary: most overdue first
      return recA.nextDueTs - recB.nextDueTs
    })
    .map(([cat]) => cat)
}

/**
 * Returns all tracked categories with their records, sorted by mastery asc.
 * Useful for the progress panel.
 *
 * @returns {{ category: string, record: CategoryRecord, score: number }[]}
 */
export function allMasteryRecords() {
  const data = _read()
  return Object.entries(data)
    .map(([category, record]) => ({
      category,
      record,
      score: masteryScore(category),
    }))
    .sort((a, b) => a.score - b.score)
}

/**
 * Returns a quick summary: { mastered, struggling, total }.
 * mastered  = score >= 0.75
 * struggling = score < 0.45
 */
export function masterySummary() {
  const all = allMasteryRecords()
  return {
    total:      all.length,
    mastered:   all.filter((r) => r.score >= 0.75).length,
    struggling: all.filter((r) => r.score < 0.45 && r.record.seen >= 2).length,
  }
}

// ─── Adaptive selector ────────────────────────────────────────────────────────

/**
 * Returns the best next category to practise given:
 *  1. Categories that are currently due (overdue first)
 *  2. Among non-due, lowest mastery first
 *  3. Excludes recently seen categories to enforce variety
 *
 * @param {string[]} excludeRecent   — categories to skip (e.g. last 2 played)
 * @param {string[]} availableCats   — full set of categories available in the mode
 * @returns {string|null}
 */
export function getAdaptiveNextCategory(excludeRecent = [], availableCats = []) {
  if (availableCats.length === 0) return null

  const now     = Date.now()
  const due     = new Set(dueCategories(now))
  const exclude = new Set(excludeRecent)

  const candidates = availableCats.filter((c) => !exclude.has(c))
  if (candidates.length === 0) return availableCats[0] // fallback: ignore exclusion

  // Prefer due categories
  const dueCandidates = candidates.filter((c) => due.has(c))
  if (dueCandidates.length > 0) return dueCandidates[0]

  // Otherwise pick lowest mastery
  return candidates.sort((a, b) => masteryScore(a) - masteryScore(b))[0]
}

/**
 * Given an array of items (each with a .category field), returns the item
 * that best matches the adaptive priority, excluding recently used categories.
 *
 * Falls back to a random item if no match is found.
 *
 * @param {Array<{category: string}>} items
 * @param {string[]} excludeRecent
 * @returns {object} item
 */
export function getAdaptiveItem(items, excludeRecent = []) {
  if (items.length === 0) return null
  const availableCats = [...new Set(items.map((i) => i.category))]
  const targetCat = getAdaptiveNextCategory(excludeRecent, availableCats)
  if (!targetCat) return items[0]
  const match = items.find((i) => i.category === targetCat)
  return match ?? items[0]
}

/**
 * How many distinct categories the player has practised "due" today.
 * Used for the daily 'review' challenge.
 *
 * @param {string} dateStr  'YYYY-MM-DD'
 * @returns {number}
 */
export function reviewedDueCategoriesCount(dateStr) {
  const key = `linguo-reviewed-due-${dateStr}`
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.length : 0
  } catch (_) {
    return 0
  }
}

/**
 * Record that a "due" category was reviewed today.
 * Deduplicated — each category counted at most once per day.
 *
 * @param {string} dateStr
 * @param {string} category
 */
export function recordDueReview(dateStr, category) {
  const key = `linguo-reviewed-due-${dateStr}`
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return
    if (!arr.includes(category)) {
      arr.push(category)
      localStorage.setItem(key, JSON.stringify(arr))
    }
  } catch (_) {}
}
