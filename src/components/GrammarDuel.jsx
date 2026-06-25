import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getDailyDuelItems,
  DUEL_ITEMS,
  loadDuelSave,
  saveDuelProgress,
  DUEL_XP_CORRECT,
  DUEL_COINS_CORRECT,
  DUEL_XP_PERFECT_BONUS,
  DUEL_COINS_PERFECT_BONUS,
  DUEL_XP_STREAK_BONUS,
} from '../data/grammarDuel.js'
import { getTodayDateString } from '../data/gameData.js'
import { playChain, playBig, playWrong } from '../audio/sfx.js'
import {
  recordResult,
  dueCategories,
  getAdaptiveItem,
  recordDueReview,
} from '../data/mastery.js'

// ─── CEFR colour map (mirrors RulesWidget) ────────────────────────────────────

const CEFR_STYLES = {
  A2: 'bg-linguo-teal/15 border-linguo-teal/40 text-linguo-teal',
  B1: 'bg-linguo-teal/15 border-linguo-teal/40 text-linguo-teal',
  B2: 'bg-linguo-malibu/15 border-linguo-malibu/40 text-linguo-malibu',
  C1: 'bg-linguo-brightLavender/15 border-linguo-brightLavender/40 text-linguo-brightLavender',
  C2: 'bg-linguo-lightGold/15 border-linguo-lightGold/40 text-linguo-lightGold',
}

function CEFRBadge({ cefr }) {
  if (!cefr) return null
  const cls = CEFR_STYLES[cefr] ?? 'bg-white/8 border-white/20 text-linguo-fantasy/60'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest leading-none ${cls}`}>
      {cefr}
    </span>
  )
}

// ─── Option button ────────────────────────────────────────────────────────────

function OptionButton({ option, index, state, onSelect, shake }) {
  // state: 'idle' | 'correct' | 'wrong' | 'revealed'
  const isCorrectReveal = state === 'revealed' && option.correct
  const isWrong         = state === 'wrong'
  const isCorrect       = state === 'correct'

  const base = 'w-full text-left px-4 py-3.5 rounded-2xl border font-semibold text-sm leading-snug transition-all duration-200 focus:outline-none focus:ring-2'

  let cls = ''
  if (isCorrect) {
    cls = 'bg-linguo-teal/20 border-linguo-teal/60 text-linguo-teal focus:ring-linguo-teal/40'
  } else if (isWrong) {
    cls = 'bg-linguo-lightCoral/20 border-linguo-lightCoral/60 text-linguo-lightCoral focus:ring-linguo-lightCoral/40'
  } else if (isCorrectReveal) {
    cls = 'bg-linguo-teal/10 border-linguo-teal/40 text-linguo-teal/80 focus:ring-linguo-teal/30'
  } else if (state === 'idle') {
    cls = 'bg-white/5 border-white/15 text-linguo-fantasy/80 hover:bg-white/10 hover:border-linguo-brightLavender/40 hover:text-linguo-fantasy focus:ring-linguo-brightLavender/30'
  } else {
    // other options after answer (dimmed)
    cls = 'bg-white/3 border-white/8 text-linguo-fantasy/30 cursor-default'
  }

  const icon = isCorrect ? '✓' : isWrong ? '✗' : isCorrectReveal ? '✓' : String.fromCharCode(65 + index)

  return (
    <motion.button
      onClick={state === 'idle' ? onSelect : undefined}
      disabled={state !== 'idle'}
      className={`${base} ${cls}`}
      animate={shake ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={shake ? { duration: 0.35, ease: 'easeOut' } : {}}
      whileHover={state === 'idle' ? { scale: 1.015 } : {}}
      whileTap={state === 'idle' ? { scale: 0.975 } : {}}
    >
      <span className="flex items-start gap-2.5">
        <span className={`
          flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center text-[10px] font-black
          ${isCorrect || isCorrectReveal ? 'border-linguo-teal/60 text-linguo-teal' : isWrong ? 'border-linguo-lightCoral/60 text-linguo-lightCoral' : 'border-white/20 text-linguo-fantasy/40'}
        `}>
          {icon}
        </span>
        <span>{option.text}</span>
      </span>
    </motion.button>
  )
}

// ─── Why feedback box ─────────────────────────────────────────────────────────

function WhyBox({ option, isCorrect, correctOption }) {
  return (
    <motion.div
      className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${
        isCorrect
          ? 'border-linguo-teal/30 bg-linguo-teal/8 text-linguo-fantasy/85'
          : 'border-linguo-lightCoral/30 bg-linguo-lightCoral/8 text-linguo-fantasy/85'
      }`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className={`font-bold text-[10px] uppercase tracking-widest mb-1.5 ${isCorrect ? 'text-linguo-teal' : 'text-linguo-lightCoral'}`}>
        {isCorrect ? '✓ Correct!' : '✗ Not quite'}
      </p>
      <p className="mb-1.5">{option.why}</p>
      {!isCorrect && correctOption && (
        <p className="text-linguo-teal/90">
          <span className="font-bold">Correct answer:</span> {correctOption.text} — {correctOption.why}
        </p>
      )}
    </motion.div>
  )
}

// ─── Explanation card ─────────────────────────────────────────────────────────

function ExplanationCard({ explanation }) {
  return (
    <motion.div
      className="rounded-xl border border-linguo-malibu/25 bg-linguo-malibu/8 px-4 py-3 text-xs text-linguo-fantasy/80 leading-relaxed"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
    >
      <p className="font-bold text-[10px] uppercase tracking-widest text-linguo-malibu mb-1.5">📚 Grammar note</p>
      <p>{explanation}</p>
    </motion.div>
  )
}

// ─── Streak pill ──────────────────────────────────────────────────────────────

function StreakPill({ streak }) {
  if (streak < 2) return null
  return (
    <motion.div
      key={streak}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-linguo-lightGold/40 bg-linguo-lightGold/10"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      <span className="text-[11px]">🔥</span>
      <span className="text-linguo-lightGold font-black text-[11px] tabular-nums">{streak}</span>
    </motion.div>
  )
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ total, current, results }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const r = results[i]
        const isCurrent = i === current
        return (
          <motion.div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              r === true  ? 'bg-linguo-teal w-2.5 h-2.5' :
              r === false ? 'bg-linguo-lightCoral w-2.5 h-2.5' :
              isCurrent   ? 'bg-linguo-brightLavender/70 w-3 h-3 ring-2 ring-linguo-brightLavender/40' :
                            'bg-white/15 w-2 h-2'
            }`}
            animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
          />
        )
      })}
    </div>
  )
}

// ─── Session complete screen ──────────────────────────────────────────────────

function SessionComplete({ correct, total, isPerfect, onClose }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        className="text-6xl select-none"
        animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        {isPerfect ? '🏆' : correct >= Math.ceil(total * 0.6) ? '🎉' : '💪'}
      </motion.div>

      <div>
        <h2 className="font-black text-3xl bg-gradient-to-r from-linguo-blossomPink via-linguo-brightLavender to-linguo-malibu bg-clip-text text-transparent mb-1">
          {isPerfect ? 'Perfect!' : 'Session done!'}
        </h2>
        <p className="text-linguo-fantasy/60 text-sm">
          {correct} / {total} correct
        </p>
      </div>

      {isPerfect && (
        <motion.div
          className="px-4 py-2 rounded-xl border border-linguo-lightGold/40 bg-linguo-lightGold/10 text-linguo-lightGold font-bold text-xs tracking-wide"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          ⚡ Perfect bonus awarded!
        </motion.div>
      )}

      <div className="flex gap-2 text-xs text-linguo-fantasy/50">
        <span className="px-2 py-1 rounded-md bg-linguo-teal/10 text-linguo-teal font-bold">
          +{correct * DUEL_XP_CORRECT + (isPerfect ? DUEL_XP_PERFECT_BONUS : 0)} XP
        </span>
        <span className="px-2 py-1 rounded-md bg-linguo-lightGold/10 text-linguo-lightGold font-bold">
          +{correct * DUEL_COINS_CORRECT + (isPerfect ? DUEL_COINS_PERFECT_BONUS : 0)} 🪙
        </span>
      </div>

      <motion.button
        onClick={onClose}
        className="px-8 py-3.5 rounded-2xl font-black text-base tracking-wide text-linguo-smokyBlack bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender shadow-xl shadow-linguo-brightLavender/20 focus:outline-none focus:ring-4 focus:ring-linguo-brightLavender/40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Back to game
      </motion.button>
    </motion.div>
  )
}

// ─── GrammarDuel ──────────────────────────────────────────────────────────────

/**
 * Props:
 *   onClose      — () => void         close the duel and return to main game
 *   onGrantXP    — (amount: number) => void
 *   onEarnCoins  — (amount: number) => void
 *   onDuelWin    — () => void          called once per correct answer (for challenge tracking)
 *   onReviewDue  — () => void          called when a due category is answered (challenge tracking)
 */
export default function GrammarDuel({ onClose, onGrantXP, onEarnCoins, onDuelWin, onReviewDue }) {
  const todayStr = getTodayDateString()

  // Build an adaptive item list: C2 only, due categories first, 12 per session
  const items = useRef((() => {
    const SESSION_COUNT = 12
    const c2Pool = DUEL_ITEMS.filter((i) => i.cefr === 'C2')
    const daily  = getDailyDuelItems(todayStr, SESSION_COUNT, c2Pool)
    const due    = new Set(dueCategories())
    if (due.size === 0) return daily
    // Re-order within C2: due-category items first (stable, deduplicated by id)
    const dueItems    = c2Pool.filter((i) => due.has(i.category))
    const nonDueDaily = daily.filter((i) => !due.has(i.category))
    const merged = [...dueItems, ...nonDueDaily]
    // Deduplicate by id, keep at most SESSION_COUNT
    const seen = new Set()
    return merged.filter((i) => seen.has(i.id) ? false : (seen.add(i.id), true)).slice(0, SESSION_COUNT)
  })()).current

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [answerState, setAnswerState]  = useState(null)  // null | { chosenIdx, correct }
  const [results, setResults]          = useState([])    // true | false per item
  const [streak, setStreak]            = useState(0)
  const [done, setDone]                = useState(false)
  const [shakingIdx, setShakingIdx]    = useState(null)
  const rewardedRef                    = useRef(false)

  const item = items[currentIdx]
  const correctOption = item?.options.find((o) => o.correct)

  // ── Load persisted session (read-only on mount) ────────────────────────────
  useEffect(() => {
    const save = loadDuelSave(todayStr)
    if (save?.done) {
      setDone(true)
      setResults(save.results ?? [])
    }
  }, [todayStr])

  // ── Handle option selection ────────────────────────────────────────────────
  const handleSelect = useCallback((optionIdx) => {
    if (answerState !== null) return
    const chosen = item.options[optionIdx]
    const isCorrect = chosen.correct

    if (isCorrect) {
      playChain?.()
      const newStreak = streak + 1
      setStreak(newStreak)
      const xp = DUEL_XP_CORRECT + (newStreak >= 3 ? DUEL_XP_STREAK_BONUS : 0)
      onGrantXP?.(xp)
      onEarnCoins?.(DUEL_COINS_CORRECT)
      onDuelWin?.()
    } else {
      playWrong?.()
      setStreak(0)
      setShakingIdx(optionIdx)
      setTimeout(() => setShakingIdx(null), 400)
    }

    // Record mastery result
    if (item?.category) {
      const wasDue = dueCategories().includes(item.category)
      recordResult(item.category, isCorrect)
      if (wasDue) {
        recordDueReview(todayStr, item.category)
        onReviewDue?.()
      }
    }

    setAnswerState({ chosenIdx: optionIdx, correct: isCorrect })
  }, [answerState, item, streak, todayStr, onGrantXP, onEarnCoins, onDuelWin, onReviewDue])

  // ── Advance to next item ───────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (answerState === null) return
    const newResults = [...results, answerState.correct]
    setResults(newResults)
    setAnswerState(null)

    if (currentIdx + 1 >= items.length) {
      // Session complete
      const allCorrect = newResults.every(Boolean)
      if (allCorrect && !rewardedRef.current) {
        rewardedRef.current = true
        onGrantXP?.(DUEL_XP_PERFECT_BONUS)
        onEarnCoins?.(DUEL_COINS_PERFECT_BONUS)
        playBig?.()
      }
      // Persist
      saveDuelProgress(todayStr, { done: true, results: newResults })
      setDone(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }, [answerState, results, currentIdx, items.length, todayStr, onGrantXP, onEarnCoins])

  // ── Keyboard shortcut: Enter / Space to advance ───────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (answerState !== null) handleNext()
      }
      if (!isNaN(parseInt(e.key)) && answerState === null) {
        const idx = parseInt(e.key) - 1
        if (idx >= 0 && idx < item.options.length) handleSelect(idx)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answerState, handleNext, handleSelect, item])

  // ── Derive option display states ───────────────────────────────────────────
  function optionState(optIdx) {
    if (answerState === null) return 'idle'
    if (optIdx === answerState.chosenIdx) return answerState.correct ? 'correct' : 'wrong'
    if (item.options[optIdx].correct) return 'revealed'
    return 'dimmed'
  }

  const correctCount = results.filter(Boolean).length

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col bg-linguo-smokyBlack overflow-y-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      {/* ── Header bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none select-none">⚔️</span>
          <span className="font-black text-linguo-fantasy tracking-wide text-sm">Grammar Duel</span>
        </div>
        <div className="flex items-center gap-3">
          <StreakPill streak={streak} />
          <button
            onClick={onClose}
            className="text-linguo-fantasy/40 hover:text-linguo-fantasy/80 transition-colors text-lg leading-none focus:outline-none"
            aria-label="Close duel mode"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 max-w-lg mx-auto w-full gap-5">

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SessionComplete
                correct={correctCount}
                total={items.length}
                isPerfect={correctCount === items.length}
                onClose={onClose}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentIdx}
              className="w-full flex flex-col gap-4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              {/* ── Progress + meta ── */}
              <div className="flex items-center justify-between">
                <ProgressDots
                  total={items.length}
                  current={currentIdx}
                  results={results}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-linguo-blossomPink text-[9px] font-bold uppercase tracking-wider border border-linguo-blossomPink/30 bg-linguo-blossomPink/8 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <CEFRBadge cefr={item.cefr} />
                </div>
              </div>

              {/* ── Prompt ── */}
              <div className="rounded-2xl border border-white/10 bg-white/4 px-5 py-4">
                <p className="text-linguo-fantasy/50 text-[10px] uppercase tracking-widest font-bold mb-1.5">
                  {currentIdx + 1} of {items.length}
                </p>
                <p className="text-linguo-fantasy font-semibold text-base leading-relaxed">
                  {item.prompt}
                </p>
              </div>

              {/* ── Options ── */}
              <div className="flex flex-col gap-2.5">
                {item.options.map((opt, i) => (
                  <OptionButton
                    key={i}
                    option={opt}
                    index={i}
                    state={optionState(i)}
                    shake={shakingIdx === i}
                    onSelect={() => handleSelect(i)}
                  />
                ))}
              </div>

              {/* ── Feedback (shown after answering) ── */}
              <AnimatePresence>
                {answerState !== null && (
                  <motion.div
                    key="feedback"
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <WhyBox
                      option={item.options[answerState.chosenIdx]}
                      isCorrect={answerState.correct}
                      correctOption={answerState.correct ? null : correctOption}
                    />
                    <ExplanationCard explanation={item.explanation} />

                    {/* Next button */}
                    <motion.button
                      onClick={handleNext}
                      className="w-full py-3.5 rounded-2xl font-black text-base tracking-wide text-linguo-smokyBlack bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender shadow-lg shadow-linguo-brightLavender/20 focus:outline-none focus:ring-4 focus:ring-linguo-brightLavender/40"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {currentIdx + 1 >= items.length ? 'See results →' : 'Next question →'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Keyboard hint ── */}
      <div className="flex-shrink-0 text-center py-2 text-linguo-fantasy/20 text-[10px] select-none">
        Press 1-4 to select · Enter to advance
      </div>
    </motion.div>
  )
}
