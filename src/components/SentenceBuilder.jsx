import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getDailyBuilderItems,
  BUILDER_ITEMS,
  seededShuffle,
  saveBuilderProgress,
  BUILDER_XP_CORRECT,
  BUILDER_COINS_CORRECT,
  BUILDER_XP_FIRST_TRY_BONUS,
  BUILDER_XP_PERFECT_BONUS,
  BUILDER_COINS_PERFECT_BONUS,
} from '../data/sentenceBuilder.js'
import { getTodayDateString } from '../data/gameData.js'
import { playChain, playBig, playWrong } from '../audio/sfx.js'
import {
  recordResult,
  dueCategories,
  recordDueReview,
} from '../data/mastery.js'

// ─── CEFR badge ───────────────────────────────────────────────────────────────

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

// ─── Token chip ───────────────────────────────────────────────────────────────

/**
 * zone: 'bank' | 'built'
 * status: 'idle' | 'correct' | 'wrong' | 'distractor'
 */
function TokenChip({ text, zone, status, onClick, index }) {
  const base =
    'px-3 py-2 rounded-xl border font-semibold text-sm leading-none cursor-pointer select-none transition-all duration-150 focus:outline-none focus:ring-2'

  let cls = ''
  if (status === 'correct') {
    cls = 'bg-linguo-teal/20 border-linguo-teal/50 text-linguo-teal focus:ring-linguo-teal/40'
  } else if (status === 'wrong') {
    cls = 'bg-linguo-lightCoral/20 border-linguo-lightCoral/50 text-linguo-lightCoral focus:ring-linguo-lightCoral/40'
  } else if (status === 'distractor') {
    cls = 'bg-linguo-lightCoral/10 border-linguo-lightCoral/30 text-linguo-lightCoral/60 line-through cursor-default'
  } else if (zone === 'built') {
    cls = 'bg-linguo-brightLavender/15 border-linguo-brightLavender/40 text-linguo-fantasy hover:bg-linguo-brightLavender/25 focus:ring-linguo-brightLavender/40'
  } else {
    cls = 'bg-white/8 border-white/20 text-linguo-fantasy/80 hover:bg-white/15 hover:border-linguo-brightLavender/40 hover:text-linguo-fantasy focus:ring-linguo-brightLavender/30'
  }

  return (
    <motion.button
      onClick={status === 'distractor' ? undefined : onClick}
      disabled={status === 'distractor'}
      className={`${base} ${cls}`}
      layout
      layoutId={`token-${text}-${index}`}
      whileHover={status !== 'distractor' ? { scale: 1.04, y: -1 } : {}}
      whileTap={status !== 'distractor' ? { scale: 0.94 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      aria-label={`${zone === 'bank' ? 'Add' : 'Remove'}: ${text}`}
    >
      {text}
    </motion.button>
  )
}

// ─── Drop zone placeholder ────────────────────────────────────────────────────

function DropZonePlaceholder() {
  return (
    <motion.div
      className="px-3 py-2 rounded-xl border-2 border-dashed border-linguo-brightLavender/20 text-linguo-fantasy/20 text-xs italic select-none"
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      tap a fragment to place it here
    </motion.div>
  )
}

// ─── Explanation card ─────────────────────────────────────────────────────────

function ExplanationCard({ explanation, delay = 0 }) {
  return (
    <motion.div
      className="w-full rounded-xl border border-linguo-malibu/25 bg-linguo-malibu/8 px-4 py-3 text-xs text-linguo-fantasy/80 leading-relaxed"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <p className="font-bold text-[10px] uppercase tracking-widest text-linguo-malibu mb-1.5">📚 Grammar note</p>
      <p>{explanation}</p>
    </motion.div>
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
          {isPerfect ? 'Perfect build!' : 'Session done!'}
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
          ⚡ Perfect session bonus awarded!
        </motion.div>
      )}

      <div className="flex gap-2 text-xs">
        <span className="px-2 py-1 rounded-md bg-linguo-teal/10 text-linguo-teal font-bold">
          +{correct * BUILDER_XP_CORRECT + (isPerfect ? BUILDER_XP_PERFECT_BONUS : 0)} XP
        </span>
        <span className="px-2 py-1 rounded-md bg-linguo-lightGold/10 text-linguo-lightGold font-bold">
          +{correct * BUILDER_COINS_CORRECT + (isPerfect ? BUILDER_COINS_PERFECT_BONUS : 0)} 🪙
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

// ─── SentenceBuilder ──────────────────────────────────────────────────────────

/**
 * Props:
 *   onClose         — () => void
 *   onGrantXP       — (amount: number) => void
 *   onEarnCoins     — (amount: number) => void
 *   onBuilderSolve  — () => void   (for challenge tracking)
 *   onReviewDue     — () => void   (called when a due category is answered)
 */
export default function SentenceBuilder({ onClose, onGrantXP, onEarnCoins, onBuilderSolve, onReviewDue }) {
  const todayStr = getTodayDateString()

  // Adaptive item list: C2 only, due-category items first, 12 per session
  const items = useRef((() => {
    const SESSION_COUNT = 12
    const c2Pool = BUILDER_ITEMS.filter((i) => i.cefr === 'C2')
    const daily  = getDailyBuilderItems(todayStr, SESSION_COUNT, c2Pool)
    const due    = new Set(dueCategories())
    if (due.size === 0) return daily
    const dueItems    = c2Pool.filter((i) => due.has(i.category))
    const nonDueDaily = daily.filter((i) => !due.has(i.category))
    const merged = [...dueItems, ...nonDueDaily]
    const seen = new Set()
    return merged.filter((i) => seen.has(i.id) ? false : (seen.add(i.id), true)).slice(0, SESSION_COUNT)
  })()).current

  // ── per-item state ──────────────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [results,    setResults]         = useState([])       // true|false per item
  const [sessionDone, setSessionDone]   = useState(false)
  const rewardedRef                      = useRef(false)

  // ── within-item state ───────────────────────────────────────────────────────
  // builtSlots: array of token texts the player has placed (in order)
  const [builtSlots,   setBuiltSlots]   = useState([])
  // checkResult: null | 'correct' | 'wrong'
  const [checkResult,  setCheckResult]  = useState(null)
  // wrongPositions: Set of indices in builtSlots that are wrong
  const [wrongPos,     setWrongPos]     = useState(new Set())
  // attempts: how many times Check was pressed for this item
  const [attempts,     setAttempts]     = useState(0)
  // revealed: true if the solution was shown after 2 failed attempts
  const [revealed,     setRevealed]     = useState(false)

  const item = items[currentIdx]

  // Build the shuffled bank for this item (stable across re-renders, changes only per item)
  const shuffledBank = useMemo(() => {
    const all = item.distractor
      ? [...item.tokens, item.distractor]
      : [...item.tokens]
    return seededShuffle(all, item.id * 1000 + djb2(todayStr))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

  // Tokens still in bank = shuffledBank minus what's already in builtSlots
  const bankTokens = useMemo(() => {
    const placed = [...builtSlots]
    return shuffledBank.filter((t) => {
      const idx = placed.indexOf(t)
      if (idx !== -1) { placed.splice(idx, 1); return false }
      return true
    })
  }, [shuffledBank, builtSlots])

  // ── Reset within-item state when advancing ──────────────────────────────────
  function resetItem() {
    setBuiltSlots([])
    setCheckResult(null)
    setWrongPos(new Set())
    setAttempts(0)
    setRevealed(false)
  }

  // ── Add token from bank → built ─────────────────────────────────────────────
  const handleBankTap = useCallback((token) => {
    if (checkResult === 'correct' || revealed) return
    setBuiltSlots((prev) => [...prev, token])
    setCheckResult(null)
    setWrongPos(new Set())
  }, [checkResult, revealed])

  // ── Remove token from built → bank ─────────────────────────────────────────
  const handleBuiltTap = useCallback((slotIdx) => {
    if (checkResult === 'correct' || revealed) return
    setBuiltSlots((prev) => prev.filter((_, i) => i !== slotIdx))
    setCheckResult(null)
    setWrongPos(new Set())
  }, [checkResult, revealed])

  // ── Check answer ────────────────────────────────────────────────────────────
  const handleCheck = useCallback(() => {
    if (builtSlots.length !== item.tokens.length) return
    const correct = item.tokens.every((t, i) => t === builtSlots[i])
    const newAttempts = attempts + 1
    setAttempts(newAttempts)

    if (correct) {
      setCheckResult('correct')
      playChain?.()
      const xp = BUILDER_XP_CORRECT + (newAttempts === 1 ? BUILDER_XP_FIRST_TRY_BONUS : 0)
      onGrantXP?.(xp)
      onEarnCoins?.(BUILDER_COINS_CORRECT)
      onBuilderSolve?.()
      // Record mastery
      if (item?.category) {
        const wasDue = dueCategories().includes(item.category)
        recordResult(item.category, true)
        if (wasDue) { recordDueReview(todayStr, item.category); onReviewDue?.() }
      }
    } else {
      setCheckResult('wrong')
      playWrong?.()
      const bad = new Set()
      builtSlots.forEach((t, i) => { if (t !== item.tokens[i]) bad.add(i) })
      setWrongPos(bad)
      // Record wrong attempt immediately so spacing adjusts
      if (item?.category) recordResult(item.category, false)
    }
  }, [builtSlots, item, attempts, todayStr, onGrantXP, onEarnCoins, onBuilderSolve, onReviewDue])

  // ── Reveal solution ─────────────────────────────────────────────────────────
  const handleReveal = useCallback(() => {
    setRevealed(true)
    setBuiltSlots([...item.tokens])
    setWrongPos(new Set())
    setCheckResult('correct') // treat as visually correct (revealed)
    // Revealed counts as wrong for mastery (they needed the answer)
    if (item?.category) recordResult(item.category, false)
  }, [item])

  // ── Advance to next item ────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    const wasCorrect = checkResult === 'correct' && !revealed
    const newResults = [...results, revealed ? false : wasCorrect]
    setResults(newResults)
    resetItem()

    if (currentIdx + 1 >= items.length) {
      const allCorrect = newResults.every(Boolean)
      if (allCorrect && !rewardedRef.current) {
        rewardedRef.current = true
        onGrantXP?.(BUILDER_XP_PERFECT_BONUS)
        onEarnCoins?.(BUILDER_COINS_PERFECT_BONUS)
        playBig?.()
      }
      saveBuilderProgress(todayStr, { done: true, results: newResults })
      setSessionDone(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }, [checkResult, revealed, results, currentIdx, items.length, todayStr, onGrantXP, onEarnCoins])

  // ── Keyboard: Enter to Check/Next ──────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Enter') return
      if (checkResult === 'correct' || revealed) {
        handleNext()
      } else if (builtSlots.length === item?.tokens.length) {
        handleCheck()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checkResult, revealed, builtSlots, item, handleCheck, handleNext])

  // ── Token status for built zone ─────────────────────────────────────────────
  function builtStatus(slotIdx) {
    if (revealed) return 'correct'
    if (checkResult === 'correct') return 'correct'
    if (checkResult === 'wrong' && wrongPos.has(slotIdx)) return 'wrong'
    return 'idle'
  }

  const correctCount  = results.filter(Boolean).length
  const canCheck      = builtSlots.length === item?.tokens.length && checkResult !== 'correct' && !revealed
  const canReveal     = attempts >= 2 && checkResult === 'wrong'
  const showNext      = checkResult === 'correct' || revealed
  const showExplain   = checkResult === 'correct' || revealed

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
          <span className="text-xl leading-none select-none">🧩</span>
          <span className="font-black text-linguo-fantasy tracking-wide text-sm">Sentence Builder</span>
        </div>
        <button
          onClick={onClose}
          className="text-linguo-fantasy/40 hover:text-linguo-fantasy/80 transition-colors text-lg leading-none focus:outline-none"
          aria-label="Close Sentence Builder"
        >
          ✕
        </button>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-5 max-w-lg mx-auto w-full gap-5">

        <AnimatePresence mode="wait">
          {sessionDone ? (
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
              {/* ── Meta row ── */}
              <div className="flex items-center justify-between">
                <ProgressDots total={items.length} current={currentIdx} results={results} />
                <div className="flex items-center gap-1.5">
                  <span className="text-linguo-blossomPink text-[9px] font-bold uppercase tracking-wider border border-linguo-blossomPink/30 bg-linguo-blossomPink/8 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <CEFRBadge cefr={item.cefr} />
                </div>
              </div>

              {/* ── Instruction ── */}
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                <p className="text-linguo-fantasy/40 text-[10px] uppercase tracking-widest font-bold mb-1">
                  {currentIdx + 1} of {items.length} — Arrange the fragments
                </p>
                <p className="text-linguo-fantasy/60 text-xs">
                  Tap a fragment to place it. Tap a placed fragment to remove it.
                  {item.distractor && (
                    <span className="text-linguo-lightCoral/70"> One fragment does NOT belong.</span>
                  )}
                </p>
              </div>

              {/* ── Build zone ── */}
              <div className="min-h-[72px] rounded-2xl border-2 border-dashed border-linguo-brightLavender/25 bg-linguo-brightLavender/4 px-3 py-3 flex flex-wrap gap-2 items-center">
                {builtSlots.length === 0 ? (
                  <DropZonePlaceholder />
                ) : (
                  builtSlots.map((tok, i) => (
                    <TokenChip
                      key={`built-${i}`}
                      text={tok}
                      zone="built"
                      status={builtStatus(i)}
                      index={i}
                      onClick={() => handleBuiltTap(i)}
                    />
                  ))
                )}
              </div>

              {/* ── Wrong feedback (before reveal) ── */}
              <AnimatePresence>
                {checkResult === 'wrong' && (
                  <motion.div
                    key="wrong-hint"
                    className="rounded-xl border border-linguo-lightCoral/25 bg-linguo-lightCoral/8 px-4 py-2.5 text-xs text-linguo-fantasy/75"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="font-bold text-linguo-lightCoral">
                      {wrongPos.size} position{wrongPos.size !== 1 ? 's' : ''} {wrongPos.size !== 1 ? 'are' : 'is'} wrong.
                    </span>
                    {' '}Red fragments are in the wrong slot — tap them to remove and try a different order.
                    {attempts >= 2 && (
                      <span className="text-linguo-lightCoral/70"> You can reveal the answer below.</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Token bank ── */}
              <div>
                <p className="text-linguo-fantasy/30 text-[10px] uppercase tracking-widest font-bold mb-2">Fragments</p>
                <div className="flex flex-wrap gap-2">
                  {bankTokens.map((tok, i) => (
                    <TokenChip
                      key={`bank-${i}`}
                      text={tok}
                      zone="bank"
                      status="idle"
                      index={i}
                      onClick={() => handleBankTap(tok)}
                    />
                  ))}
                  {bankTokens.length === 0 && checkResult !== 'correct' && !revealed && (
                    <span className="text-linguo-fantasy/25 text-xs italic">All fragments placed — press Check</span>
                  )}
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div className="flex flex-col gap-2.5">
                {/* Check */}
                {!showNext && (
                  <motion.button
                    onClick={handleCheck}
                    disabled={!canCheck}
                    className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-all duration-150 focus:outline-none focus:ring-4 ${
                      canCheck
                        ? 'bg-gradient-to-r from-linguo-teal to-linguo-malibu text-white shadow-lg shadow-linguo-teal/20 focus:ring-linguo-teal/40'
                        : 'bg-white/5 border border-white/10 text-linguo-fantasy/25 cursor-not-allowed'
                    }`}
                    whileHover={canCheck ? { scale: 1.02 } : {}}
                    whileTap={canCheck ? { scale: 0.97 } : {}}
                  >
                    Check ✓
                  </motion.button>
                )}

                {/* Reveal (after 2 wrong attempts) */}
                {canReveal && !showNext && (
                  <motion.button
                    onClick={handleReveal}
                    className="w-full py-2.5 rounded-2xl font-bold text-sm text-linguo-fantasy/60 border border-white/10 bg-white/4 hover:bg-white/8 hover:text-linguo-fantasy/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Reveal answer
                  </motion.button>
                )}

                {/* Correct feedback + Next */}
                <AnimatePresence>
                  {showNext && (
                    <motion.div
                      key="next-block"
                      className="flex flex-col gap-3"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Correct banner */}
                      <div className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
                        revealed
                          ? 'border-linguo-malibu/30 bg-linguo-malibu/8 text-linguo-malibu'
                          : 'border-linguo-teal/30 bg-linguo-teal/8 text-linguo-teal'
                      }`}>
                        {revealed
                          ? '💡 Solution revealed — study the correct order.'
                          : `✓ Correct${attempts === 1 ? ' — first try bonus!' : '!'}`}
                      </div>

                      {/* Explanation */}
                      {showExplain && <ExplanationCard explanation={item.explanation} delay={0.1} />}

                      {/* Next button */}
                      <motion.button
                        onClick={handleNext}
                        className="w-full py-3.5 rounded-2xl font-black text-base tracking-wide text-linguo-smokyBlack bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender shadow-xl shadow-linguo-brightLavender/20 focus:outline-none focus:ring-4 focus:ring-linguo-brightLavender/40"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {currentIdx + 1 >= items.length ? 'See results →' : 'Next sentence →'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Keyboard hint ── */}
      <div className="flex-shrink-0 text-center py-2 text-linguo-fantasy/20 text-[10px] select-none">
        Enter to Check / advance
      </div>
    </motion.div>
  )
}

// ── Internal djb2 (mirrored locally so no circular import) ────────────────────

function djb2(str, seed = 5381) {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
  }
  return h
}
