// ─── Sentence Builder data ────────────────────────────────────────────────────
// Each item has tokens in CORRECT order.
// The component will shuffle them and ask the player to reconstruct.
//
// Item shape:
// {
//   id:           number
//   category:     string   (matches gameData CATEGORIES)
//   cefr:         'B2'|'C1'|'C2'
//   tokens:       string[]   — fragments in CORRECT order (displayed shuffled)
//   distractor?:  string     — optional extra token that does NOT belong
//   explanation:  string     — rule shown after answering
// }

export const BUILDER_ITEMS = [

  // ── Inversion ────────────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'Inversion',
    cefr: 'C1',
    tokens: ['Under no circumstances', 'should', 'you', 'call', 'her'],
    explanation: "Negative adverbial inversion: 'Under no circumstances' forces auxiliary 'should' before the subject 'you'. Normal order would be 'you should call her'.",
  },
  {
    id: 2,
    category: 'Inversion',
    cefr: 'C1',
    tokens: ['Had', 'I', 'known', 'I', 'would have', 'come'],
    explanation: "Third-conditional inversion: drop 'if' and front 'had'. 'Had I known' = 'If I had known'. The main clause keeps 'would have + past participle'.",
  },
  {
    id: 3,
    category: 'Inversion',
    cefr: 'C1',
    tokens: ['Not only', 'did she', 'win the race', 'but she also', 'broke the record'],
    explanation: "'Not only' triggers inversion in the first clause ('did she win'). The 'but also' clause uses normal word order ('she also broke').",
  },
  {
    id: 4,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['Never', 'have we', 'hosted', 'so clever', 'a diplomat'],
    distractor: 'such a',
    explanation: "Fronted 'Never' triggers inversion ('have we'). The formal degree structure is 'so + adjective + a/an + noun', NOT 'such a clever diplomat' in this inverted pattern.",
  },
  {
    id: 5,
    category: 'Inversion',
    cefr: 'C1',
    tokens: ['Rarely', 'does she', 'arrive', 'on time'],
    explanation: "Fronted 'Rarely' (negative adverb) triggers inversion: 'does she arrive', NOT 'she arrives'. Use a dummy 'do/does/did' when there is no other auxiliary.",
  },

  // ── Cleft Sentences ──────────────────────────────────────────────────────────
  {
    id: 6,
    category: 'Cleft Sentences',
    cefr: 'C1',
    tokens: ['It was', 'the colonel', 'who', 'opened', 'the safe'],
    explanation: "It-cleft: 'It was X who/that…' puts focus on the highlighted element. Use 'who' for people. The relative pronoun cannot be omitted.",
  },
  {
    id: 7,
    category: 'Cleft Sentences',
    cefr: 'C1',
    tokens: ['What they did', 'was', 'make', 'us wait'],
    distractor: 'to make',
    explanation: "Wh-cleft: 'What + clause + was + [focus]'. After 'was', use the bare infinitive — 'make us wait', NOT 'to make us wait'.",
  },
  {
    id: 8,
    category: 'Cleft Sentences',
    cefr: 'C1',
    tokens: ['It is', 'the timing', 'that', 'matters', 'most'],
    explanation: "It-cleft focusing on a thing: use 'that' (not 'who'). 'It is the timing that matters most' emphasises the subject 'timing'.",
  },

  // ── Reporting Passive ────────────────────────────────────────────────────────
  {
    id: 9,
    category: 'Reporting Passive',
    cefr: 'C1',
    tokens: ['He', 'is reported', 'to have', 'destroyed', 'the file'],
    distractor: 'to destroy',
    explanation: "Personal reporting passive + perfect infinitive: the destruction happened BEFORE the reporting. Use 'to have + past participle'. 'To destroy' would imply a simultaneous or future act.",
  },
  {
    id: 10,
    category: 'Reporting Passive',
    cefr: 'C1',
    tokens: ['It', 'is believed', 'that', 'prices', 'will rise', 'next year'],
    explanation: "Impersonal reporting passive: 'It is believed that…' distances the claim from any specific speaker. The that-clause follows normal tense rules.",
  },
  {
    id: 11,
    category: 'Reporting Passive',
    cefr: 'C1',
    tokens: ['She', 'is thought', 'to be', 'living', 'abroad'],
    explanation: "Personal reporting passive for a simultaneous/ongoing state: 'to be + -ing' (present infinitive continuous). Compare: 'to have been living' for a past ongoing state.",
  },

  // ── Mixed Conditionals ───────────────────────────────────────────────────────
  {
    id: 12,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    tokens: ['If I', 'had studied', 'harder', 'I would be', 'a doctor', 'today'],
    explanation: "Mixed conditional (past → present): 'If I had studied' (past unreal) + 'I would be' (present result). Don't use 'would have been' — that makes it a pure 3rd conditional.",
  },
  {
    id: 13,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    tokens: ['Should', 'you', 'need', 'any help', 'do not hesitate', 'to ask'],
    explanation: "Formal conditional inversion with 'should': drop 'if' and front the auxiliary. 'Should you need help' = 'If you should need help'. More formal than a standard if-clause.",
  },
  {
    id: 14,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    tokens: ['Were', 'I', 'to win', 'the prize', 'I would', 'travel'],
    explanation: "'Were I to win' = 'If I were to win'. Formal hypothetical inversion: 'were to + base verb' in the if-clause, 'would + base verb' in the result clause.",
  },

  // ── Subjunctive ─────────────────────────────────────────────────────────────
  {
    id: 15,
    category: 'Subjunctive',
    cefr: 'C1',
    tokens: ['The board', 'insisted', 'that', 'the CEO', 'resign', 'immediately'],
    distractor: 'resigns',
    explanation: "Mandative subjunctive: after 'insist that', use the base form 'resign', NOT 'resigns'. The subjunctive base form is identical for all persons and does not add -s.",
  },
  {
    id: 16,
    category: 'Subjunctive',
    cefr: 'C1',
    tokens: ['It is', 'essential', 'that', 'each delegate', 'be', 'present'],
    distractor: 'is',
    explanation: "Mandative subjunctive after 'it is essential that': use 'be', not 'is' or 'was'. The base form 'be' is required regardless of tense in the main clause.",
  },
  {
    id: 17,
    category: 'Subjunctive',
    cefr: 'B2',
    tokens: ['I wish', 'she', 'were', 'here', 'with us'],
    distractor: 'was',
    explanation: "Past subjunctive after 'I wish' for present unreal desires: use 'were' for ALL subjects (I, he, she, it), not 'was'. 'Was' is informal; 'were' is correct in formal English.",
  },

  // ── Past Modals of Deduction ─────────────────────────────────────────────────
  {
    id: 18,
    category: 'Past Modals of Deduction',
    cefr: 'B2',
    tokens: ['She', 'must have', 'left', 'the office', 'already'],
    distractor: 'must',
    explanation: "'Must have + past participle' expresses logical certainty about the past. The bare 'must leave/left' is a present obligation or past ability, not a deduction.",
  },
  {
    id: 19,
    category: 'Past Modals of Deduction',
    cefr: 'B2',
    tokens: ['He', "can't have", 'known', 'about', 'the plan'],
    distractor: "couldn't",
    explanation: "'Can't have + past participle' = logical impossibility about the past. 'Couldn't know' is past ability/permission, not a deduction. Use 'can't have known'.",
  },

  // ── Verb Tenses ──────────────────────────────────────────────────────────────
  {
    id: 20,
    category: 'Verb Tenses',
    cefr: 'B2',
    tokens: ['By the time', 'she arrives', 'we will have', 'finished', 'dinner'],
    explanation: "Future perfect: 'will have + past participle' for an action completed BEFORE a future reference point. 'By the time she arrives' sets that future point.",
  },

  // ── C2 expansion ─────────────────────────────────────────────────────────────
  {
    id: 21,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['Not only', 'did he', 'lie', 'but he also', 'destroyed', 'the evidence'],
    explanation: "Fronted 'not only' forces inversion ('did he lie'); 'but also' adds the second clause in normal word order.",
  },
  {
    id: 22,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['Only after', 'the truth emerged', 'did they', 'apologize'],
    explanation: "Fronted 'only after…' triggers subject-auxiliary inversion in the main clause.",
  },
  {
    id: 23,
    category: 'Mixed Conditionals',
    cefr: 'C2',
    tokens: ['Had I known', 'the risks', 'I would never', 'have invested'],
    explanation: "Inverted third conditional: 'had I known' = 'if I had known'. Drop 'if' and front 'had'.",
  },
  {
    id: 24,
    category: 'Cleft Sentences',
    cefr: 'C2',
    tokens: ['It was', 'only later', 'that', 'we grasped', 'the consequences'],
    explanation: "It-cleft fronting a time element ('only later') for emphasis.",
  },
  {
    id: 25,
    category: 'Cleft Sentences',
    cefr: 'C2',
    tokens: ['What', 'puzzled them most', 'was', 'his calm'],
    explanation: "Pseudo-cleft: 'What… was X' with singular 'was' agreeing with the wh-nominal clause.",
  },
  {
    id: 26,
    category: 'Subjunctive',
    cefr: 'C2',
    tokens: ['The board', 'demanded', 'that he', 'resign', 'immediately'],
    explanation: "Mandative subjunctive: base form 'resign' (not 'resigns') after 'demand that'.",
  },
  {
    id: 27,
    category: 'Subjunctive',
    cefr: 'C2',
    tokens: ['Were she', 'to refuse', 'we would', 'reconsider', 'everything'],
    explanation: "Inverted conditional 'were she to…' = 'if she were to…' — formal, hypothetical future.",
  },
  {
    id: 28,
    category: 'Past Modals of Deduction',
    cefr: 'C2',
    tokens: ['She', 'must have', 'misread', 'the instructions'],
    explanation: "'Must have + past participle' = confident deduction about the past.",
  },
  {
    id: 29,
    category: 'Past Modals of Deduction',
    cefr: 'C2',
    tokens: ['They', "can't have", 'finished', 'so quickly'],
    explanation: "'Can't have + past participle' = the past event was logically impossible.",
  },
  {
    id: 30,
    category: 'Reporting Passive',
    cefr: 'C2',
    tokens: ['The painting', 'is believed', 'to have been', 'stolen', 'in 1990'],
    explanation: "Reporting passive + perfect passive infinitive: 'is believed to have been stolen' (past event, passive voice).",
  },
  {
    id: 31,
    category: 'Reporting Passive',
    cefr: 'C2',
    tokens: ['It', 'was reported', 'that', 'talks', 'had collapsed'],
    explanation: "Impersonal reporting passive 'it was reported that…' with backshifted past perfect.",
  },
  {
    id: 32,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['Rarely', 'have we', 'witnessed', 'such resolve'],
    explanation: "Fronted 'rarely' (negative adverb) forces present perfect inversion: 'have we witnessed'.",
  },
  {
    id: 33,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['Under no circumstances', 'are you', 'to leave', 'the premises'],
    explanation: "Negative adverbial inversion with 'be + to' for a formal instruction or prohibition.",
  },
  {
    id: 34,
    category: 'Verb Tenses',
    cefr: 'C2',
    tokens: ['By next year', 'they', 'will have been', 'operating', 'for a decade'],
    explanation: "Future perfect continuous stressing duration up to a future point: 'will have been + -ing'.",
  },
  {
    id: 35,
    category: 'Mixed Conditionals',
    cefr: 'C2',
    tokens: ['If he', 'had listened', 'he', 'would not be', 'in trouble now'],
    explanation: "Mixed conditional: past condition ('had listened') + present result ('would not be') — 'now' anchors the result.",
  },
  {
    id: 36,
    category: 'Subjunctive',
    cefr: 'C2',
    tokens: ['I', 'would rather', 'you', 'had told', 'me sooner'],
    explanation: "'Would rather + past perfect' expresses regret about another person's past action.",
  },
  {
    id: 37,
    category: 'Cleft Sentences',
    cefr: 'C2',
    tokens: ['All', 'that remained', 'was', 'a faint hope'],
    explanation: "'All (that)…' pseudo-cleft with singular 'was' agreeing with the nominal clause.",
  },
  {
    id: 38,
    category: 'Inversion',
    cefr: 'C2',
    tokens: ['So rarely', 'does she', 'complain', 'that we worry'],
    explanation: "'So + adverb' fronting forces inversion ('does she complain'), paired with a 'that' result clause.",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Filter items by CEFR band and/or grammar category.
 * @param {{ cefr?: string, category?: string }} opts
 * @returns {BuilderItem[]}
 */
export function getBuilderItems({ cefr, category } = {}) {
  return BUILDER_ITEMS.filter((item) => {
    if (cefr && item.cefr !== cefr) return false
    if (category && item.category !== category) return false
    return true
  })
}

// ── Deterministic djb2 hash ───────────────────────────────────────────────────

function djb2(str, seed = 5381) {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Returns a deterministic sequence of N builder items for the given date string.
 * @param {string} dateStr  'YYYY-MM-DD'
 * @param {number} count    how many items to return (default 5)
 * @returns {BuilderItem[]}
 */
export function getDailyBuilderItems(dateStr, count = 5, pool = BUILDER_ITEMS) {
  const len  = pool.length
  const seen = new Set()
  const result = []
  let seed = djb2(dateStr, 9999) // different seed from grammarDuel
  while (result.length < Math.min(count, len)) {
    seed = djb2(dateStr, seed)
    const idx = seed % len
    if (!seen.has(idx)) {
      seen.add(idx)
      result.push(pool[idx])
    }
  }
  return result
}

// ── Seeded Fisher-Yates shuffle (deterministic per item+date) ─────────────────

/**
 * Returns a shuffled copy of `arr`, seeded so it is stable within a session
 * but different per item id and date.
 */
export function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = djb2(String(seed), 0x12345678)
  for (let i = a.length - 1; i > 0; i--) {
    s = djb2(String(i), s)
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const BUILDER_KEY_PREFIX = 'linguo-builder-'

export function getBuilderKey(dateStr) {
  return `${BUILDER_KEY_PREFIX}${dateStr}`
}

export function loadBuilderSave(dateStr) {
  try {
    const raw = localStorage.getItem(getBuilderKey(dateStr))
    if (!raw) return null
    const d = JSON.parse(raw)
    if (typeof d === 'object' && d !== null) return d
  } catch (_) {}
  return null
}

export function saveBuilderProgress(dateStr, data) {
  try {
    localStorage.setItem(getBuilderKey(dateStr), JSON.stringify(data))
  } catch (_) {}
}

// ── Reward constants ──────────────────────────────────────────────────────────

export const BUILDER_XP_CORRECT          = 20
export const BUILDER_COINS_CORRECT       = 8
export const BUILDER_XP_FIRST_TRY_BONUS  = 10   // bonus for getting it right on the first attempt
export const BUILDER_XP_PERFECT_BONUS    = 50
export const BUILDER_COINS_PERFECT_BONUS = 25
