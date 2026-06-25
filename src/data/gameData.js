import { getDifficulty, pickGridSize } from './difficulty.js'

// ─── Constants ────────────────────────────────────────────────────────────────

export const SHAPES = ['circle', 'diamond', 'triangle', 'square', 'star']
export const COLORS = ['pink', 'purple', 'gold', 'cyan', 'lime']

/** Palette from which the active-letter color is picked per level. */
export const LETTER_COLORS = ['gold', 'cyan', 'lime', 'pink', 'purple']

// ─── Cell factory ─────────────────────────────────────────────────────────────

export function makeCell(row, col, shape, color, letter = null, phraseIndex = null, isDecoy = false, decoyChar = null) {
  return {
    id: `${row}-${col}`,
    row,
    col,
    shape,
    color,
    letter,
    phraseIndex,
    isDecoy,
    decoyChar,
    revealed: false,
    exploding: false,
  }
}

// ─── Seeded LCG ───────────────────────────────────────────────────────────────

/**
 * Deterministic Fisher-Yates shuffle using a linear congruential generator.
 * Returns a new shuffled copy; original array is unchanged.
 */
function seededShuffle(arr, seed) {
  const out = [...arr]
  let s = seed >>> 0
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ─── Decoy char picker ────────────────────────────────────────────────────────

/**
 * Returns a plausible decoy letter from the phrase (uppercase).
 * Tries to avoid `excludeChar` when other options exist.
 *
 * @param {string} phrase
 * @param {string|null} excludeChar  - the letter just revealed (UC), prefer to avoid
 * @returns {string}
 */
export function pickDecoyChar(phrase, excludeChar = null) {
  const letters = [...new Set(
    phrase.split('').filter((c) => c !== ' ').map((c) => c.toUpperCase()),
  )]
  if (letters.length === 0) return 'X'
  const preferred = excludeChar ? letters.filter((c) => c !== excludeChar) : letters
  const pool = preferred.length > 0 ? preferred : letters
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Procedural layout generator ─────────────────────────────────────────────

/**
 * Generates a rows×cols shapeLayout and colorLayout procedurally.
 * Uses a deterministic offset formula — no Latin-square constraint needed
 * because shapes/colors are purely decorative (no game rules depend on them).
 *
 * @param {number} seed
 * @param {number} rows
 * @param {number} cols
 * @returns {{ shapeLayout: string[][], colorLayout: string[][] }}
 */
export function generateShapeColorLayout(seed, rows = 5, cols = 5) {
  function makeLayout(items, s) {
    let rng = s >>> 0
    function next() {
      rng = (Math.imul(1664525, rng) + 1013904223) >>> 0
      return rng
    }
    const base    = next() % items.length
    const rowStep = (next() % (items.length - 1)) + 1   // 1..len-1 so rows differ
    const colStep = (next() % (items.length - 1)) + 1   // 1..len-1 so cols differ
    return Array.from({ length: rows }, (_, ri) =>
      Array.from({ length: cols }, (_, ci) =>
        items[(base + ri * rowStep + ci * colStep) % items.length],
      )
    )
  }

  return {
    shapeLayout: makeLayout(SHAPES, seed),
    colorLayout: makeLayout(COLORS, seed + 3571),
  }
}

// ─── Grid builder ─────────────────────────────────────────────────────────────

/**
 * Generates a rows×cols Cell grid for a level.
 * Grid size is chosen automatically via pickGridSize to fit all real letters
 * plus the requested decoys. Layout and letter positions are deterministic
 * per seed.
 *
 * @param {string} phrase
 * @param {number} seed
 * @param {number} decoyCount
 * @returns {Cell[][]}
 */
function buildGrid(phrase, seed, decoyCount = 0) {
  const letterSlots = []
  for (let i = 0; i < phrase.length; i++) {
    if (phrase[i] !== ' ') {
      letterSlots.push({ char: phrase[i].toUpperCase(), phraseIndex: i })
    }
  }

  // Choose the tightest grid that fits all letters (+ at least 1 spare for decoys).
  // decoyCount from difficulty is intentionally ignored for sizing — we fill
  // every non-letter cell with a decoy anyway, so the grid is always 100% active.
  const { rows, cols } = pickGridSize(letterSlots.length + 1)
  const totalCells = rows * cols

  if (letterSlots.length > totalCells) {
    throw new Error(
      `buildGrid: phrase has ${letterSlots.length} non-space letters but the largest grid (6×6=36) ` +
      `only has 36 cells. Shorten the phrase. Phrase: "${phrase}"`,
    )
  }

  // ── Pick the dedicated letter color deterministically from seed ──────────
  const activeColor = LETTER_COLORS[seed % LETTER_COLORS.length]
  // Decoy palette = all colors except activeColor (preserve original COLORS order)
  const decoyColors = COLORS.filter((c) => c !== activeColor)
  // ─────────────────────────────────────────────────────────────────────────

  const { shapeLayout, colorLayout } = generateShapeColorLayout(seed, rows, cols)

  const positions = seededShuffle(
    Array.from({ length: totalCells }, (_, i) => i),
    seed,
  )

  const posMap = new Map()
  letterSlots.forEach((slot, i) => posMap.set(positions[i], slot))

  // ── Fill EVERY remaining cell with a decoy — zero inert cells ────────────
  const phraseChars = letterSlots.map((s) => s.char)
  const shuffledChars = seededShuffle(phraseChars, seed + 99997)
  const emptyPositions = positions.slice(letterSlots.length).filter((p) => !posMap.has(p))
  const charPool = []
  while (charPool.length < emptyPositions.length) charPool.push(...shuffledChars)
  emptyPositions.forEach((pos, i) => {
    posMap.set(pos, { char: null, phraseIndex: null, isDecoy: true, decoyChar: charPool[i] })
  })
  // ─────────────────────────────────────────────────────────────────────────

  const grid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const pos  = row * cols + col
      const slot = posMap.get(pos) ?? null
      if (slot?.isDecoy) {
        // Map colorLayout value through decoyColors (skip the activeColor)
        const layoutColor = colorLayout[row][col]
        const decoyColor = layoutColor === activeColor
          ? decoyColors[0]
          : (decoyColors.includes(layoutColor) ? layoutColor : decoyColors[0])
        return makeCell(
          row, col,
          shapeLayout[row][col],
          decoyColor,
          slot.decoyChar,
          null,
          true,
          slot.decoyChar,
        )
      }
      // Real letter cell — always use activeColor
      return makeCell(
        row, col,
        shapeLayout[row][col],
        activeColor,
        slot ? slot.char : null,
        slot ? slot.phraseIndex : null,
      )
    }),
  )

  if (process.env.NODE_ENV !== 'production') {
    const mismatch = grid.flat().some((c) => c.phraseIndex !== null && c.color !== activeColor)
    if (mismatch) console.warn('[Linguo] buildGrid color mismatch: real-letter cell has wrong color')
  }

  return { grid, activeColor }
}

// ─── Level factory ────────────────────────────────────────────────────────────

/**
 * Creates a complete Level object.
 *
 * @param {{
 *   id: number,
 *   phrase: string,
 *   hint: string,
 *   source: string,
 *   grammarExplanation: string,
 *   seed: number,
 *   cefr?: 'A2'|'B1'|'B2'|'C1'|'C2',
 *   category?: string,
 * }} cfg
 * @returns {Level}
 */
function createLevel({ id, phrase, hint, source, grammarExplanation, seed, cefr, category }) {
  const { decoyCount } = getDifficulty(cefr)
  const { grid, activeColor } = buildGrid(phrase, seed, decoyCount)
  const gridRows = grid.length
  const gridCols = grid[0]?.length ?? 5
  return { id, phrase, hint, source, grammarExplanation, grid, activeColor, gridRows, gridCols, seed, cefr, category }
}

// ─── Level bank — original 15 (backfilled with cefr + category) ───────────────

export const LEVEL_1 = createLevel({
  id: 1,
  phrase: 'She has been waiting',
  hint: 'Present perfect continuous — an ongoing action that started in the past',
  source: 'English verb tenses',
  grammarExplanation: "Use 'has/have been' + verb-ing for actions that started in the past and are still continuing now.",
  seed: 1,
  cefr: 'B1',
  category: 'Verb Tenses',
})

export const LEVEL_2 = createLevel({
  id: 2,
  phrase: 'I wish I had studied harder',
  hint: 'Past subjunctive — expressing regret about something that cannot be changed',
  source: 'English conditionals',
  grammarExplanation: "Use 'I wish' + past perfect (had + past participle) to express regret about a past situation you cannot change.",
  seed: 2,
  cefr: 'B2',
  category: 'Subjunctive',
})

export const LEVEL_3 = createLevel({
  id: 3,
  phrase: 'Neither of them was prepared',
  hint: '"Neither" is singular and takes a singular verb',
  source: 'Subject-verb agreement',
  grammarExplanation: "'Neither' is always treated as singular, so it takes a singular verb like 'was', not 'were'.",
  seed: 3,
  cefr: 'B1',
  category: 'Subject-Verb Agreement',
})

export const LEVEL_4 = createLevel({
  id: 4,
  phrase: 'It depends on the context',
  hint: 'The verb "depend" always pairs with the preposition "on"',
  source: 'English prepositions',
  grammarExplanation: "The verb 'depend' is always followed by 'on' — never 'of', 'for', or 'from'.",
  seed: 4,
  cefr: 'A2',
  category: 'Prepositions',
})

export const LEVEL_5 = createLevel({
  id: 5,
  phrase: 'Would you mind closing',
  hint: 'After "would you mind", use the gerund (-ing form)',
  source: 'Modal verbs',
  grammarExplanation: "After 'would you mind', always use the gerund (-ing form), not the infinitive — e.g. 'closing', not 'to close'.",
  seed: 5,
  cefr: 'B1',
  category: 'Verb Tenses',
})

export const LEVEL_6 = createLevel({
  id: 6,
  phrase: 'If I were you I would go',
  hint: 'Second conditional — use "were" for all subjects in the if-clause',
  source: 'English conditionals',
  grammarExplanation: "In second conditionals, use 'were' for all subjects (I, he, she, it), not 'was' — this is the subjunctive mood.",
  seed: 6,
  cefr: 'B1',
  category: 'Subjunctive',
})

export const LEVEL_7 = createLevel({
  id: 7,
  phrase: 'He is taller than his brother',
  hint: 'Comparative adjective — add "-er" to short adjectives',
  source: 'English adjectives',
  grammarExplanation: "Add '-er' to short adjectives (one or two syllables) to form comparatives, and always follow with 'than'.",
  seed: 7,
  cefr: 'A2',
  category: 'Adjectives',
})

export const LEVEL_8 = createLevel({
  id: 8,
  phrase: 'We should have left early',
  hint: 'Modal perfect — "should have" + past participle expresses past advice',
  source: 'Modal verbs',
  grammarExplanation: "'Should have' + past participle expresses criticism or regret about something that did not happen in the past.",
  seed: 8,
  cefr: 'B2',
  category: 'Past Modals of Deduction',
})

export const LEVEL_9 = createLevel({
  id: 9,
  phrase: 'The cat sat on the mat',
  hint: '"On" indicates surface contact — a positional preposition',
  source: 'English prepositions',
  grammarExplanation: "Use 'on' for surface contact (on the mat), 'in' for enclosed spaces (in the box), and 'at' for specific points (at the door).",
  seed: 9,
  cefr: 'A2',
  category: 'Prepositions',
})

export const LEVEL_10 = createLevel({
  id: 10,
  phrase: 'I have never been to Paris',
  hint: 'Present perfect with "never" — life experience up to now',
  source: 'English verb tenses',
  grammarExplanation: "Use the present perfect ('have/has been') with 'never' or 'ever' to talk about life experiences without specifying when they happened.",
  seed: 10,
  cefr: 'B1',
  category: 'Verb Tenses',
})

export const LEVEL_11 = createLevel({
  id: 11,
  phrase: 'An apple a day keeps away',
  hint: 'Use "an" before words starting with a vowel sound',
  source: 'English articles',
  grammarExplanation: "Use 'an' before words that begin with a vowel sound (an apple, an hour), and 'a' before words that begin with a consonant sound.",
  seed: 11,
  cefr: 'A2',
  category: 'Articles',
})

export const LEVEL_12 = createLevel({
  id: 12,
  phrase: 'Each student must try harder',
  hint: '"Each" is singular — the verb and pronouns that follow must agree',
  source: 'Subject-verb agreement',
  grammarExplanation: "'Each', 'every', 'either', and 'neither' are always singular and require a singular verb and singular pronouns.",
  seed: 12,
  cefr: 'B1',
  category: 'Subject-Verb Agreement',
})

export const LEVEL_13 = createLevel({
  id: 13,
  phrase: 'Either he or she is wrong',
  hint: '"Either…or" — the verb agrees with the subject closest to it',
  source: 'Subject-verb agreement',
  grammarExplanation: "With 'either…or' and 'neither…nor', the verb agrees with the subject closest to it — here 'she is', not 'she are'.",
  seed: 13,
  cefr: 'B1',
  category: 'Subject-Verb Agreement',
})

export const LEVEL_14 = createLevel({
  id: 14,
  phrase: 'Look it up in the book',
  hint: 'Phrasal verb — "look up" means to search for information',
  source: 'English phrasal verbs',
  grammarExplanation: "With separable phrasal verbs like 'look up', a pronoun object must go between the verb and particle: 'look it up', not 'look up it'.",
  seed: 14,
  cefr: 'B1',
  category: 'Phrasal Verbs',
})

export const LEVEL_15 = createLevel({
  id: 15,
  phrase: 'Lets eat kids',
  hint: 'Add a comma: "Let\'s eat, kids" — punctuation saves lives',
  source: 'Punctuation rules',
  grammarExplanation: "A comma before a direct address (vocative) separates the action from the person being addressed — it can completely change the meaning.",
  seed: 15,
  cefr: 'B1',
  category: 'Punctuation',
})

// ─── Level bank — 15 advanced levels (C1/C2) ──────────────────────────────────

// 16 — Mixed Conditional (past situation → present result)
export const LEVEL_16 = createLevel({
  id: 16,
  phrase: 'If I had saved I would be rich',
  hint: 'Mixed conditional — a past action with a present consequence',
  source: 'Mixed Conditionals',
  grammarExplanation: "Mixed conditionals link different time frames. 'If I had saved' (past unreal) + 'would be' (present result) — NOT 'would have been'. The if-clause uses past perfect; the main clause uses 'would + base form'.",
  seed: 101,
  cefr: 'C1',
  category: 'Mixed Conditionals',
})

// 17 — Mixed Conditional (present state → past missed result)
export const LEVEL_17 = createLevel({
  id: 17,
  phrase: 'Were he brave he would have won',
  hint: 'Mixed conditional — present trait, missed past opportunity',
  source: 'Mixed Conditionals',
  grammarExplanation: "'Were he brave' is an inverted mixed conditional = 'If he were brave'. The if-clause (present state) uses subjunctive 'were'; the result (past) uses 'would have + past participle' — NOT 'was' or 'would win'.",
  seed: 102,
  cefr: 'C1',
  category: 'Mixed Conditionals',
})

// 18 — Inversion: negative adverbial
export const LEVEL_18 = createLevel({
  id: 18,
  phrase: 'Never should you call so late',
  hint: 'Inversion after a negative adverbial — auxiliary before subject',
  source: 'Inversion',
  grammarExplanation: "When a negative adverbial (e.g. 'under no circumstances', 'never', 'rarely') opens a sentence, the auxiliary and subject invert: 'should you call', NOT 'you should call'.",
  seed: 103,
  cefr: 'C1',
  category: 'Inversion',
})

// 19 — Inversion: Had + past participle (third conditional without "if")
export const LEVEL_19 = createLevel({
  id: 19,
  phrase: 'Had I known I would have come',
  hint: 'Inverted third conditional — omit "if" and front the auxiliary',
  source: 'Inversion',
  grammarExplanation: "You can omit 'if' in third conditionals by inverting: 'Had I known' = 'If I had known'. 'Had' moves to the front; the main clause stays 'would have + past participle'.",
  seed: 104,
  cefr: 'C1',
  category: 'Inversion',
})

// 20 — Inversion: Not only
export const LEVEL_20 = createLevel({
  id: 20,
  phrase: 'Not only did he win the race',
  hint: '"Not only" triggers subject-auxiliary inversion in the first clause',
  source: 'Inversion',
  grammarExplanation: "After 'not only' at the start of a clause, invert subject and auxiliary: 'did he win', NOT 'he won'. The second clause ('but he also…') uses normal word order.",
  seed: 105,
  cefr: 'C1',
  category: 'Inversion',
})

// 21 — Present Subjunctive (mandative): demand that
export const LEVEL_21 = createLevel({
  id: 21,
  phrase: 'He asked that she leave at once',
  hint: 'Mandative subjunctive — base form after verbs of demand/suggestion',
  source: 'Subjunctive',
  grammarExplanation: "After verbs like 'demand', 'insist', 'suggest', 'recommend', use the base form regardless of subject: 'that he leave', NOT 'that he leaves'. This is the mandative subjunctive.",
  seed: 106,
  cefr: 'C1',
  category: 'Subjunctive',
})

// 22 — Present Subjunctive (mandative): it is crucial that
export const LEVEL_22 = createLevel({
  id: 22,
  phrase: 'It is vital that she be told',
  hint: 'Subjunctive after "it is + adjective + that" — base form of "be"',
  source: 'Subjunctive',
  grammarExplanation: "After expressions like 'it is crucial/essential/vital that', use the base form 'be', NOT 'is' or 'was'. E.g. 'It is crucial that she be informed', NOT 'she is informed'.",
  seed: 107,
  cefr: 'C1',
  category: 'Subjunctive',
})

// 23 — Past Subjunctive / Wish + were
export const LEVEL_23 = createLevel({
  id: 23,
  phrase: 'I wish she were here with us',
  hint: '"Wish" + past subjunctive — "were" for all persons, not "was"',
  source: 'Subjunctive',
  grammarExplanation: "After 'I wish' expressing a present unreal desire, use the past subjunctive: 'were' for all subjects, NOT 'was'. 'I wish she were here', NOT 'I wish she was here' (formal/written English).",
  seed: 108,
  cefr: 'B2',
  category: 'Subjunctive',
})

// 24 — Cleft sentence: It-cleft
export const LEVEL_24 = createLevel({
  id: 24,
  phrase: 'It was Tom who found the bug',
  hint: 'It-cleft — highlights the subject by fronting it with "It was … who"',
  source: 'Cleft Sentences',
  grammarExplanation: "An it-cleft ('It was Jerry who…') puts strong focus on the highlighted element. The relative clause follows: 'who' for people, 'that' for things. Do NOT use 'which' here.",
  seed: 109,
  cefr: 'C1',
  category: 'Cleft Sentences',
})

// 25 — Cleft sentence: Wh-cleft (pseudo-cleft)
export const LEVEL_25 = createLevel({
  id: 25,
  phrase: 'What they did was make us wait',
  hint: 'Wh-cleft — "What + clause + was + focus element"',
  source: 'Cleft Sentences',
  grammarExplanation: "A wh-cleft ('What they did was…') emphasises the outcome. After 'was', use the base infinitive WITHOUT 'to': 'make us wait', NOT 'to make us wait'.",
  seed: 110,
  cefr: 'C1',
  category: 'Cleft Sentences',
})

// 26 — Reporting Passive: it is believed that
export const LEVEL_26 = createLevel({
  id: 26,
  phrase: 'It is said that rates will fall',
  hint: 'Reporting passive — distancing the speaker from the claim',
  source: 'Reporting Passive',
  grammarExplanation: "The reporting passive ('It is believed/said/thought that…') distances the speaker from the claim. The verb in the that-clause follows normal tense rules. Compare: 'It is believed that prices will rise' vs 'It was believed that prices would rise'.",
  seed: 111,
  cefr: 'C1',
  category: 'Reporting Passive',
})

// 27 — Reporting Passive: personal construction (to-infinitive)
export const LEVEL_27 = createLevel({
  id: 27,
  phrase: 'He is thought to have left soon',
  hint: 'Personal reporting passive — subject + passive + perfect infinitive',
  source: 'Reporting Passive',
  grammarExplanation: "Personal reporting passives place the subject first: 'He is thought to have left' (= it is thought that he left). Use the perfect infinitive ('to have + past participle') when the reported event is in the past.",
  seed: 112,
  cefr: 'C1',
  category: 'Reporting Passive',
})

// 28 — Past Modal of Deduction: must have
export const LEVEL_28 = createLevel({
  id: 28,
  phrase: 'She must have missed the train',
  hint: '"Must have" + past participle — logical certainty about the past',
  source: 'Past Modals of Deduction',
  grammarExplanation: "'Must have + past participle' expresses near-certain deduction about the past: 'She must have missed the train' (I'm sure she did). Contrast: 'might have' (possible), 'can't have' (impossible).",
  seed: 113,
  cefr: 'B2',
  category: 'Past Modals of Deduction',
})

// 29 — Past Modal of Deduction: can't have
export const LEVEL_29 = createLevel({
  id: 29,
  phrase: 'He cannot have known the truth',
  hint: '"Can\'t have" + past participle — logical impossibility in the past',
  source: 'Past Modals of Deduction',
  grammarExplanation: "'Can't have + past participle' expresses certainty that something did NOT happen: 'He can't have known' (it was impossible for him to know). Opposite of 'must have known'.",
  seed: 114,
  cefr: 'B2',
  category: 'Past Modals of Deduction',
})

// 30 — Inversion with degree adjective: Never have we met so kind a host
export const LEVEL_30 = createLevel({
  id: 30,
  phrase: 'Never have we met so kind a host',
  hint: 'Fronted negative + inversion + "so + adjective + a/an + noun"',
  source: 'Inversion',
  grammarExplanation: "Fronting 'never' triggers inversion ('have we'). The degree construction 'so + adjective + a/an + noun' is formal: 'so brave a child', NOT 'such a brave child' in this pattern.",
  seed: 115,
  cefr: 'C2',
  category: 'Inversion',
})

// 31 — Conditional with "should" (formal / polite possibility)
export const LEVEL_31 = createLevel({
  id: 31,
  phrase: 'Should you need help just ask',
  hint: '"Should + subject" — formal conditional without "if"',
  source: 'Mixed Conditionals',
  grammarExplanation: "Using 'should' at the start replaces 'if' in formal conditionals: 'Should you need help' = 'If you should need help'. The main clause uses the imperative or 'will/would'. More formal than a plain 'if' clause.",
  seed: 116,
  cefr: 'C1',
  category: 'Mixed Conditionals',
})

// 32 — Conditional with "were to" (hypothetical future)
export const LEVEL_32 = createLevel({
  id: 32,
  phrase: 'Were I to win I would travel',
  hint: '"Were + subject + to-infinitive" — hypothetical inversion without "if"',
  source: 'Mixed Conditionals',
  grammarExplanation: "'Were I to win' is a formal inverted conditional = 'If I were to win'. Use 'were to + base verb' in the if-clause; 'would + base verb' in the result clause. More hypothetical and formal than a regular second conditional.",
  seed: 117,
  cefr: 'C1',
  category: 'Mixed Conditionals',
})

// ─── LOTR / Hobbit bonus levels ───────────────────────────────────────────────

// 33 — Easter egg: the greatest riddle of all
export const LEVEL_33 = createLevel({
  id: 33,
  phrase: 'the bread ass',
  hint: 'The greatest of all — a riddle whispered in the deep. What is the biggest?',
  source: 'Riddles in the Dark',
  grammarExplanation: "A playful riddle answer. ('the bread ass' — say it out loud, precious.)",
  seed: 201,
  cefr: 'A2',
  category: 'Riddles of the Ring',
})

// 34 — Infinitive of purpose
export const LEVEL_34 = createLevel({
  id: 34,
  phrase: 'One ring to rule them all',
  hint: 'Infinitive of purpose — "to rule" expresses why the ring exists',
  source: 'The Lord of the Rings',
  grammarExplanation: "Use 'to' + base verb to express purpose: 'to rule' = in order to rule.",
  seed: 202,
  cefr: 'A2',
  category: 'Tales of Middle-earth',
})

// 35 — Frequency adverb
export const LEVEL_35 = createLevel({
  id: 35,
  phrase: 'A wizard is never late',
  hint: 'Adverb of frequency — "never" sits before the main verb',
  source: 'The Fellowship of the Ring',
  grammarExplanation: "Frequency adverbs like 'never' go before the main verb but after 'be'.",
  seed: 203,
  cefr: 'B1',
  category: 'Tales of Middle-earth',
})

// 36 — Modal for emphatic prohibition
export const LEVEL_36 = createLevel({
  id: 36,
  phrase: 'You shall not pass',
  hint: 'Modal "shall" for emphatic prohibition',
  source: 'The Fellowship of the Ring',
  grammarExplanation: "'Shall not' is a strong, formal way to forbid something.",
  seed: 204,
  cefr: 'B1',
  category: 'Tales of Middle-earth',
})

// 37 — Present continuous for planned future
export const LEVEL_37 = createLevel({
  id: 37,
  phrase: 'I am going on an adventure',
  hint: 'Present continuous for a planned near-future action',
  source: 'The Hobbit',
  grammarExplanation: "Use 'am/is/are' + verb-ing for plans already decided for the near future.",
  seed: 205,
  cefr: 'B2',
  category: 'Tales of the Shire',
})

// 38 — Superlative
export const LEVEL_38 = createLevel({
  id: 38,
  phrase: 'Even the smallest person matters',
  hint: 'Superlative — "the smallest" compares within a whole group',
  source: 'The Fellowship of the Ring',
  grammarExplanation: "Form superlatives of short adjectives with '-est' and 'the': the smallest.",
  seed: 206,
  cefr: 'B2',
  category: 'Tales of Middle-earth',
})

// 39 — Cleft-like structure + what-infinitive
export const LEVEL_39 = createLevel({
  id: 39,
  phrase: 'All we have to decide is what to do',
  hint: 'Cleft-like structure + "what to do" (what + infinitive)',
  source: 'The Fellowship of the Ring',
  grammarExplanation: "'what to do' = the thing we should do; use 'what' + infinitive for choices.",
  seed: 207,
  cefr: 'C1',
  category: 'Tales of Middle-earth',
})

// 40 — "Not all" + relative clause
export const LEVEL_40 = createLevel({
  id: 40,
  phrase: 'Not all those who wander are lost',
  hint: 'Quantifier "not all" + relative clause "who wander"',
  source: 'The Fellowship of the Ring',
  grammarExplanation: "'Not all' negates part of a group; 'who wander' is a relative clause describing them.",
  seed: 208,
  cefr: 'C1',
  category: 'Tales of the Shire',
})

// ─── All levels ───────────────────────────────────────────────────────────────

export const LEVELS = [
  LEVEL_1,  LEVEL_2,  LEVEL_3,  LEVEL_4,  LEVEL_5,
  LEVEL_6,  LEVEL_7,  LEVEL_8,  LEVEL_9,  LEVEL_10,
  LEVEL_11, LEVEL_12, LEVEL_13, LEVEL_14, LEVEL_15,
  LEVEL_16, LEVEL_17, LEVEL_18, LEVEL_19, LEVEL_20,
  LEVEL_21, LEVEL_22, LEVEL_23, LEVEL_24, LEVEL_25,
  LEVEL_26, LEVEL_27, LEVEL_28, LEVEL_29, LEVEL_30,
  LEVEL_31, LEVEL_32,
  LEVEL_33, LEVEL_34, LEVEL_35, LEVEL_36, LEVEL_37,
  LEVEL_38, LEVEL_39, LEVEL_40,
]

// ─── CEFR / Category helpers ──────────────────────────────────────────────────

/**
 * Returns all levels matching the given CEFR band.
 * @param {'A2'|'B1'|'B2'|'C1'|'C2'} cefr
 * @returns {Level[]}
 */
export function getLevelsByCEFR(cefr) {
  return LEVELS.filter((l) => l.cefr === cefr)
}

/** Unique sorted list of all grammar categories present in LEVELS. */
export const CATEGORIES = [...new Set(LEVELS.map((l) => l.category).filter(Boolean))].sort()

// ─── Daily puzzle helpers ─────────────────────────────────────────────────────

/** Returns today's date as 'YYYY-MM-DD' in local time. */
export function getTodayDateString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Deterministic hash of a date string → LEVELS index.
 * Uses djb2-style accumulation so every date maps to a stable, unique-ish index.
 */
export function getDailyLevelIndex(dateStr) {
  let h = 5381
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(h, 31) + dateStr.charCodeAt(i)) >>> 0
  }
  return h % LEVELS.length
}

/** localStorage key for today's daily result. */
export function getDailyKey(dateStr) {
  return `linguo-daily-${dateStr}`
}

// ─── Fresh grid factory ─────────────────────────────────────────────────────

/**
 * Returns a brand-new { grid: Cell[][], activeColor: string } for the given level,
 * with every cell in its initial state (revealed: false).
 * Must be called each time a player enters a level — never reuse level.grid.
 *
 * @param {Level} level
 * @returns {{ grid: Cell[][], activeColor: string }}
 */
export function freshGrid(level) {
  const { decoyCount } = getDifficulty(level.cefr)
  return buildGrid(level.phrase, level.seed, decoyCount)
}

/**
 * Returns the moves budget for a level:
 *   phraseLetterCount + tapBudgetMargin (by CEFR), floor of phraseLetterCount + 1.
 *
 * @param {Level} level
 * @returns {number}
 */
export function movesBudgetFor(level) {
  const letters = level.phrase.split('').filter((c) => c !== ' ').length
  const { tapBudgetMargin } = getDifficulty(level.cefr)
  return Math.max(letters + 1, letters + tapBudgetMargin)
}

// ─── HiddenPhrase builder ─────────────────────────────────────────────────────

/**
 * Returns a HiddenPhrase object for the given level.
 * Spaces are pre-revealed; all other slots start hidden.
 *
 * @param {Level} level
 * @returns {HiddenPhrase}
 */
export function buildHiddenPhrase(level) {
  const slots = level.phrase.split('').map((char, i) => ({
    index: i,
    char,
    revealed: char === ' ',
    isNew: false,
  }))
  return { slots, phrase: level.phrase }
}

// ─── Initial game state ───────────────────────────────────────────────────────

const firstLevel = LEVELS[0]

/** @type {GameState} */
const _firstFresh = freshGrid(firstLevel)

export const initialGameState = {
  currentLevel: firstLevel,
  grid: _firstFresh.grid,
  activeColor: _firstFresh.activeColor,
  hiddenPhrase: buildHiddenPhrase(firstLevel),
  score: 0,
  moves: 0,
  movesLeft: movesBudgetFor(firstLevel),
  streak: 0,
  lastHintMove: -4,
  hintsUsedThisLevel: 0,
  level: 1,
  levelComplete: false,
  gameComplete: false,
  lastFeedback: null,
  solvedByButton:  false,
  wrongSolveCount: 0,
  rerollsUsed: 0,
  strikes: 0,
}
