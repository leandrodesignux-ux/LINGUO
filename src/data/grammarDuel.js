// ─── Grammar Duel data ────────────────────────────────────────────────────────
// Each item presents a grammatical choice to the player.
// The player identifies the correct form from 3-4 options.
//
// Item shape:
// {
//   id:          number
//   category:    string   (matches gameData CATEGORIES)
//   cefr:        'B2'|'C1'|'C2'
//   prompt:      string   (sentence with ___ or framing context)
//   options: [
//     { text: string, correct: boolean, why: string }
//   ]
//   explanation: string   (full rule shown after answering)
// }

export const DUEL_ITEMS = [
  // ── Subjunctive ─────────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'Subjunctive',
    cefr: 'C1',
    prompt: 'I suggest that he ___ harder next semester.',
    options: [
      { text: 'study',    correct: true,  why: "Mandative subjunctive: use the base form after 'suggest that', regardless of subject." },
      { text: 'studies',  correct: false, why: "Wrong: don't add -s in the subjunctive. The base form 'study' is required after 'suggest that'." },
      { text: 'studied',  correct: false, why: "Wrong: past tense changes the time frame. The subjunctive base form 'study' keeps it present/future." },
      { text: 'to study', correct: false, why: "Wrong: the infinitive 'to study' is used after most verbs, but after 'suggest that' the bare base form is needed." },
    ],
    explanation: "After verbs like 'suggest', 'demand', 'insist', 'recommend', use the base form of the verb in a that-clause (mandative subjunctive): 'suggest that he study', NOT 'studies'.",
  },
  {
    id: 2,
    category: 'Subjunctive',
    cefr: 'C1',
    prompt: 'The committee insists that the report ___ submitted by Friday.',
    options: [
      { text: 'be',      correct: true,  why: "Mandative subjunctive: 'be' is the base form of 'to be', required after 'insist that'." },
      { text: 'is',      correct: false, why: "Wrong: 'is' is the indicative present. The subjunctive requires the base form 'be'." },
      { text: 'was',     correct: false, why: "Wrong: 'was' is past tense and changes meaning. The base form 'be' is required." },
      { text: 'being',   correct: false, why: "Wrong: the -ing form is not used in the mandative subjunctive. Use the bare base form 'be'." },
    ],
    explanation: "The mandative subjunctive uses 'be' (not 'is', 'was', or 'being') after verbs of command/recommendation in a that-clause.",
  },
  {
    id: 3,
    category: 'Subjunctive',
    cefr: 'B2',
    prompt: 'I wish she ___ here right now to see this.',
    options: [
      { text: 'were',  correct: true,  why: "Past subjunctive: 'were' is used for all persons after 'I wish' expressing a present unreal desire." },
      { text: 'was',   correct: false, why: "Acceptable in informal speech, but in formal/written English 'were' is the correct subjunctive form." },
      { text: 'is',    correct: false, why: "Wrong: present tense 'is' indicates a real fact. 'Wish' + subjunctive expresses an unreal desire." },
      { text: 'would be', correct: false, why: "Wrong: 'would be' expresses future willingness. After 'I wish' for present states, use 'were'." },
    ],
    explanation: "After 'I wish' for present unreal situations, use the past subjunctive 'were' for all subjects (I/he/she/it wish I were, she were, etc.), NOT 'was' in formal English.",
  },

  // ── Mixed Conditionals ───────────────────────────────────────────────────────
  {
    id: 4,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    prompt: 'If I had studied medicine, I ___ a doctor today.',
    options: [
      { text: 'would be',      correct: true,  why: "Mixed conditional (past→present): the result clause uses 'would + base form' for a present consequence." },
      { text: 'would have been', correct: false, why: "Wrong: 'would have been' is the third conditional result, implying a past consequence — not a present state." },
      { text: 'will be',        correct: false, why: "Wrong: 'will be' is used for real future predictions, not hypothetical present results." },
      { text: 'had been',       correct: false, why: "Wrong: 'had been' is past perfect, not the result clause of a mixed conditional." },
    ],
    explanation: "Mixed conditional (past → present): 'If I had studied' (past unreal) + 'would be' (present result). Don't confuse with the 3rd conditional which uses 'would have been'.",
  },
  {
    id: 5,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    prompt: 'If she were more organised, she ___ the deadline yesterday.',
    options: [
      { text: 'would have met',  correct: true,  why: "Mixed conditional (present→past): 'would have + past participle' expresses a missed past result caused by a present trait." },
      { text: 'would meet',      correct: false, why: "Wrong: 'would meet' is a second conditional result referring to the present/future, not a past event." },
      { text: 'had met',         correct: false, why: "Wrong: 'had met' is past perfect used in if-clauses, not in result clauses." },
      { text: 'will have met',   correct: false, why: "Wrong: 'will have met' is future perfect, inappropriate in a hypothetical conditional." },
    ],
    explanation: "Mixed conditional (present → past): 'If she were more organised' (present unreal trait) + 'would have met' (past result she missed). The if-clause uses 'were'; the result uses 'would have + past participle'.",
  },
  {
    id: 6,
    category: 'Mixed Conditionals',
    cefr: 'C1',
    prompt: '___ you need any assistance, please contact our help desk.',
    options: [
      { text: 'Should',         correct: true,  why: "Formal inverted conditional: 'Should you need' = 'If you should need'. Auxiliary fronted, 'if' omitted." },
      { text: 'If',             correct: false, why: "Grammatically fine but not the advanced inverted form. The question targets the formal inversion with 'Should'." },
      { text: 'Would',          correct: false, why: "Wrong: 'Would you need' is a question form, not a conditional clause." },
      { text: 'Unless',         correct: false, why: "Wrong: 'Unless' means 'if not', which reverses the meaning entirely." },
    ],
    explanation: "Formal conditional inversion: omit 'if' and front the auxiliary. 'Should you need help' = 'If you should need help'. Common in formal written English.",
  },

  // ── Inversion ────────────────────────────────────────────────────────────────
  {
    id: 7,
    category: 'Inversion',
    cefr: 'C1',
    prompt: 'Under no circumstances ___ anyone enter the restricted area.',
    options: [
      { text: 'should',           correct: true,  why: "Negative adverbial inversion: 'should' (auxiliary) precedes the subject 'anyone' after the fronted negative phrase." },
      { text: 'anyone should',    correct: false, why: "Wrong: this is normal word order. After a fronted negative adverbial the auxiliary MUST precede the subject." },
      { text: 'would',            correct: false, why: "Wrong: 'would' implies willingness, not the prohibition expressed by 'under no circumstances'." },
      { text: 'does',             correct: false, why: "Wrong: 'does' is used with third-person singular present, but the inverted form here requires a modal." },
    ],
    explanation: "Negative adverbials ('under no circumstances', 'never', 'rarely') at the start of a clause force subject-auxiliary inversion: 'Under no circumstances should anyone…', NOT 'should anyone'.",
  },
  {
    id: 8,
    category: 'Inversion',
    cefr: 'C1',
    prompt: '___ I known about the meeting, I would have attended.',
    options: [
      { text: 'Had',    correct: true,  why: "'Had I known' is the inverted form of 'If I had known' — drop 'if' and front 'had'." },
      { text: 'If had', correct: false, why: "Wrong: you cannot keep 'if' AND invert — choose one structure." },
      { text: 'Did',    correct: false, why: "Wrong: 'Did' is the past simple auxiliary, not used in third-conditional inversions." },
      { text: 'Have',   correct: false, why: "Wrong: 'Have I known' is not grammatical for a past conditional." },
    ],
    explanation: "Third conditional inversion: omit 'if' and move 'had' to the front. 'Had I known' = 'If I had known'. The main clause stays 'would have + past participle'.",
  },
  {
    id: 9,
    category: 'Inversion',
    cefr: 'C1',
    prompt: 'Not only did she win the competition, ___ she broke the record.',
    options: [
      { text: 'but also',     correct: true,  why: "'Not only…but also' is the standard correlative pair. The second clause uses normal word order." },
      { text: 'but also did', correct: false, why: "Wrong: inversion applies only to the 'not only' clause. The 'but also' clause uses normal word order." },
      { text: 'and',          correct: false, why: "Grammatically loose but loses the emphatic contrast that 'not only…but also' provides." },
      { text: 'nor',          correct: false, why: "Wrong: 'nor' introduces a negative addition, contradicting the positive meaning of 'but also'." },
    ],
    explanation: "'Not only' triggers inversion in its clause ('did she win'). The paired 'but also' clause uses NORMAL word order: 'but also she broke the record', NOT 'but also did she break'.",
  },
  {
    id: 10,
    category: 'Inversion',
    cefr: 'C2',
    prompt: 'Never ___ such a dedicated team of volunteers.',
    options: [
      { text: 'have we seen',    correct: true,  why: "Fronted 'Never' triggers inversion: auxiliary 'have' precedes subject 'we'." },
      { text: 'we have seen',    correct: false, why: "Wrong: normal word order after 'Never' is ungrammatical in formal English. Inversion is required." },
      { text: 'we had seen',     correct: false, why: "Wrong: wrong tense (past perfect) and wrong word order." },
      { text: 'have seen we',    correct: false, why: "Wrong: subject must follow immediately after the auxiliary, not at the end." },
    ],
    explanation: "Fronted negative adverbs ('Never', 'Rarely', 'Seldom') require subject-auxiliary inversion: 'Never have we seen…'. The subject comes after the first auxiliary.",
  },

  // ── Reporting Passive ────────────────────────────────────────────────────────
  {
    id: 11,
    category: 'Reporting Passive',
    cefr: 'C1',
    prompt: 'He is believed ___ the company funds.',
    options: [
      { text: 'to have stolen',  correct: true,  why: "Personal reporting passive + perfect infinitive: the stealing happened before the current belief, so 'to have + past participle' is needed." },
      { text: 'to steal',        correct: false, why: "Wrong: 'to steal' implies simultaneous or future action. Use 'to have stolen' when the reported event is in the past." },
      { text: 'having stolen',   correct: false, why: "Wrong: the gerund 'having stolen' is not used after reporting passives like 'is believed'." },
      { text: 'that he stolen',  correct: false, why: "Wrong: 'that he stolen' is not grammatical in any construction." },
    ],
    explanation: "Personal reporting passive: 'He is believed to have stolen' (past event). Use 'to have + past participle' when the reported action precedes the reporting. Contrast: 'He is believed to be innocent' (simultaneous state).",
  },
  {
    id: 12,
    category: 'Reporting Passive',
    cefr: 'C1',
    prompt: '___ that global temperatures will continue to rise.',
    options: [
      { text: 'It is predicted',   correct: true,  why: "Impersonal reporting passive: 'It is predicted that…' distances the claim from a specific speaker." },
      { text: 'It predicts',       correct: false, why: "Wrong: 'It predicts' is active voice and requires a specific agent — 'it' cannot act as a vague subject here." },
      { text: 'They are predicted', correct: false, why: "Wrong: 'They are predicted' would need a specific subject ('temperatures are predicted to rise'), not a that-clause." },
      { text: 'It has predicted',  correct: false, why: "Wrong: present perfect active requires an agent. The impersonal passive uses 'is', not 'has'." },
    ],
    explanation: "Impersonal reporting passive: 'It is said/believed/predicted/reported that…' — no specific agent, formal register. Compare personal: 'Temperatures are predicted to rise'.",
  },

  // ── Cleft Sentences ──────────────────────────────────────────────────────────
  {
    id: 13,
    category: 'Cleft Sentences',
    cefr: 'C1',
    prompt: 'It was Maria ___ first noticed the error in the data.',
    options: [
      { text: 'who',    correct: true,  why: "'Who' is the correct relative pronoun in an it-cleft for a person." },
      { text: 'which',  correct: false, why: "Wrong: 'which' is used for things, not people." },
      { text: 'that',   correct: false, why: "Acceptable in informal usage but 'who' is preferred for people in formal it-clefts." },
      { text: '∅ (omit)', correct: false, why: "Wrong: the relative pronoun cannot be omitted in an it-cleft." },
    ],
    explanation: "In it-clefts ('It was X who/that…'), use 'who' for people and 'that' for things or people (informal). Never 'which' for people, and never omit the pronoun.",
  },
  {
    id: 14,
    category: 'Cleft Sentences',
    cefr: 'C1',
    prompt: 'What the manager decided ___ cut the budget entirely.',
    options: [
      { text: 'was to',       correct: false, why: "Close but: after 'What + clause + was', use the bare infinitive (no 'to') OR a noun phrase. 'Was to cut' adds an unnecessary 'to'." },
      { text: 'was',          correct: true,  why: "'What the manager decided was cut the budget' — after 'was', use the bare base form of the verb in this wh-cleft." },
      { text: 'were',         correct: false, why: "Wrong: the wh-clause 'what the manager decided' is singular, so 'was' is correct." },
      { text: 'has been',     correct: false, why: "Wrong: 'has been' adds unnecessary tense complexity. The simple 'was' completes the cleft." },
    ],
    explanation: "Wh-cleft (pseudo-cleft): 'What + clause + was + [focus]'. After 'was', use the bare infinitive: 'What he did was leave', NOT 'was to leave'. The subject wh-clause is always singular.",
  },

  // ── Past Modals of Deduction ─────────────────────────────────────────────────
  {
    id: 15,
    category: 'Past Modals of Deduction',
    cefr: 'B2',
    prompt: 'She left two hours ago — she ___ home by now.',
    options: [
      { text: 'must have arrived',    correct: true,  why: "'Must have + past participle' expresses near-certain deduction about a past event." },
      { text: 'must arrive',          correct: false, why: "Wrong: 'must arrive' is a present obligation/prediction, not a past deduction." },
      { text: 'should have arrived',  correct: false, why: "Wrong: 'should have arrived' expresses expectation/criticism, not logical certainty." },
      { text: 'had to arrive',        correct: false, why: "Wrong: 'had to arrive' expresses past obligation, not deduction." },
    ],
    explanation: "'Must have + past participle' = logical deduction (near certainty) about the past. Contrast: 'should have' (expectation/regret), 'might have' (possibility), 'can't have' (impossibility).",
  },
  {
    id: 16,
    category: 'Past Modals of Deduction',
    cefr: 'B2',
    prompt: 'The safe was still locked. He ___ stolen the jewels.',
    options: [
      { text: "can't have",    correct: true,  why: "'Can't have + past participle' = logical impossibility in the past. The locked safe makes theft impossible." },
      { text: "couldn't",      correct: false, why: "Wrong: 'couldn't steal' is past simple ability/permission, not a deduction about the past." },
      { text: "mustn't have",  correct: false, why: "Wrong: 'mustn't have' is not standard for past impossibility. Use 'can't have'." },
      { text: "wouldn't have", correct: false, why: "Wrong: 'wouldn't have' expresses unwillingness/refusal, not logical impossibility." },
    ],
    explanation: "'Can't have + past participle' = impossibility deduction. 'He can't have stolen them' means it was logically impossible. Opposite: 'must have' (certainty). 'Mustn't have' is non-standard for this meaning.",
  },
  {
    id: 17,
    category: 'Past Modals of Deduction',
    cefr: 'C1',
    prompt: 'She ___ the instructions — her result is perfect.',
    options: [
      { text: 'must have followed',   correct: true,  why: "Logical certainty: the perfect result is evidence she followed them. 'Must have + past participle' for strong deduction." },
      { text: 'might have followed',  correct: false, why: "Too weak: 'might have' expresses mere possibility, but the context (perfect result) implies certainty." },
      { text: 'should have followed', correct: false, why: "Wrong meaning: 'should have followed' implies she didn't (criticism/regret), contradicting the perfect result." },
      { text: 'would have followed',  correct: false, why: "Wrong: 'would have' is used in conditionals or to express hypothetical willingness." },
    ],
    explanation: "Choose the modal that matches the degree of certainty the evidence provides. 'Must have followed' = certain (strong evidence). 'Might have' = possible. 'Should have' = she didn't (regret).",
  },

  // ── Subject-Verb Agreement ───────────────────────────────────────────────────
  {
    id: 18,
    category: 'Subject-Verb Agreement',
    cefr: 'B2',
    prompt: 'Neither the manager nor the employees ___ informed about the change.',
    options: [
      { text: 'were',  correct: true,  why: "Proximity rule: with 'neither…nor', the verb agrees with the nearest subject — 'employees' (plural) → 'were'." },
      { text: 'was',   correct: false, why: "Wrong: 'was' would agree with 'manager' (singular), but the proximity rule requires agreeing with 'employees' (the nearer subject)." },
      { text: 'are',   correct: false, why: "Wrong tense: the sentence refers to a past event, so past tense 'were' is needed." },
      { text: 'have been', correct: false, why: "Possible tense-wise but the simpler past 'were' is more natural and idiomatic here." },
    ],
    explanation: "With 'either…or' and 'neither…nor', the verb agrees with the subject CLOSEST to it (proximity rule). 'Neither the manager nor the employees were' — 'employees' is nearest, so plural 'were'.",
  },

  // ── Phrasal Verbs ────────────────────────────────────────────────────────────
  {
    id: 19,
    category: 'Phrasal Verbs',
    cefr: 'B2',
    prompt: 'Could you please ___ this form before the meeting?',
    options: [
      { text: 'fill in',    correct: true,  why: "'Fill in' means to complete a form. With a noun object, verb and particle can stay together." },
      { text: 'fill it in', correct: false, why: "Correct if 'it' replaced 'this form', but the question uses a noun, so both 'fill in this form' and 'fill this form in' are valid. 'Fill in' is the standard collocation." },
      { text: 'fill up',    correct: false, why: "Wrong collocation: 'fill up' means to fill a container to capacity, not to complete a document." },
      { text: 'fill out in', correct: false, why: "Wrong: 'fill out' is a valid alternative to 'fill in', but 'fill out in' (double particle) is not grammatical." },
    ],
    explanation: "'Fill in' (or 'fill out') = complete a form. With separable phrasal verbs, a pronoun object MUST split the verb: 'fill IT in'. A noun object may go either side: 'fill in the form' or 'fill the form in'.",
  },

  // ── Articles ─────────────────────────────────────────────────────────────────
  {
    id: 20,
    category: 'Articles',
    cefr: 'B2',
    prompt: 'She plays ___ violin in the city orchestra.',
    options: [
      { text: 'the',  correct: true,  why: "Musical instruments use 'the' in British English: 'play the violin/piano/guitar'." },
      { text: 'a',    correct: false, why: "Wrong: 'a violin' would imply she picks up any random violin. Convention requires 'the' with musical instruments." },
      { text: '∅',    correct: false, why: "Wrong: the zero article is used with sports ('play football') but NOT with musical instruments in British English." },
      { text: 'an',   correct: false, why: "Wrong: 'an' is used before vowel sounds. 'Violin' starts with a consonant sound /v/, and in any case 'the' is required here." },
    ],
    explanation: "Musical instruments take 'the' in British English: 'play the violin', 'play the piano'. Sports take zero article: 'play football'. This is a fixed idiomatic convention.",
  },

  // ── Verb Tenses ──────────────────────────────────────────────────────────────
  {
    id: 21,
    category: 'Verb Tenses',
    cefr: 'B1',
    prompt: 'By the time she arrives, we ___ dinner.',
    options: [
      { text: 'will have finished',  correct: true,  why: "Future perfect: an action completed BEFORE a future reference point ('by the time she arrives')." },
      { text: 'will finish',         correct: false, why: "Wrong: 'will finish' implies the action happens at or after her arrival, not before." },
      { text: 'have finished',       correct: false, why: "Wrong: present perfect cannot be combined with a future 'by the time' clause." },
      { text: 'finish',              correct: false, why: "Wrong: simple present cannot express completion before a future event." },
    ],
    explanation: "Future perfect ('will have + past participle') is used for actions completed before a specified future time: 'By the time X happens, Y will have happened'.",
  },
  {
    id: 22,
    category: 'Verb Tenses',
    cefr: 'B2',
    prompt: 'The workers ___ on the bridge for three years when it finally opened.',
    options: [
      { text: 'had been working',  correct: true,  why: "Past perfect continuous: an ongoing action over a period that ended at a specific past point ('when it opened')." },
      { text: 'were working',      correct: false, why: "Wrong: 'were working' (past continuous) implies the action was still in progress when it opened, not completed." },
      { text: 'had worked',        correct: false, why: "Partially correct but 'had been working' better emphasises the duration and ongoing nature of the effort." },
      { text: 'have been working', correct: false, why: "Wrong: present perfect continuous cannot be used for a completed past period." },
    ],
    explanation: "Past perfect continuous ('had been + verb-ing') highlights the duration of an ongoing past action that ended or was interrupted at another past point.",
  },

  // ── Prepositions ─────────────────────────────────────────────────────────────
  {
    id: 23,
    category: 'Prepositions',
    cefr: 'B2',
    prompt: 'Her success is largely due ___ her years of hard work.',
    options: [
      { text: 'to',   correct: true,  why: "'Due to' is a fixed prepositional phrase meaning 'because of' or 'as a result of'." },
      { text: 'from', correct: false, why: "Wrong: 'due from' is not a standard expression. The fixed phrase is 'due to'." },
      { text: 'of',   correct: false, why: "Wrong: 'due of' is not grammatical. 'Due to' is the correct fixed phrase." },
      { text: 'by',   correct: false, why: "Wrong: 'due by' means 'to be completed/paid by a deadline', a completely different meaning." },
    ],
    explanation: "'Due to' = caused by / because of. It is always followed by a noun or noun phrase: 'due to hard work', 'due to bad weather'. Not to be confused with 'due by' (deadline).",
  },

  // ── Punctuation ──────────────────────────────────────────────────────────────
  {
    id: 24,
    category: 'Punctuation',
    cefr: 'B1',
    prompt: "Which sentence is correctly punctuated?",
    options: [
      { text: "Let's eat, grandma!",   correct: true,  why: "The comma before 'grandma' (vocative/direct address) separates the action from the person addressed." },
      { text: "Let's eat grandma!",    correct: false, why: "Wrong: without the comma, this literally says you will eat your grandmother — a classic comma splice error." },
      { text: "Lets eat, grandma!",    correct: false, why: "Wrong: 'Lets' (without apostrophe) is third-person singular of 'let', not the contraction 'let us'." },
      { text: "Let's eat grandma.",    correct: false, why: "Wrong: wrong punctuation AND missing vocative comma — the exclamation mark better matches the urgency, and the comma is still missing." },
    ],
    explanation: "A comma before a direct address (vocative) is mandatory: 'Let's eat, grandma!' vs 'Let's eat grandma!' Also: 'let's' = let us (with apostrophe); 'lets' = third-person singular of 'let'.",
  },

  // ── More advanced Inversion / Unless ────────────────────────────────────────
  {
    id: 25,
    category: 'Mixed Conditionals',
    cefr: 'B2',
    prompt: '___ you hurry, you will miss the last train.',
    options: [
      { text: 'Unless',          correct: true,  why: "'Unless' = 'if not': 'Unless you hurry' = 'If you do not hurry'. Single negative is correct." },
      { text: "Unless you don't", correct: false, why: "Wrong: double negative. 'Unless' already contains the negative, so adding 'don't' creates 'if you don't not hurry'." },
      { text: 'If not',          correct: false, why: "Incomplete: 'if not' cannot stand alone — it needs a subject: 'If you don't hurry' or 'Unless you hurry'." },
      { text: 'Without',         correct: false, why: "'Without you hurrying' is grammatical but registers differently; 'Unless' is the idiomatic choice here." },
    ],
    explanation: "'Unless' = 'if not'. It already contains a negative, so NEVER write 'unless you don't…' — that creates an unintended double negative meaning 'if you DO'.",
  },

  // ── C2 expansion ─────────────────────────────────────────────────────────────
  {
    id: 26,
    category: 'Subjunctive',
    cefr: 'C2',
    prompt: "Were it not for her counsel, the deal ___ collapsed.",
    options: [
      { text: 'would have',      correct: true,  why: "Mixed unreal past: 'were it not for' (inverted 'if it were not for') takes 'would have' + past participle." },
      { text: 'would',           correct: false, why: "Wrong: 'would collapse' is a present unreal result; 'collapsed' is past participle here, so 'would have' is needed." },
      { text: 'had',             correct: false, why: "Wrong: 'had collapsed' alone has no modal — ungrammatical as the main clause of a conditional." },
      { text: 'will have',       correct: false, why: "Wrong: 'will have' is real future perfect, not an unreal past modal." },
    ],
    explanation: "'Were it not for X' is a formal inverted conditional about an unreal situation; the main clause uses 'would have + past participle'.",
  },
  {
    id: 27,
    category: 'Inversion',
    cefr: 'C2',
    prompt: "Not until the contract was signed ___ to celebrate.",
    options: [
      { text: 'did they begin',   correct: true,  why: "Fronted 'not until' forces subject-auxiliary inversion: 'did they begin'." },
      { text: 'they began',       correct: false, why: "Wrong: no inversion after a fronted negative time adverbial — auxiliary must precede the subject." },
      { text: 'they did begin',   correct: false, why: "Wrong: this is emphatic declarative order, not the required inversion." },
      { text: 'began they',       correct: false, why: "Wrong: main verb inversion (V-S) is archaic/incorrect in modern English; use auxiliary inversion." },
    ],
    explanation: "Fronting a negative time adverbial ('not until…') triggers inversion: auxiliary 'did' before the subject.",
  },
  {
    id: 28,
    category: 'Inversion',
    cefr: 'C2',
    prompt: "So complex was the argument ___ few could follow it.",
    options: [
      { text: 'that',  correct: true,  why: "'So + adjective + inversion' pairs with a 'that'-clause of result." },
      { text: 'as',    correct: false, why: "Wrong: 'as' completes a comparison ('as complex as…'), not a result clause." },
      { text: 'which', correct: false, why: "Wrong: 'which' introduces a relative clause, not a result clause." },
      { text: 'than',  correct: false, why: "Wrong: 'than' follows comparatives ('more complex than'), not 'so + adjective'." },
    ],
    explanation: "'So + adjective + auxiliary/verb inversion' is completed by 'that' introducing the result clause.",
  },
  {
    id: 29,
    category: 'Cleft Sentences',
    cefr: 'C2',
    prompt: "___ was her silence that unsettled everyone, not her words.",
    options: [
      { text: 'It',    correct: true,  why: "It-cleft for emphasis: 'It was X that…' foregrounds 'her silence' over 'her words'." },
      { text: 'What',  correct: false, why: "Wrong: 'What was her silence that…' is ungrammatical; a pseudo-cleft would read 'What unsettled everyone was her silence'." },
      { text: 'That',  correct: false, why: "Wrong: 'That was her silence that…' is redundant and ungrammatical." },
      { text: 'There', correct: false, why: "Wrong: 'There was' introduces existence, not the emphatic cleft structure needed here." },
    ],
    explanation: "It-clefts ('It was X that…') foreground one element for contrast/emphasis.",
  },
  {
    id: 30,
    category: 'Mixed Conditionals',
    cefr: 'C2',
    prompt: "If she had taken the earlier train, she ___ here by now.",
    options: [
      { text: 'would be',          correct: true,  why: "Mixed conditional: past condition (had taken) + present result (would be) — 'by now' anchors the result to the present." },
      { text: 'would have been',   correct: false, why: "Wrong: 'would have been' signals a purely past result; 'by now' makes the result present, so 'would be' is needed." },
      { text: 'will be',           correct: false, why: "Wrong: 'will be' is a real future prediction, incompatible with the unreal past condition." },
      { text: 'was',               correct: false, why: "Wrong: 'was' has no modal and cannot serve as the main clause of a conditional." },
    ],
    explanation: "Mixed conditional: 'if + past perfect' (past condition) with 'would + base' (present result).",
  },
  {
    id: 31,
    category: 'Past Modals of Deduction',
    cefr: 'C2',
    prompt: "He never replied; he ___ the message at all.",
    options: [
      { text: "can't have seen",   correct: true,  why: "'Can't have + past participle' = logical impossibility about the past." },
      { text: "mustn't have seen", correct: false, why: "Wrong: 'mustn't have' is not standard for past impossibility deduction; 'can't have' is the correct form." },
      { text: "couldn't see",      correct: false, why: "Wrong: 'couldn't see' expresses past ability or permission, not a logical deduction about the past." },
      { text: "hadn't seen",       correct: false, why: "Wrong: 'hadn't seen' is past perfect fact, not a modal of deduction." },
    ],
    explanation: "For near-certain negative deduction about the past, use 'can't have + past participle'.",
  },
  {
    id: 32,
    category: 'Reporting Passive',
    cefr: 'C2',
    prompt: "The minister ___ to have misled parliament.",
    options: [
      { text: 'is alleged',    correct: true,  why: "Reporting passive: 'is alleged to have + past participle' reports a past claim impersonally." },
      { text: 'alleges',       correct: false, why: "Wrong: active voice — 'alleges' requires an agent (subject) doing the alleging." },
      { text: 'is alleging',   correct: false, why: "Wrong: 'is alleging' is active progressive and needs a direct object, not a 'to have' infinitive." },
      { text: 'alleged',       correct: false, why: "Wrong: past simple 'alleged' is active and needs an object; the passive requires 'is alleged'." },
    ],
    explanation: "Reporting passive ('is alleged/said/thought to have…') reports claims impersonally.",
  },
  {
    id: 33,
    category: 'Subjunctive',
    cefr: 'C2',
    prompt: "It is imperative that every applicant ___ present.",
    options: [
      { text: 'be',         correct: true,  why: "Mandative subjunctive after 'it is imperative that': base form 'be' regardless of subject." },
      { text: 'is',         correct: false, why: "Wrong: 'is' is the indicative; mandative subjunctive requires the base form 'be'." },
      { text: 'was',        correct: false, why: "Wrong: past tense shifts the time frame; the base form 'be' covers present/future obligation." },
      { text: 'should be',  correct: false, why: "Acceptable in British English but the target C2 form is the base-form subjunctive 'be'." },
    ],
    explanation: "After 'it is imperative/essential/vital that', use the base-form subjunctive: 'be', 'go', 'submit'.",
  },
  {
    id: 34,
    category: 'Inversion',
    cefr: 'C2',
    prompt: "Little ___ that his decision would echo for decades.",
    options: [
      { text: 'did he realize',  correct: true,  why: "Fronted 'little' (negative adverb) forces inversion: auxiliary 'did' precedes subject 'he'." },
      { text: 'he realized',     correct: false, why: "Wrong: normal word order is ungrammatical after a fronted negative adverb." },
      { text: 'he did realize',  correct: false, why: "Wrong: emphatic 'did' with normal word order is not the inverted form required here." },
      { text: 'realized he',     correct: false, why: "Wrong: main-verb inversion (V-S) is not the correct pattern; auxiliary inversion 'did he realize' is needed." },
    ],
    explanation: "'Little', as a fronted negative adverb, triggers subject-auxiliary inversion.",
  },
  {
    id: 35,
    category: 'Cleft Sentences',
    cefr: 'C2',
    prompt: "___ he resigned so suddenly remains a mystery.",
    options: [
      { text: 'Why',     correct: true,  why: "Nominal wh-clause as subject: 'Why he resigned…' = the reason, functioning as the grammatical subject." },
      { text: 'Because', correct: false, why: "Wrong: 'because' introduces an adverbial clause, not a noun clause that can act as subject." },
      { text: 'That',    correct: false, why: "Wrong: 'That he resigned so suddenly remains a mystery' is grammatical but changes meaning (the fact itself, not the reason)." },
      { text: 'For why', correct: false, why: "Wrong: 'for why' is non-standard; 'why' alone is the correct interrogative to introduce the nominal clause." },
    ],
    explanation: "A wh-nominal clause ('Why he resigned…') can act as the subject of the sentence.",
  },
  {
    id: 36,
    category: 'Verb Tenses',
    cefr: 'C2',
    prompt: "By the time you read this, I ___ for three days.",
    options: [
      { text: 'will have been travelling', correct: true,  why: "Future perfect continuous: emphasises the duration of an action up to a future reference point." },
      { text: 'will travel',               correct: false, why: "Wrong: simple future says nothing about duration before the reference point." },
      { text: 'will have travelled',       correct: false, why: "Wrong: future perfect simple marks completion but does NOT emphasise the ongoing duration." },
      { text: 'am travelling',             correct: false, why: "Wrong: present continuous cannot express a state stretching to a future point." },
    ],
    explanation: "Future perfect continuous ('will have been + -ing') stresses duration up to a future moment.",
  },
  {
    id: 37,
    category: 'Subjunctive',
    cefr: 'C2',
    prompt: "He spoke to me as though nothing ___ happened.",
    options: [
      { text: 'had',        correct: true,  why: "'As though' + past perfect for an unreal past comparison: 'as though nothing had happened'." },
      { text: 'has',        correct: false, why: "Wrong: present perfect 'has happened' treats the comparison as real and current." },
      { text: 'would have', correct: false, why: "Wrong: 'would have happened' introduces a conditional nuance not implied by 'as though'." },
      { text: 'was',        correct: false, why: "Wrong: 'as though nothing was happened' is ungrammatical; past simple alone does not work with 'happened' here." },
    ],
    explanation: "'As if/as though' about an unreal past takes the past perfect: 'as though nothing had happened'.",
  },
  {
    id: 38,
    category: 'Mixed Conditionals',
    cefr: 'C2',
    prompt: "Had I been consulted, the outcome ___ different today.",
    options: [
      { text: 'might be',          correct: true,  why: "Inverted mixed conditional: past condition (had I been) + present result (might be) — 'today' anchors the result to the present." },
      { text: 'might have been',   correct: false, why: "Wrong: 'might have been' signals a past result; 'today' makes it a present result requiring 'might be'." },
      { text: 'may be',            correct: false, why: "Wrong: 'may be' expresses a real present possibility, not an unreal conditional result." },
      { text: 'would have been',   correct: false, why: "Wrong: 'would have been' is a purely past (third conditional) result, contradicted by 'today'." },
    ],
    explanation: "Inverted 'had + subject + past participle' with a present result uses 'might/would + base'.",
  },
  {
    id: 39,
    category: 'Past Modals of Deduction',
    cefr: 'C2',
    prompt: "The lights are off; they ___ already left.",
    options: [
      { text: 'must have',    correct: true,  why: "'Must have + past participle' = confident positive deduction about the past." },
      { text: 'must',         correct: false, why: "Wrong: 'must' alone is present obligation/deduction; 'have' is needed for the past participle." },
      { text: 'had to',       correct: false, why: "Wrong: 'had to' expresses past obligation, not a logical deduction." },
      { text: 'should have',  correct: false, why: "Wrong: 'should have left' implies they were expected to leave but perhaps didn't — criticism, not deduction." },
    ],
    explanation: "For a confident conclusion about the past, use 'must have + past participle'.",
  },
  {
    id: 40,
    category: 'Reporting Passive',
    cefr: 'C2',
    prompt: "It ___ that negotiations had already broken down.",
    options: [
      { text: 'was understood',   correct: true,  why: "Impersonal reporting passive: 'It was understood that…' reports information without naming a source." },
      { text: 'understood',       correct: false, why: "Wrong: active past simple 'understood' needs a subject; the impersonal passive requires 'It was understood'." },
      { text: 'was understanding', correct: false, why: "Wrong: past continuous passive is ungrammatical here; the stative 'understand' does not take continuous aspect." },
      { text: 'had understood',   correct: false, why: "Wrong: past perfect active requires an agent; the impersonal passive uses 'was understood'." },
    ],
    explanation: "'It was understood/believed/reported that…' reports information impersonally.",
  },
  {
    id: 41,
    category: 'Inversion',
    cefr: 'C2',
    prompt: "No sooner ___ the door than the phone rang.",
    options: [
      { text: 'had she closed',  correct: true,  why: "'No sooner' fronted forces past perfect inversion ('had she closed'), paired with 'than'." },
      { text: 'she had closed',  correct: false, why: "Wrong: normal word order after 'no sooner' is ungrammatical; the auxiliary 'had' must precede the subject." },
      { text: 'did she close',   correct: false, why: "Wrong: 'no sooner…than' takes past perfect inversion ('had she closed'), not past simple ('did she close')." },
      { text: 'she closed',      correct: false, why: "Wrong: simple past without inversion is ungrammatical after 'no sooner'." },
    ],
    explanation: "'No sooner had + subject + past participle … than …' expresses one event immediately following another.",
  },
  {
    id: 42,
    category: 'Subjunctive',
    cefr: 'C2',
    prompt: "I'd rather you ___ that to anyone.",
    options: [
      { text: "didn't mention",   correct: true,  why: "'Would rather + subject + past subjunctive' for present/future preference about another person's action." },
      { text: "don't mention",    correct: false, why: "Wrong: present simple does not function as past subjunctive after 'I'd rather' for another person." },
      { text: "wouldn't mention", correct: false, why: "Wrong: 'wouldn't' adds a conditional nuance not required here; the simple past subjunctive suffices." },
      { text: "not mention",      correct: false, why: "Wrong: 'not mention' (bare negative infinitive) is used after 'I'd rather' when the subject is the same person ('I'd rather not go'), not for another subject." },
    ],
    explanation: "'Would rather (that) someone + past form' expresses a preference about another person's action.",
  },
  {
    id: 43,
    category: 'Cleft Sentences',
    cefr: 'C2',
    prompt: "What the report failed to address ___ the funding gap.",
    options: [
      { text: 'was',       correct: true,  why: "Pseudo-cleft: the wh-nominal clause 'What the report failed to address' is treated as singular → 'was'." },
      { text: 'were',      correct: false, why: "Wrong: the wh-clause subject is grammatically singular even if it refers to plural content." },
      { text: 'are',       correct: false, why: "Wrong: present tense is inconsistent with the past context ('failed') and the singular wh-clause." },
      { text: 'have been', correct: false, why: "Wrong: present perfect is inconsistent with the simple past context and the singular wh-clause subject." },
    ],
    explanation: "Pseudo-clefts ('What X did was…') take a singular verb agreeing with the nominal wh-clause.",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Filter duel items by CEFR band and/or category.
 * If neither is provided, returns all items.
 *
 * @param {{ cefr?: string, category?: string }} opts
 * @returns {DuelItem[]}
 */
export function getDuelItems({ cefr, category } = {}) {
  return DUEL_ITEMS.filter((item) => {
    if (cefr && item.cefr !== cefr) return false
    if (category && item.category !== category) return false
    return true
  })
}

// ── Deterministic djb2 hash (mirrors challenges.js) ───────────────────────────

function djb2(str, seed = 5381) {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Returns a deterministic sequence of N duel items for the given date string.
 * Useful for a "Daily Duel" with a fixed set of questions per day.
 *
 * @param {string} dateStr  'YYYY-MM-DD'
 * @param {number} count    how many items to return (default 5)
 * @returns {DuelItem[]}
 */
export function getDailyDuelItems(dateStr, count = 5, pool = DUEL_ITEMS) {
  const len  = pool.length
  const seen = new Set()
  const result = []
  let seed = djb2(dateStr)
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

// ── Daily Duel localStorage helpers ──────────────────────────────────────────

const DUEL_KEY_PREFIX = 'linguo-duel-'

/** Returns the localStorage key for today's duel save. */
export function getDuelKey(dateStr) {
  return `${DUEL_KEY_PREFIX}${dateStr}`
}

/**
 * Load today's duel save.
 * @returns {{ answered: Record<number, boolean>, done: boolean } | null}
 */
export function loadDuelSave(dateStr) {
  try {
    const raw = localStorage.getItem(getDuelKey(dateStr))
    if (!raw) return null
    const d = JSON.parse(raw)
    if (typeof d === 'object' && d !== null) return d
  } catch (_) {}
  return null
}

/** Persist duel progress for today. */
export function saveDuelProgress(dateStr, data) {
  try {
    localStorage.setItem(getDuelKey(dateStr), JSON.stringify(data))
  } catch (_) {}
}

// ── Reward constants ─────────────────────────────────────────────────────────

/** XP awarded per correct answer. */
export const DUEL_XP_CORRECT  = 15
/** Coins awarded per correct answer. */
export const DUEL_COINS_CORRECT = 5
/** Bonus XP for completing a full duel session without any wrong answer. */
export const DUEL_XP_PERFECT_BONUS = 40
/** Bonus coins for a perfect session. */
export const DUEL_COINS_PERFECT_BONUS = 20
/** XP awarded per correct answer when on a ≥3 streak. */
export const DUEL_XP_STREAK_BONUS = 5
