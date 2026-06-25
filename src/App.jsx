import { useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { useSwipeGesture } from './hooks/useSwipeGesture.js'
import {
  initialGameState,
  LEVELS,
  COLORS,
  buildHiddenPhrase,
  freshGrid,
  movesBudgetFor,
  getTodayDateString,
  getDailyLevelIndex,
  getDailyKey,
  pickDecoyChar,
} from './data/gameData.js'
import { MAX_STRIKES, getDifficulty } from './data/difficulty.js'
import LevelTimer from './components/LevelTimer.jsx'
import { AnimatePresence, motion } from 'framer-motion'
import GameGrid from './components/GameGrid.jsx'
import PhraseBoard from './components/PhraseBoard.jsx'
import Header from './components/Header.jsx'
import RulesWidget from './components/RulesWidget.jsx'
import LevelComplete from './components/LevelComplete.jsx'
import LevelUpToast from './components/LevelUpToast.jsx'
import ChallengesPanel from './components/ChallengesPanel.jsx'
import Onboarding from './components/Onboarding.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'
import GrammarDuel from './components/GrammarDuel.jsx'
import SentenceBuilder from './components/SentenceBuilder.jsx'
import MasteryPanel from './components/MasteryPanel.jsx'
import { playSolve, playWrong, playHint, playCoin, playBig, isMuted, toggleMute } from './audio/sfx.js'
import { recordFail, recordWin, shouldAssist, getAssistance } from './data/dda.js'
import {
  getDailyChallenges,
  loadChallengeProgress,
  writeChallengeProgress,
} from './data/challenges.js'
import {
  loadProgression,
  writeProgression,
  xpFromChain,
  XP_SOLVE,
  XP_LEVEL_COMPLETE,
  playerLevelFromXP,
  levelProgress,
  computeDailyStreak,
} from './data/progression.js'
import { MAX_LIVES, loadLives, spendLife, hasInfiniteLives, getInfiniteRemainingMs } from './data/lives.js'
import { loadCakeEvent, recordCakeLevelComplete, CAKE_TARGET, CAKE_EVENT_LABEL } from './data/events.js'
import {
  loadCoins, addCoins, spendCoins,
  CHEST_COINS, COINS_PER_LEFTOVER_MOVE, CHALLENGE_COINS,
  HINT_COST, EXTRA_MOVES_COST,
} from './data/economy.js'
import { recordResult as recordMastery, dueCategories, recordDueReview } from './data/mastery.js'

const CHEST_XP = { gold: 150, silver: 75, bronze: 25 }
const MAX_HINTS = 2

// ─── localStorage helpers ─────────────────────────────────────────────────────────

const SAVE_KEY = 'linguo-save'

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (
      typeof data.level === 'number' &&
      typeof data.score === 'number' &&
      Array.isArray(data.completedLevelIds)
    ) return data
  } catch (_) {}
  return null
}

function writeSave(level, score, completedLevelIds) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ level, score, completedLevelIds }))
  } catch (_) {}
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch (_) {}
}

// ─── Daily localStorage helpers ───────────────────────────────────────────────

function loadDailySave(dateStr) {
  try {
    const raw = localStorage.getItem(getDailyKey(dateStr))
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data.score === 'number' && typeof data.moves === 'number') return data
  } catch (_) {}
  return null
}

function writeDailySave(dateStr, score, moves) {
  try {
    localStorage.setItem(getDailyKey(dateStr), JSON.stringify({ score, moves, completedAt: new Date().toISOString() }))
  } catch (_) {}
}

/**
 * Builds a hydrated initial state from a persisted save.
 * Reconstructs the correct level's grid/rule/hiddenPhrase from LEVELS.
 */
function buildStateFromSave(save) {
  try {
    const idx = Math.min(Math.max((save.level ?? 1) - 1, 0), LEVELS.length - 1)
    const level = LEVELS[idx]
    if (!level) return initialGameState // guard against bad level index
    const _fresh = freshGrid(level)
    return {
      ...initialGameState,
      currentLevel: level,
      grid: _fresh.grid,
      activeColor: _fresh.activeColor,
      hiddenPhrase: buildHiddenPhrase(level),
      level: idx + 1,
      movesLeft: movesBudgetFor(level),
      score: typeof save.score === 'number' ? save.score : 0,
      completedLevelIds: Array.isArray(save.completedLevelIds) ? save.completedLevelIds : [],
    }
  } catch (_) {
    return initialGameState // corrupt save — start fresh
  }
}

// ─── Action types ─────────────────────────────────────────────────────────────

const A = {
  REVEAL_CELL:    'REVEAL_CELL',
  DECOY_TAP:      'DECOY_TAP',
  TIME_UP:        'TIME_UP',
  ROTATE_DECOYS:  'ROTATE_DECOYS',
  SOLVE_ATTEMPT:  'SOLVE_ATTEMPT',
  USE_HINT:       'USE_HINT',
  ADVANCE_LEVEL:  'ADVANCE_LEVEL',
  REROLL_LEVEL:   'REROLL_LEVEL',
  RESET_GAME:     'RESET_GAME',
  CLEAR_FEEDBACK: 'CLEAR_FEEDBACK',
  ADD_MOVES:      'ADD_MOVES',
  APPLY_DDA:      'APPLY_DDA',
}

const MAX_REROLLS = 3

// ─── Normalise helpers ────────────────────────────────────────────────────────

/**
 * Collapses multiple spaces, converts curly quotes to straight, trim+lowercase.
 */
function normalizePhrase(str) {
  return str
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Reveals exactly the phrase slots whose index appears in phraseIndices.
 * Marks each newly revealed slot with isNew: true (cleared by CLEAR_FEEDBACK).
 */
function revealByIndices(hiddenPhrase, phraseIndices) {
  const idxSet = new Set(phraseIndices)
  const slots = hiddenPhrase.slots.map((slot) => {
    if (!slot.revealed && idxSet.has(slot.index)) {
      return { ...slot, revealed: true, isNew: true }
    }
    if (slot.isNew) {
      return { ...slot, isNew: false }
    }
    return slot
  })
  return { ...hiddenPhrase, slots }
}

/** Reveal ALL remaining slots (win via Solve button). */
function revealAll(hiddenPhrase) {
  const slots = hiddenPhrase.slots.map((slot) =>
    slot.revealed ? slot : { ...slot, revealed: true, isNew: true },
  )
  return { ...hiddenPhrase, slots }
}

function isLevelComplete(hiddenPhrase) {
  return hiddenPhrase.slots.every((s) => s.revealed)
}

function setGridCellsRevealed(grid, ids) {
  return grid.map((row) =>
    row.map((cell) =>
      ids.includes(cell.id) ? { ...cell, revealed: true } : cell,
    ),
  )
}

/**
 * Reveals one random unrevealed non-space slot, marking it fromHint: true.
 * Returns null if there is nothing to reveal.
 * Returns { hiddenPhrase, phraseIndex } so the reducer can sync the grid cell.
 */
function revealOneRandom(hiddenPhrase) {
  const unrevealed = hiddenPhrase.slots.filter(
    (s) => !s.revealed && s.char !== ' ',
  )
  if (unrevealed.length === 0) return null
  const chosen = unrevealed[Math.floor(Math.random() * unrevealed.length)]
  const slots = hiddenPhrase.slots.map((s) =>
    s.index === chosen.index
      ? { ...s, revealed: true, isNew: true, fromHint: true }
      : s.isNew ? { ...s, isNew: false } : s,
  )
  return { hiddenPhrase: { ...hiddenPhrase, slots }, phraseIndex: chosen.index }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state, action) {
  switch (action.type) {

    case A.REVEAL_CELL: {
      const { cell } = action

      // Anti-gap validation: compares phrase letters against UNREVEALED letter cells
      // (revealed + reconverted cells no longer have phraseIndex, so we exclude revealed).
      const phraseLetterCount = state.currentLevel.phrase.split('').filter((c) => c !== ' ').length
      const unrevealedLetterCount = state.grid.flat().filter(
        (c) => c.phraseIndex !== null && !c.revealed
      ).length
      // After this reveal, one more cell drops out — so compare against phraseLetterCount - already revealed
      const alreadyRevealed = state.hiddenPhrase.slots.filter((s) => s.revealed && s.char !== ' ').length
      if (unrevealedLetterCount + alreadyRevealed !== phraseLetterCount) {
        console.warn(
          `[Linguo] Gap mismatch on level ${state.currentLevel.id}: ` +
          `phrase has ${phraseLetterCount} letters but grid accounts for only ` +
          `${unrevealedLetterCount + alreadyRevealed}.`,
        )
      }

      // Reveal the letter in hiddenPhrase (win condition — always progresses)
      const newHiddenPhrase = cell.phraseIndex !== null
        ? revealByIndices(state.hiddenPhrase, [cell.phraseIndex])
        : state.hiddenPhrase
      const newStreak  = state.streak + 1
      const multiplier = Math.min(1 + (newStreak - 1) * 0.5, 5)
      const earned     = Math.round(100 * multiplier)
      const levelComplete = isLevelComplete(newHiddenPhrase)

      // Always reconvert the just-revealed cell into a decoy so the grid stays
      // fully dense. Skip only when this tap completed the level (game won —
      // revealed:true for the final cell is fine, level ends immediately).
      let newGrid
      if (!levelComplete) {
        const revealedChar = (cell.letter ?? '').toUpperCase()
        const newDecoyChar = pickDecoyChar(state.currentLevel.phrase, revealedChar)
        const decoyColor   = COLORS.filter((c) => c !== state.activeColor)[0]
        newGrid = state.grid.map((row) =>
          row.map((c) => {
            if (c.id !== cell.id) return c
            return {
              ...c,
              revealed:    false,
              isDecoy:     true,
              letter:      newDecoyChar,
              decoyChar:   newDecoyChar,
              phraseIndex: null,
              color:       decoyColor,
            }
          })
        )
      } else {
        newGrid = setGridCellsRevealed(state.grid, [cell.id])
      }

      return {
        ...state,
        grid: newGrid,
        hiddenPhrase: newHiddenPhrase,
        moves: state.moves + 1,
        movesLeft: Math.max(0, state.movesLeft - 1),
        streak: newStreak,
        score: state.score + earned,
        levelComplete,
        lastFeedback: { type: 'reveal-correct', earned },
      }
    }

    case A.DECOY_TAP: {
      const newStrikes = state.strikes + 1
      return {
        ...state,
        strikes: newStrikes,
        streak: 0,
        lastFeedback: { type: 'decoy-wrong', strikes: newStrikes },
      }
    }

    case A.TIME_UP: {
      return {
        ...state,
        streak: 0,
        lastFeedback: { type: 'time-up' },
      }
    }

    case A.ROTATE_DECOYS: {
      const flat = state.grid.flat()
      const decoys = flat.filter((c) => c.isDecoy && !c.revealed)
      if (decoys.length < 2) return state
      const s0 = (action.seed >>> 0)
      const s1 = (Math.imul(1664525, s0) + 1013904223) >>> 0
      const s2 = (Math.imul(1664525, s1) + 1013904223) >>> 0
      const idxA = s1 % decoys.length
      let idxB = s2 % decoys.length
      if (idxB === idxA) idxB = (idxA + 1) % decoys.length
      const cellA = decoys[idxA]
      const cellB = decoys[idxB]
      const newGrid = state.grid.map((row) =>
        row.map((cell) => {
          if (cell.id === cellA.id) return { ...cell, letter: cellB.letter, decoyChar: cellB.decoyChar }
          if (cell.id === cellB.id) return { ...cell, letter: cellA.letter, decoyChar: cellA.decoyChar }
          return cell
        })
      )
      return { ...state, grid: newGrid }
    }

    case A.SOLVE_ATTEMPT: {
      const { guess } = action
      const match = normalizePhrase(guess) === normalizePhrase(state.currentLevel.phrase)

      if (match) {
        const newHiddenPhrase = revealAll(state.hiddenPhrase)
        return {
          ...state,
          hiddenPhrase: newHiddenPhrase,
          score: state.score + 500,
          streak: state.streak + 1,
          levelComplete: true,
          solvedByButton: true,
          lastFeedback: { type: 'solve-correct' },
        }
      }

      // Wrong guess: break streak and increment wrongSolveCount (forces bronze chest).
      // Do NOT subtract movesLeft — the tap budget must stay intact so the player
      // can still complete the level by tapping even after a failed solve attempt.
      return {
        ...state,
        streak: 0,
        wrongSolveCount: state.wrongSolveCount + 1,
        lastFeedback: { type: 'solve-wrong', wrongCount: state.wrongSolveCount + 1 },
      }
    }

    case A.USE_HINT: {
      if (state.hintsUsedThisLevel >= MAX_HINTS) return state
      const revealed = revealOneRandom(state.hiddenPhrase)
      if (!revealed) return state
      const { hiddenPhrase: newHiddenPhrase, phraseIndex } = revealed
      const levelComplete = isLevelComplete(newHiddenPhrase)

      // Sync the grid: find the cell that holds this phraseIndex and either
      // reconvert it to a decoy (grid stays full) or mark it revealed (level won).
      const hintedCell = state.grid.flat().find((c) => c.phraseIndex === phraseIndex)
      let newGrid = state.grid
      if (hintedCell) {
        if (!levelComplete) {
          const newDecoyChar  = pickDecoyChar(state.currentLevel.phrase, (hintedCell.letter ?? '').toUpperCase())
          const hintDecoyColor = COLORS.filter((c) => c !== state.activeColor)[0]
          newGrid = state.grid.map((row) =>
            row.map((c) =>
              c.id !== hintedCell.id ? c : {
                ...c,
                revealed:    false,
                isDecoy:     true,
                letter:      newDecoyChar,
                decoyChar:   newDecoyChar,
                phraseIndex: null,
                color:       hintDecoyColor,
              }
            )
          )
        } else {
          newGrid = setGridCellsRevealed(state.grid, [hintedCell.id])
        }
      }

      return {
        ...state,
        grid: newGrid,
        hiddenPhrase: newHiddenPhrase,
        streak: 0,
        hintsUsedThisLevel: state.hintsUsedThisLevel + 1,
        lastHintMove: state.moves,
        levelComplete,
        lastFeedback: { type: 'hint-used' },
      }
    }

    case A.CLEAR_FEEDBACK: {
      return { ...state, lastFeedback: null }
    }

    case A.ADD_MOVES: {
      const extra = action.amount ?? 5
      return {
        ...state,
        movesLeft: state.movesLeft + extra,
        lastFeedback: { type: 'moves-added', amount: extra },
      }
    }

    case A.APPLY_DDA: {
      const { extraMoves = 0, revealCount = 0 } = action
      let hp = state.hiddenPhrase
      for (let i = 0; i < revealCount; i++) {
        const unrevealed = hp.slots.filter((s) => !s.revealed && s.char !== ' ')
        if (unrevealed.length === 0) break
        const chosen = unrevealed[Math.floor(Math.random() * unrevealed.length)]
        hp = {
          ...hp,
          slots: hp.slots.map((s) =>
            s.index === chosen.index ? { ...s, revealed: true, isNew: false } : s
          ),
        }
      }
      let newGrid = state.grid
      if (revealCount > 0) {
        const revealedIndices = new Set(
          hp.slots.filter((s) => s.revealed && s.char !== ' ').map((s) => s.index)
        )
        const prevRevealedIndices = new Set(
          state.hiddenPhrase.slots.filter((s) => s.revealed && s.char !== ' ').map((s) => s.index)
        )
        const newlyRevealed = [...revealedIndices].filter((i) => !prevRevealedIndices.has(i))
        if (newlyRevealed.length > 0) {
          const nonActiveColor = COLORS.filter((c) => c !== state.activeColor)[0]
          newGrid = state.grid.map((row) =>
            row.map((cell) => {
              if (cell.phraseIndex !== null && newlyRevealed.includes(cell.phraseIndex)) {
                const decoyChar = pickDecoyChar(state.currentLevel.phrase, (cell.letter ?? '').toUpperCase())
                return { ...cell, isDecoy: true, phraseIndex: null, letter: decoyChar, decoyChar, color: nonActiveColor, revealed: false }
              }
              return cell
            })
          )
        }
      }
      return {
        ...state,
        movesLeft: state.movesLeft + extraMoves,
        hiddenPhrase: hp,
        grid: newGrid,
      }
    }

    case A.ADVANCE_LEVEL: {
      const nextIndex = state.level
      if (nextIndex >= LEVELS.length) {
        return { ...state, gameComplete: true, levelComplete: false }
      }
      const nextLevel = LEVELS[nextIndex]
      const _nextFresh = freshGrid(nextLevel)
      return {
        ...state,
        currentLevel: nextLevel,
        grid: _nextFresh.grid,
        activeColor: _nextFresh.activeColor,
        hiddenPhrase: buildHiddenPhrase(nextLevel),
        level: state.level + 1,
        movesLeft: movesBudgetFor(nextLevel),
        streak: 0,
        strikes: 0,
        lastHintMove: -4,
        hintsUsedThisLevel: 0,
        levelComplete: false,
        lastFeedback: null,
        solvedByButton: false,
        wrongSolveCount: 0,
        rerollsUsed: 0,
      }
    }

    case A.REROLL_LEVEL: {
      if (state.rerollsUsed >= MAX_REROLLS) return state
      const completedIds = action.completedLevelIds ?? []
      const candidates = LEVELS.filter(
        (l) => l.id !== state.currentLevel.id && !completedIds.includes(l.id),
      )
      if (candidates.length === 0) return state
      const next = candidates[Math.floor(Math.random() * candidates.length)]
      const _rerollFresh = freshGrid(next)
      return {
        ...state,
        currentLevel: next,
        grid: _rerollFresh.grid,
        activeColor: _rerollFresh.activeColor,
        hiddenPhrase: buildHiddenPhrase(next),
        movesLeft: movesBudgetFor(next),
        streak: 0,
        lastHintMove: -4,
        hintsUsedThisLevel: 0,
        levelComplete: false,
        lastFeedback: { type: 'reroll' },
        solvedByButton: false,
        wrongSolveCount: 0,
        strikes: 0,
        rerollsUsed: state.rerollsUsed + 1,
      }
    }

    case A.RESET_GAME: {
      return { ...initialGameState }
    }

    default:
      return state
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Onboarding (declared first so it’s always called, never conditional) ──
  const [onboardingDone, setOnboardingDone] = useState(
    () => !!localStorage.getItem('linguo-onboarding-done')
  )

  // ── Mute (controlled so Header receives a prop) ──
  const [mutedState, setMutedState] = useState(() => isMuted())
  const handleToggleMute = useCallback(() => {
    toggleMute()
    setMutedState(isMuted())
  }, [])

  const handleShowTutorial = useCallback(() => {
    localStorage.removeItem('linguo-onboarding-done')
    setOnboardingDone(false)
  }, [])

  // ── Progression ──
  const [progression, setProgression] = useState(() => loadProgression())
  const [levelUpShow, setLevelUpShow] = useState(false)
  const [levelUpTarget, setLevelUpTarget] = useState(1)

  // ── Daily mode base values (needed before challenge state) ──
  const todayStr   = getTodayDateString()
  const dailyIdx   = getDailyLevelIndex(todayStr)
  const dailyLevel = LEVELS[dailyIdx]
  const dayNumber  = Math.floor((Date.now() - new Date('2025-01-01').getTime()) / 86_400_000) + 1

  /** Award XP, detect level-up, persist. */
  const grantXP = useCallback((amount) => {
    setProgression((prev) => {
      const newXP    = prev.totalXP + amount
      const newLevel = playerLevelFromXP(newXP)
      const didLevel = newLevel > prev.playerLevel
      const next = {
        ...prev,
        totalXP:     newXP,
        playerLevel: newLevel,
      }
      writeProgression(next)
      if (didLevel) {
        setLevelUpTarget(newLevel)
        setLevelUpShow(true)
      }
      return next
    })
  }, [])

  // ── Coins (must precede trackChallenge which uses earnCoinsRef) ──
  const [coins, setCoins] = useState(() => loadCoins())
  const earnCoins = useCallback((n) => { setCoins(addCoins(n)) }, [])
  const earnCoinsRef = useRef(earnCoins)
  useEffect(() => { earnCoinsRef.current = earnCoins }, [earnCoins])

  // ── Daily challenges ──
  const dailyChallenges = getDailyChallenges(todayStr)
  const [challengeProgress, setChallengeProgress] = useState(
    () => loadChallengeProgress(todayStr)
  )
  const [completedChallenges, setCompletedChallenges] = useState(
    () => new Set(
      getDailyChallenges(todayStr)
        .filter((ch) => {
          const prog = loadChallengeProgress(todayStr)
          return (prog[ch.id] ?? 0) >= ch.target
        })
        .map((ch) => ch.id)
    )
  )
  const [challengePanelOpen, setChallengePanelOpen] = useState(false)
  const [challengeToast, setChallengeToast]         = useState(null) // challenge label string

  /**
   * Increment a challenge counter by delta (default 1).
   * If newly completed, grant XP and show toast.
   */
  const trackChallenge = useCallback((type, delta = 1, predicate = true) => {
    if (!predicate) return
    const ch = getDailyChallenges(todayStr).find((c) => c.type === type)
    if (!ch) return
    setChallengeProgress((prev) => {
      const current = prev[ch.id] ?? 0
      if (current >= ch.target) return prev // already done
      const next = { ...prev, [ch.id]: Math.min(current + delta, ch.target) }
      writeChallengeProgress(todayStr, next)
      if (next[ch.id] >= ch.target) {
        setCompletedChallenges((s) => new Set([...s, ch.id]))
        grantXP(ch.xpReward)
        earnCoinsRef.current(CHALLENGE_COINS)
        setChallengeToast(ch.label)
        setTimeout(() => setChallengeToast(null), 3000)
      }
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, grantXP])

  // ── Duel mode ──
  const [duelMode, setDuelMode] = useState(false)
  const handleToggleDuel = useCallback(() => setDuelMode((d) => !d), [])
  const handleDuelWin = useCallback(() => {
    trackChallenge('duel-wins', 1)
  }, [trackChallenge])

  // ── Builder mode ──
  const [builderMode, setBuilderMode] = useState(false)
  const handleToggleBuilder = useCallback(() => setBuilderMode((b) => !b), [])
  const handleBuilderSolve = useCallback(() => {
    trackChallenge('builder-solves', 1)
  }, [trackChallenge])

  // ── Mastery panel ──
  const [masteryPanelOpen, setMasteryPanelOpen] = useState(false)

  // Called by Duel/Builder when player answers a due category
  const handleReviewDue = useCallback(() => {
    trackChallenge('review-due', 1)
  }, [trackChallenge])

  // ── Daily mode ──

  const [dailyMode, setDailyMode] = useState(false)
  const [dailySave, setDailySave] = useState(() => loadDailySave(todayStr))
  const [dailyState, dispatchDaily] = useReducer(
    gameReducer,
    initialGameState,
    () => {
      const _dailyFresh = freshGrid(dailyLevel)
      return {
        ...initialGameState,
        currentLevel: dailyLevel,
        grid: _dailyFresh.grid,
        activeColor: _dailyFresh.activeColor,
        hiddenPhrase: buildHiddenPhrase(dailyLevel),
        movesLeft: movesBudgetFor(dailyLevel),
        strikes: 0,
      }
    },
  )

  // ── Daily streak on mount ──
  useEffect(() => {
    try {
      const { newStreak, isNewDay } = computeDailyStreak(progression.lastPlayedDate, todayStr)
      if (!isNewDay) return
      setProgression((prev) => {
        try {
          const count = newStreak === 'increment' ? prev.dailyStreakCount + 1 : (newStreak ?? 1)
          const next = { ...prev, dailyStreakCount: count, lastPlayedDate: todayStr }
          writeProgression(next)
          return next
        } catch (_) {
          return prev // don't crash the state updater
        }
      })
    } catch (_) {
      // Corrupt progression data — silently ignore, game remains playable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  // ── Normal mode ──
  const [state, dispatch] = useReducer(
    gameReducer,
    initialGameState,
    (base) => {
      const save = loadSave()
      return save ? buildStateFromSave(save) : base
    },
  )
  const feedbackTimerRef = useRef(null)
  const mainRef = useRef(null)
  // must be declared before handleReroll which reads completedLevelIdsRef.current
  const completedLevelIdsRef = useRef(state.completedLevelIds ?? [])

  // ── Swipe tip (one-time, localStorage-gated) ──
  const SWIPE_TIP_KEY = 'linguo-swipe-tip-seen'
  const [showSwipeTip, setShowSwipeTip] = useState(
    () => !localStorage.getItem(SWIPE_TIP_KEY)
  )
  useEffect(() => {
    if (!showSwipeTip) return
    localStorage.setItem(SWIPE_TIP_KEY, '1')
    const t = setTimeout(() => setShowSwipeTip(false), 3000)
    return () => clearTimeout(t)
  }, [showSwipeTip])

  // Route dispatches + state to the active mode
  const activeState    = dailyMode ? dailyState    : state
  const activeDispatch = dailyMode ? dispatchDaily : dispatch

  // Destructure activeState immediately so all useEffects and handlers below
  // can reference these variables without TDZ in production minified builds.
  const {
    grid,
    hiddenPhrase,
    score,
    moves,
    movesLeft,
    streak,
    level,
    currentLevel,
    levelComplete,
    gameComplete,
    lastFeedback,
    lastHintMove,
    hintsUsedThisLevel,
    solvedByButton,
    wrongSolveCount,
    rerollsUsed,
    strikes,
    activeColor,
  } = activeState

  // Chest tier snapshot refs — declared here so the levelComplete useEffect below can write to them
  const chestTypeRef    = useRef('bronze')
  const chestXPRef      = useRef(CHEST_XP.bronze)
  const timeExpiredRef  = useRef(false)

  // ── Cake o'clock event ──
  const [cakeEvent, setCakeEvent] = useState(() => loadCakeEvent(todayStr))
  const [eventToast, setEventToast] = useState(null)
  const buyWithCoins = useCallback((n) => {
    const ok = spendCoins(n)
    if (ok) setCoins(loadCoins())
    return ok
  }, [])

  // ── Lives ──
  const [livesState, setLivesState] = useState(() => loadLives())

  // Tick every second — recalculates regen, refreshes countdown + infinite timer
  useEffect(() => {
    const id = setInterval(() => setLivesState(loadLives()), 1000)
    return () => clearInterval(id)
  }, [])

  const isGameOver = (movesLeft === 0 || strikes >= MAX_STRIKES) && !levelComplete

  const { lives, nextLifeMs, infiniteRemainingMs = 0 } = livesState
  const infiniteActive = infiniteRemainingMs > 0

  // Auto-clear non-critical feedback after 2.5 s
  useEffect(() => {
    const fb = activeState.lastFeedback
    if (!fb) return
    if (fb.type === 'solve-wrong') return
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      activeDispatch({ type: A.CLEAR_FEEDBACK })
    }, 2500)
    return () => clearTimeout(feedbackTimerRef.current)
  }, [activeState.lastFeedback, activeDispatch])

  const handleTimerExpire = useCallback(() => {
    timeExpiredRef.current = true
    activeDispatch({ type: A.TIME_UP })
  }, [activeDispatch])

  // ── Decoy rotation for C1/C2 ─────────────────────────────────────────────
  useEffect(() => {
    const rotateSeconds = getDifficulty(currentLevel.cefr).decoyRotateSeconds
    if (!rotateSeconds) return
    if (levelComplete || isGameOver) return
    const id = setInterval(() => {
      activeDispatch({ type: A.ROTATE_DECOYS, seed: Date.now() })
    }, rotateSeconds * 1000)
    return () => clearInterval(id)
  // currentLevel.id ensures the interval is reset on every new level
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel.id, currentLevel.cefr, levelComplete, isGameOver, activeDispatch])

  function handleDecoyTap(cell) {
    activeDispatch({ type: A.DECOY_TAP, cell })
  }

  function handleCellReveal(cell) {
    const newStreak = activeState.streak + 1
    const xp = xpFromChain(Math.round(100 * Math.min(1 + (newStreak - 1) * 0.5, 5)))
    activeDispatch({ type: A.REVEAL_CELL, cell })
    if (xp > 0) grantXP(xp)
    trackChallenge('reveals')
    const s3Target = dailyChallenges.find((c) => c.type === 'streak3')?.target
    if (s3Target && newStreak === s3Target) trackChallenge('streak3')
  }
  function handleSolveAttempt(guess) {
    const match = normalizePhrase(guess) === normalizePhrase(activeState.currentLevel.phrase)
    // Was the board already fully revealed by chains alone before this Solve?
    const notYetComplete = !activeState.hiddenPhrase.slots
      .filter((s) => s.char !== ' ')
      .every((s) => s.revealed)
    activeDispatch({ type: A.SOLVE_ATTEMPT, guess })
    if (match) {
      playSolve()
      grantXP(XP_SOLVE)
      // Challenge: solve-early — only counts if board was NOT already complete
      trackChallenge('solve-early', 1, notYetComplete)
    } else {
      playWrong()
    }
  }
  function handleUseHint() { playHint(); activeDispatch({ type: A.USE_HINT }) }
  function handleBuyHint() {
    if (buyWithCoins(HINT_COST)) { playHint(); activeDispatch({ type: A.USE_HINT }) }
  }

  function handleBuyMoves() {
    if (buyWithCoins(EXTRA_MOVES_COST)) {
      activeDispatch({ type: A.ADD_MOVES, amount: 5 })
    }
  }

  function handleSurrender() {
    if (!dailyMode) {
      setLivesState(spendLife())
      recordFail(currentLevel.id)
      const assist = getAssistance(currentLevel.id)
      dispatch({ type: A.RESET_GAME })
      if (shouldAssist(currentLevel.id)) {
        dispatch({ type: A.APPLY_DDA, extraMoves: assist.extraMoves, revealCount: assist.revealCount })
      }
    } else {
      setDailyMode(false)
    }
  }

  function handleReroll() {
    activeDispatch({ type: A.REROLL_LEVEL, completedLevelIds: completedLevelIdsRef.current ?? [] })
  }

  const wrongGuessCount = activeState.lastFeedback?.type === 'solve-wrong'
    ? activeState.lastFeedback.wrongCount
    : 0

  // ── Persist daily result when daily level completes ──
  useEffect(() => {
    if (dailyMode && dailyState.levelComplete && !dailySave) {
      writeDailySave(todayStr, dailyState.score, dailyState.moves)
      setDailySave({ score: dailyState.score, moves: dailyState.moves })
    }
  }, [dailyMode, dailyState.levelComplete, dailyState.score, dailyState.moves, dailySave, todayStr])

  // ── Grant XP + compute chest + track challenges when a level completes ──
  // Guard key encodes mode + level id so toggling dailyMode with a completed
  // level on screen can never re-trigger grants for the same level.
  const lastRewardedRef = useRef(null)

  // Reset the guard when the actual level changes (new level started).
  // This runs on ADVANCE_LEVEL and RESET_GAME outcomes (currentLevel.id changes).
  useEffect(() => {
    lastRewardedRef.current = null
    timeExpiredRef.current  = false
  }, [currentLevel.id])

  useEffect(() => {
    const rewardKey = `${dailyMode ? 'daily' : 'normal'}-${currentLevel.id}`
    if (levelComplete && lastRewardedRef.current !== rewardKey) {
      lastRewardedRef.current = rewardKey

      // Determine chest tier
      // Gold:   tapped to completion (no Solve button), zero decoy strikes, zero hints, timer not expired
      // Silver: tapped to completion, at most 1 strike OR at most 1 hint, timer not expired
      // Bronze: everything else — timer expired, solved by button, 2+ strikes, 2+ hints
      let chest
      if (timeExpiredRef.current || solvedByButton) {
        chest = 'bronze'
      } else if (strikes === 0 && hintsUsedThisLevel === 0) {
        chest = 'gold'
      } else if (strikes <= 1 && hintsUsedThisLevel <= 1) {
        chest = 'silver'
      } else {
        chest = 'bronze'
      }
      chestTypeRef.current = chest
      chestXPRef.current   = CHEST_XP[chest]

      grantXP(XP_LEVEL_COMPLETE)
      grantXP(CHEST_XP[chest])

      // ── Award Lingots ──
      const tierCoins    = CHEST_COINS[chest] ?? 0
      const bonusCoins   = movesLeft * COINS_PER_LEFTOVER_MOVE
      earnCoins(tierCoins + bonusCoins)
      playBig()
      playCoin()

      // ── DDA: record win (non-daily only) ──
      if (!dailyMode) recordWin(currentLevel.id)

      // ── Cake o'clock event (non-daily only) ──
      if (!dailyMode) {
        const result = recordCakeLevelComplete(todayStr)
        setCakeEvent({ progress: result.progress, granted: result.granted })
        if (result.justGranted) {
          setLivesState(loadLives()) // pick up new infiniteUntil
          setEventToast(CAKE_EVENT_LABEL)
          setTimeout(() => setEventToast(null), 4000)
        }
      }

      // Mastery: record level result by category
      if (currentLevel.category) {
        const wasDue = dueCategories().includes(currentLevel.category)
        recordMastery(currentLevel.category, true)
        if (wasDue) {
          recordDueReview(todayStr, currentLevel.category)
          trackChallenge('review-due', 1)
        }
      }

      // Challenge: no-hints
      if (hintsUsedThisLevel === 0) trackChallenge('no-hints')
      // Challenge: perfect-moves
      const pmTarget = getDailyChallenges(todayStr).find((c) => c.type === 'perfect-moves')?.target
      if (pmTarget && moves <= pmTarget) trackChallenge('perfect-moves')
    }
  // dailyMode is intentionally included so the key captures mode switches.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelComplete, dailyMode, grantXP])

  // ── Persist to localStorage (normal mode only) ──
  useEffect(() => {
    if (dailyMode) return
    if (state.levelComplete) {
      const prev = completedLevelIdsRef.current ?? []
      if (!prev.includes(state.currentLevel.id)) {
        completedLevelIdsRef.current = [...prev, state.currentLevel.id]
      }
    }
    writeSave(state.level, state.score, completedLevelIdsRef.current ?? [])
  }, [dailyMode, state.level, state.score, state.levelComplete, state.currentLevel.id])

  function handleResetProgress() {
    if (!window.confirm('Reset all progress? This cannot be undone.')) return
    clearSave()
    completedLevelIdsRef.current = []
    dispatch({ type: A.RESET_GAME })
  }

  // ── Derived values for Header / RulesWidget ──
  const totalSlots = hiddenPhrase.slots.filter((s) => s.char !== ' ').length
  const revealedSlots = hiddenPhrase.slots.filter((s) => s.revealed && s.char !== ' ').length
  const progress = totalSlots > 0 ? revealedSlots / totalSlots : 0

  // Hint availability: >=1 unrevealed letter, cooldown met, hints remaining.
  // No softlock risk: RESET_GAME restores initialGameState (moves=0, lastHintMove=-4,
  // so 0-(-4)=4 ≥ 4 immediately). ADVANCE_LEVEL also resets both to 0 / -4.
  const unrevealedCount = hiddenPhrase.slots.filter((s) => !s.revealed && s.char !== ' ').length
  const hintsLeft = MAX_HINTS - hintsUsedThisLevel
  const hintAvailable =
    unrevealedCount >= 1 &&
    moves - lastHintMove >= 4 &&
    hintsLeft > 0

  // ── Swipe gesture wiring (after hintAvailable is derived) ──
  useSwipeGesture(mainRef, {
    onSwipeLeft:  () => setChallengePanelOpen(true),
    onSwipeRight: () => setChallengePanelOpen(false),
    onSwipeUp:    () => { if (hintAvailable) handleUseHint() },
  })

  if (!onboardingDone) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem('linguo-onboarding-done', '1')
          setOnboardingDone(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-linguo-smokyBlack text-linguo-fantasy flex flex-col items-center justify-start">

      {/* ── Fixed Header ── */}
      <Header
        score={score}
        movesLeft={movesLeft}
        level={level}
        totalLevels={LEVELS.length}
        progress={progress}
        onResetProgress={handleResetProgress}
        dailyMode={dailyMode}
        onToggleDaily={() => setDailyMode((m) => !m)}
        duelMode={duelMode}
        onToggleDuel={handleToggleDuel}
        builderMode={builderMode}
        onToggleBuilder={handleToggleBuilder}
        playerLevel={progression.playerLevel}
        playerProgress={levelProgress(progression.totalXP)}
        dailyStreakCount={progression.dailyStreakCount}
        challengesOpen={challengePanelOpen}
        onToggleChallenges={() => setChallengePanelOpen((o) => !o)}
        completedChallengesCount={completedChallenges.size}
        lives={lives}
        maxLives={MAX_LIVES}
        nextLifeMs={nextLifeMs}
        coins={coins}
        isMuted={mutedState}
        onToggleMute={handleToggleMute}
        onShowTutorial={handleShowTutorial}
        onShowMastery={() => setMasteryPanelOpen(true)}
        infiniteRemainingMs={infiniteRemainingMs}
        strikes={strikes}
        maxStrikes={MAX_STRIKES}
      />

      {/* ── Level-up toast ── */}
      <LevelUpToast
        show={levelUpShow}
        playerLevel={levelUpTarget}
        onDone={() => setLevelUpShow(false)}
      />

      {/* ── Challenge-complete toast ── */}
      <AnimatePresence>
        {challengeToast && (
          <motion.div
            key={challengeToast}
            className="fixed top-14 left-1/2 z-[60] flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-2xl shadow-black/60 pointer-events-none select-none"
            style={{ background: 'linear-gradient(135deg, #00917A, #40B8A6)', x: '-50%' }}
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
          >
            <span className="text-xl leading-none">🎯</span>
            <span className="font-black tracking-wide text-sm" style={{ color: '#100F06' }}>
              Challenge complete!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cake o'clock event toast ── */}
      <AnimatePresence>
        {eventToast && (
          <motion.div
            key="cake-toast"
            className="fixed top-14 left-1/2 z-[60] flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-2xl shadow-black/60 pointer-events-none select-none"
            style={{ background: 'linear-gradient(135deg, #FFDA57, #F5C200)', x: '-50%' }}
            initial={{ opacity: 0, y: -20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
          >
            <span className="text-xl leading-none">🎂</span>
            <span className="font-black tracking-wide text-sm" style={{ color: '#100F06' }}>
              Unlimited lives — 15 min!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Infinite lives banner (persistent countdown) ── */}
      <AnimatePresence>
        {infiniteActive && (
          <motion.div
            className="fixed top-14 left-1/2 z-[35] flex items-center gap-2 px-4 py-1.5 rounded-b-xl pointer-events-none select-none"
            style={{ background: 'linear-gradient(135deg,#FFDA57cc,#F5C200cc)', backdropFilter: 'blur(6px)', x: '-50%' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm leading-none">♥️∞</span>
            <span className="font-black text-xs tracking-wide" style={{ color: '#100F06' }}>
              Unlimited lives: 
              {String(Math.floor(infiniteRemainingMs / 60000)).padStart(2, '0')}
              :{String(Math.floor((infiniteRemainingMs % 60000) / 1000)).padStart(2, '0')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Challenges panel ── */}
      <ChallengesPanel
        open={challengePanelOpen}
        onClose={() => setChallengePanelOpen(false)}
        challenges={dailyChallenges}
        progress={challengeProgress}
        completed={completedChallenges}
        cakeProgress={cakeEvent.progress}
        cakeGranted={cakeEvent.granted}
        infiniteRemainingMs={infiniteRemainingMs}
      />

      {/* ── Out-of-lives modal (suppressed during infinite lives) ── */}
      <AnimatePresence>
        {lives === 0 && isGameOver && !dailyMode && !infiniteActive && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-linguo-smokyBlack/97 backdrop-blur-sm px-6 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center gap-5"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.05 }}
            >
              <span className="text-6xl select-none">💔</span>
              <h2 className="font-black text-3xl bg-gradient-to-r from-linguo-lightCoral to-linguo-blossomPink bg-clip-text text-transparent">
                Out of lives!
              </h2>
              <p className="text-linguo-fantasy/60 text-sm max-w-xs">
                You&rsquo;ve used all your lives. A new heart arrives in:
              </p>
              <div className="px-6 py-3 rounded-2xl bg-linguo-lightCoral/10 border border-linguo-lightCoral/30">
                <p className="text-linguo-lightCoral font-black text-2xl tabular-nums">
                  {nextLifeMs > 0
                    ? `${String(Math.floor(nextLifeMs / 60000)).padStart(2, '0')}:${String(Math.floor((nextLifeMs % 60000) / 1000)).padStart(2, '0')}`
                    : 'Recharging…'}
                </p>
              </div>
              <p className="text-linguo-fantasy/30 text-xs">Come back soon ❤️</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed Rules Widget ── */}
      {!gameComplete && !levelComplete && (
        <RulesWidget
          streak={streak}
          hintAvailable={hintAvailable}
          hintsLeft={hintsLeft}
          hint={currentLevel.hint}
          source={currentLevel.source}
          grammarExplanation={currentLevel.grammarExplanation}
          onUseHint={handleUseHint}
          onBuyHint={handleBuyHint}
          coins={coins}
          hintCost={HINT_COST}
          cefr={currentLevel.cefr}
          category={currentLevel.category}
          activeColor={activeColor}
        />
      )}

      {/* ── Grammar Duel overlay ── */}
      <AnimatePresence>
        {duelMode && (
          <GrammarDuel
            key="grammar-duel"
            onClose={() => setDuelMode(false)}
            onGrantXP={grantXP}
            onEarnCoins={earnCoins}
            onDuelWin={handleDuelWin}
            onReviewDue={handleReviewDue}
          />
        )}
      </AnimatePresence>

      {/* ── Sentence Builder overlay ── */}
      <AnimatePresence>
        {builderMode && (
          <SentenceBuilder
            key="sentence-builder"
            onClose={() => setBuilderMode(false)}
            onGrantXP={grantXP}
            onEarnCoins={earnCoins}
            onBuilderSolve={handleBuilderSolve}
            onReviewDue={handleReviewDue}
          />
        )}
      </AnimatePresence>

      {/* ── Mastery panel ── */}
      <MasteryPanel
        open={masteryPanelOpen}
        onClose={() => setMasteryPanelOpen(false)}
      />

      {/* ── Level complete overlay ── */}
      <AnimatePresence>
        {levelComplete && (
          <LevelComplete
            phrase={currentLevel.phrase}
            hint={currentLevel.hint}
            source={currentLevel.source}
            grammarExplanation={currentLevel.grammarExplanation}
            category={currentLevel.category}
            cefr={currentLevel.cefr}
            isLastLevel={!dailyMode && level >= LEVELS.length}
            isDaily={dailyMode}
            dayNumber={dayNumber}
            moves={moves}
            score={score}
            chestType={chestTypeRef.current}
            chestXP={chestXPRef.current}
            onAdvance={() => {
              if (dailyMode) { setDailyMode(false); return }
              if (level >= LEVELS.length) {
                dispatch({ type: A.RESET_GAME })
              } else {
                dispatch({ type: A.ADVANCE_LEVEL })
                const nextLevel = LEVELS[level] // level is 1-indexed so LEVELS[level] = next
                if (nextLevel && shouldAssist(nextLevel.id)) {
                  const assist = getAssistance(nextLevel.id)
                  dispatch({ type: A.APPLY_DDA, extraMoves: assist.extraMoves, revealCount: assist.revealCount })
                }
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Game complete (after RESET clears it) ── */}
      <AnimatePresence>
        {gameComplete && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-linguo-smokyBlack/95 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.h1
              className="font-black text-5xl sm:text-6xl bg-gradient-to-r from-linguo-lightGold via-linguo-blossomPink to-linguo-brightLavender bg-clip-text text-transparent mb-4"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
            >YOU WON! 🏆</motion.h1>
            <p className="text-linguo-fantasy/70 mb-6 text-lg">Final score: <span className="text-linguo-lightGold font-bold">{score.toLocaleString()}</span></p>
            <motion.button
              onClick={() => dispatch({ type: A.RESET_GAME })}
              className="px-8 py-3.5 rounded-2xl font-black bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender text-linguo-smokyBlack shadow-xl"
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
            >Play Again</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily already-played screen ── */}
      <AnimatePresence>
        {dailyMode && dailySave && !levelComplete && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-linguo-smokyBlack/95 backdrop-blur-sm px-6 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="flex flex-col items-center gap-5"
            >
              <span className="text-6xl">🧠</span>
              <h2 className="font-black text-3xl sm:text-4xl bg-gradient-to-r from-linguo-malibu to-linguo-brightLavender bg-clip-text text-transparent">
                Daily #{dayNumber}
              </h2>
              <p className="text-linguo-fantasy/80 text-lg font-semibold">Ya completaste el reto de hoy</p>
              <div className="px-6 py-3 rounded-2xl bg-linguo-lightGold/10 border border-linguo-lightGold/30">
                <p className="text-linguo-lightGold font-bold text-sm uppercase tracking-widest">Your score</p>
                <p className="text-linguo-lightGold font-black text-2xl">{dailySave.score.toLocaleString()}</p>
                <p className="text-linguo-fantasy/50 text-xs mt-1">in {dailySave.moves} move{dailySave.moves !== 1 ? 's' : ''}</p>
              </div>
              <p className="text-linguo-fantasy/30 text-xs">Come back tomorrow for a new puzzle!</p>
              <motion.button
                onClick={() => setDailyMode(false)}
                className="mt-2 px-6 py-3 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-linguo-fantasy border border-white/15 transition-colors"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              >
                ← Back to game
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Swipe gesture tooltip (one-time) ── */}
      <AnimatePresence>
        {showSwipeTip && (
          <motion.div
            className="fixed bottom-28 left-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl pointer-events-none select-none"
            style={{
              background: 'rgba(16,15,6,0.88)',
              border: '1px solid rgba(162,147,255,0.25)',
              backdropFilter: 'blur(8px)',
              x: '-50%',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-base leading-none">👆</span>
            <span className="text-linguo-fantasy/70 text-xs font-semibold">
              Swipe left for challenges · Swipe up for hints
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main ref={mainRef} className="w-full max-w-md px-3 sm:px-4 pt-16 pb-10 flex flex-col items-center">

        {/* ── Daily mode banner ── */}
        {dailyMode && (
          <div className="w-full mb-3 px-4 py-2 rounded-xl bg-linguo-malibu/10 border border-linguo-malibu/25 flex items-center justify-between">
            <span className="text-linguo-malibu text-xs font-bold uppercase tracking-wider">🗓 Daily #{dayNumber}</span>
            <button onClick={() => setDailyMode(false)} className="text-linguo-fantasy/30 hover:text-linguo-fantasy/70 text-xs transition-colors">← Exit daily</button>
          </div>
        )}

        {/* ── Game over — loss-aversion screen ── */}
        {/* Ternary evaluated in same render as SOLVE_ATTEMPT dispatch; React
            batches so PhraseBoard disappears atomically when movesLeft hits 0. */}
        {isGameOver ? (
          <GameOverScreen
            streak={streak}
            coins={coins}
            lives={lives}
            nextLifeMs={nextLifeMs}
            dailyMode={dailyMode}
            dailyStreakCount={progression.dailyStreakCount}
            challengeProgress={challengeProgress}
            dailyChallenges={dailyChallenges}
            extraMovesCost={EXTRA_MOVES_COST}
            onBuyMoves={handleBuyMoves}
            onSurrender={handleSurrender}
          />

        ) : (
          <>
            {/* ── Level timer ── */}
            {!levelComplete && !isGameOver && (
              <div className="w-full mb-2">
                <LevelTimer
                  key={currentLevel.id}
                  durationSeconds={getDifficulty(currentLevel.cefr).timerSeconds}
                  paused={levelComplete || isGameOver}
                  onExpire={handleTimerExpire}
                />
              </div>
            )}

            {/* ── Feedback banner ── */}
            <AnimatePresence mode="wait">
              {lastFeedback && (
                <motion.div
                  key={lastFeedback.type + (lastFeedback.wrongCount ?? '')}
                  className={`
                    mb-3 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border
                    ${lastFeedback.type === 'reveal-correct'
                      ? 'bg-linguo-teal/15 text-linguo-teal border-linguo-teal/40'
                      : lastFeedback.type === 'solve-correct'
                      ? 'bg-linguo-teal/20 text-linguo-teal border-linguo-teal/50'
                      : lastFeedback.type === 'hint-used' || lastFeedback.type === 'reroll' || lastFeedback.type === 'moves-added'
                      ? 'bg-linguo-lightGold/10 text-linguo-lightGold border-linguo-lightGold/30'
                      : lastFeedback.type === 'decoy-wrong'
                      ? 'bg-red-900/20 text-red-400 border-red-500/40'
                      : lastFeedback.type === 'time-up'
                      ? 'bg-amber-900/20 text-amber-400 border-amber-500/40'
                      : 'bg-linguo-lightCoral/15 text-linguo-lightCoral border-linguo-lightCoral/40'}
                  `}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {lastFeedback.type === 'reveal-correct' && `✓ +${lastFeedback.earned} pts${streak > 1 ? ` (×${(Math.min(1 + (streak - 1) * 0.5, 5)).toFixed(1)} streak)` : ''}`}
                  {lastFeedback.type === 'solve-correct' && '✓ Solved! +500 bonus pts'}
                  {lastFeedback.type === 'solve-wrong' && '✗ Wrong guess — −2 moves'}
                  {lastFeedback.type === 'hint-used' && '💡 Lex revealed a letter!'}
                  {lastFeedback.type === 'decoy-wrong' && `✗ Decoy! Strike ${lastFeedback.strikes ?? strikes}/${MAX_STRIKES} — streak reset`}
                  {lastFeedback.type === 'reroll' && '↺ Level skipped — −3 moves'}
                  {lastFeedback.type === 'time-up' && '⏱ Time’s up! Chest capped at Bronze — keep going!'}
                  {lastFeedback.type === 'moves-added' && `+${lastFeedback.amount} moves added — keep going!`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Active color instruction ── */}
            {!levelComplete && !isGameOver && activeColor && (
              <div className="w-full flex items-center justify-center gap-2 mb-2">
                <div
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: { gold: '#FFDA57', cyan: '#7DCAF6', lime: '#34D9B3', pink: '#FFBBF4', purple: '#C4B8FF' }[activeColor],
                    boxShadow: `0 0 6px 2px ${{ gold: '#FFDA5755', cyan: '#7DCAF655', lime: '#34D9B355', pink: '#FFBBF455', purple: '#C4B8FF55' }[activeColor]}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ color: { gold: '#FFDA57', cyan: '#7DCAF6', lime: '#34D9B3', pink: '#FFBBF4', purple: '#C4B8FF' }[activeColor] }}
                >
                  Tap {({ gold: 'Gold', cyan: 'Blue', lime: 'Green', pink: 'Pink', purple: 'Purple' })[activeColor]} tiles
                </span>
                <div
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: { gold: '#FFDA57', cyan: '#7DCAF6', lime: '#34D9B3', pink: '#FFBBF4', purple: '#C4B8FF' }[activeColor],
                    boxShadow: `0 0 6px 2px ${{ gold: '#FFDA5755', cyan: '#7DCAF655', lime: '#34D9B355', pink: '#FFBBF455', purple: '#C4B8FF55' }[activeColor]}`,
                    flexShrink: 0,
                  }}
                />
              </div>
            )}

            {/* ── Grid ── */}
            <GameGrid
              key={currentLevel.id}
              grid={grid}
              onCellReveal={handleCellReveal}
              onDecoyTap={handleDecoyTap}
              streak={streak}
              activeColor={activeColor}
            />

            {/* ── Phrase board ── */}
            <PhraseBoard
              hiddenPhrase={hiddenPhrase}
              movesLeft={movesLeft}
              onSolveAttempt={handleSolveAttempt}
              levelComplete={levelComplete}
              wrongGuessCount={wrongGuessCount}
            />

            {/* ── Re-roll button ── */}
            {!levelComplete && rerollsUsed < MAX_REROLLS && (
              <motion.button
                onClick={handleReroll}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold border border-linguo-lightGold/40 text-linguo-lightGold/70 bg-linguo-lightGold/5 hover:bg-linguo-lightGold/10 transition-colors focus:outline-none"
                whileTap={{ scale: 0.93 }}
              >
                ↺ Skip ({MAX_REROLLS - rerollsUsed} left)
              </motion.button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
