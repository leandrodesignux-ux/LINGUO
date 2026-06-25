import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── LetterTile ───────────────────────────────────────────────────────────────

function LetterTile({ slot }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          relative flex items-center justify-center
          w-7 h-9 sm:w-8 sm:h-10 rounded-md
          border transition-colors duration-300
          ${slot.revealed
            ? slot.fromHint
              ? 'bg-linguo-smokyBlack border-linguo-lightGold/60'
              : 'bg-linguo-smokyBlack border-linguo-brightLavender/50'
            : 'bg-linguo-smokyBlack/80 border-white/15'}
        `}
      >
        <AnimatePresence>
          {slot.revealed && (
            <motion.span
              key="letter"
              className="font-bold text-linguo-fantasy text-sm sm:text-base leading-none select-none"
              style={{ display: 'inline-block', fontFamily: "'Space Grotesk', sans-serif" }}
              initial={{ scale: 0, rotateY: 90, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {slot.char.toUpperCase()}
            </motion.span>
          )}
          {!slot.revealed && (
            <motion.span
              key="dash"
              className="block w-3 h-0.5 bg-linguo-fantasy/25 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── PhraseBoard ──────────────────────────────────────────────────────────────

/**
 * Props:
 *   hiddenPhrase  — { slots: Slot[], phrase: string }
 *   movesLeft     — number (displayed in parent HUD, not here)
 *   onSolveAttempt — (guess: string) => void
 *   levelComplete  — boolean (hides input when true)
 */
export default function PhraseBoard({ hiddenPhrase, onSolveAttempt, levelComplete, wrongGuessCount }) {
  const [guess, setGuess]           = useState('')
  const [shaking, setShaking]       = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const inputRef = useRef(null)

  // Reset guess when level changes (phrase changes)
  useEffect(() => {
    setGuess('')
    setShaking(false)
    setWrongFlash(false)
  }, [hiddenPhrase.phrase])

  const triggerShake = useCallback(() => {
    setShaking(true)
    setWrongFlash(true)
    const t1 = setTimeout(() => setShaking(false), 420)
    const t2 = setTimeout(() => setWrongFlash(false), 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // React to wrong guess signal from parent — fires on every increment
  useEffect(() => {
    if (wrongGuessCount > 0) triggerShake()
  }, [wrongGuessCount, triggerShake])

  function handleSolve(e) {
    e.preventDefault()
    if (!guess.trim()) return
    onSolveAttempt(guess.trim())
  }

  function groupSlotsByWord(slots) {
    const words = []
    let current = []
    for (const slot of slots) {
      if (slot.char === ' ') {
        if (current.length > 0) { words.push(current); current = [] }
      } else {
        current.push(slot)
      }
    }
    if (current.length > 0) words.push(current)
    return words
  }

  return (
    <div className="w-full max-w-lg mt-5">
      {/* ── Letter tiles ── */}
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 px-2 mb-5">
        {groupSlotsByWord(hiddenPhrase.slots).map((wordSlots, wi) => (
          <div key={wi} className="inline-flex flex-row gap-x-1 flex-shrink-0">
            {wordSlots.map((slot) => (
              <LetterTile key={slot.index} slot={slot} />
            ))}
          </div>
        ))}
      </div>

      {/* ── Input + Solve ── */}
      {!levelComplete && (
        <form onSubmit={handleSolve} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Guess the phrase…"
              aria-label="Guess the hidden phrase"
              spellCheck={false}
              autoComplete="off"
              className={`
                w-full px-4 py-2.5 rounded-xl
                bg-linguo-smokyBlack border text-linguo-fantasy placeholder-linguo-fantasy/30
                font-mono text-sm tracking-wide
                focus:outline-none focus:ring-2 focus:ring-linguo-brightLavender
                transition-colors duration-200
                ${shaking ? 'animate-input-shake' : ''}
                ${wrongFlash
                  ? 'border-linguo-lightCoral bg-linguo-lightCoral/10'
                  : 'border-white/15 hover:border-white/25'}
              `}
            />
          </div>
          <button
            type="submit"
            disabled={!guess.trim()}
            className="
              px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide
              bg-linguo-brightLavender hover:bg-linguo-brightLavender/80 text-linguo-smokyBlack
              disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-linguo-brightLavender/60
            "
          >
            Solve
          </button>
        </form>
      )}
    </div>
  )
}
