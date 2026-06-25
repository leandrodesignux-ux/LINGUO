import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChestReveal from './ChestReveal.jsx'

// ─── CEFR badge (shared colour map) ───────────────────────────────────────────────────────

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

// ─── Grammar rule card ────────────────────────────────────────────────────────────

/**
 * Parses grammarExplanation into React nodes.
 * Tokens inside single quotes preceded by NOT are highlighted in lightCoral.
 * Tokens inside single quotes (plain, correct examples) are highlighted in teal.
 * The literal word NOT (standalone) is bolded in lightCoral.
 * Everything else renders as plain text.
 */
function parseExplanation(text) {
  if (!text) return null
  // Split on:
  //  - NOT '...'
  //  - '...'
  const parts = []
  // Regex captures: group 1 = full NOT 'x' match, group 2 = the NOT text, group 3 = plain quoted text
  const re = /(NOT\s+'([^']+)')|(\bNOT\b)|('([^']+)')/g
  let last = 0
  let m
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    }
    if (m[1]) {
      // NOT 'phrase' — incorrect, highlight coral
      parts.push(
        <span key={key++}>
          <span className="font-bold text-linguo-lightCoral">NOT</span>{' '}
          <span className="font-bold text-linguo-lightCoral line-through opacity-80">'{m[2]}'</span>
        </span>
      )
    } else if (m[3]) {
      // standalone NOT
      parts.push(<span key={key++} className="font-bold text-linguo-lightCoral">{m[3]}</span>)
    } else if (m[4]) {
      // plain 'phrase' — correct example, highlight teal
      parts.push(<span key={key++} className="font-bold text-linguo-teal">{m[4]}</span>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return parts
}

function GrammarRuleCard({ category, cefr, grammarExplanation, animDelay = 0.9 }) {
  if (!grammarExplanation) return null
  return (
    <motion.div
      className="w-full max-w-xs rounded-xl border border-linguo-teal/30 bg-linguo-teal/8 overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 border-b border-linguo-teal/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm leading-none select-none">📚</span>
          <span className="text-linguo-teal font-black text-[10px] uppercase tracking-widest truncate">
            {category ?? 'Grammar note'}
          </span>
        </div>
        <CEFRBadge cefr={cefr} />
      </div>
      {/* Card body */}
      <p className="px-3 py-2.5 text-linguo-fantasy/85 text-[11px] leading-relaxed">
        {parseExplanation(grammarExplanation)}
      </p>
    </motion.div>
  )
}

// ─── Confetti piece ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FFBBF4', '#A293FF', '#FFDA57', '#7DCAF6', '#00917A', '#F47575']

function ConfettiPiece({ x, color, size, duration, delay, shape }) {
  const targetY = typeof window !== 'undefined' ? window.innerHeight + 40 : 900

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: -20,
        width: size,
        height: shape === 'rect' ? size * 0.5 : size,
        borderRadius: shape === 'circle' ? '50%' : shape === 'rect' ? 2 : 0,
        backgroundColor: color,
        rotate: 0,
      }}
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{
        y: targetY,
        opacity: [1, 1, 0.8, 0],
        rotate: [0, 180, 360, 540, 720],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
        opacity: { times: [0, 0.6, 0.85, 1] },
      }}
    />
  )
}

// ─── Staggered phrase letters ─────────────────────────────────────────────────

const letterContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.3,
    },
  },
}

const letterVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 18 },
  },
}

function PhraseLetters({ phrase }) {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-x-1 gap-y-2 px-4 max-w-xs sm:max-w-sm"
      variants={letterContainerVariants}
      initial="hidden"
      animate="show"
    >
      {phrase.split('').map((char, i) =>
        char === ' ' ? (
          <div key={i} className="w-3" />
        ) : (
          <motion.div
            key={i}
            variants={letterVariants}
            className="
              flex items-center justify-center
              w-8 h-10 sm:w-9 sm:h-11
              rounded-lg bg-linguo-smokyBlack border border-linguo-brightLavender/40
              font-bold text-linguo-fantasy text-base sm:text-lg
            "
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {char.toUpperCase()}
          </motion.div>
        )
      )}
    </motion.div>
  )
}

// ─── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ hint, dayNumber, moves }) {
  const [copied, setCopied] = useState(false)

  const shareText = `Linguo Daily #${dayNumber} — Solved “${hint}” in ${moves} move${moves !== 1 ? 's' : ''} 🧠✨`

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText })
        return
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(shareText)
    } catch (_) {
      const ta = document.createElement('textarea')
      ta.value = shareText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      onClick={handleShare}
      className="
        px-6 py-3 rounded-2xl font-bold text-sm tracking-wide
        bg-linguo-malibu/15 border border-linguo-malibu/40 text-linguo-malibu
        hover:bg-linguo-malibu/25 transition-colors duration-150
        focus:outline-none focus:ring-4 focus:ring-linguo-malibu/30
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.15, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
    >
      {copied ? '✓ Copied to clipboard!' : '📤 Share result'}
    </motion.button>
  )
}

/**
 * Props:
 *   phrase      — string
 *   hint        — string
 *   source      — string
 *   grammarExplanation — string
 *   category    — string  (new)
 *   cefr        — string  (new)
 *   isLastLevel — boolean
 *   isDaily     — boolean
 *   dayNumber   — number
 *   moves       — number
 *   score       — number
 *   chestType   — 'gold' | 'silver' | 'bronze'
 *   chestXP     — number
 *   onAdvance   — () => void
 */
export default function LevelComplete({ phrase, hint, source, grammarExplanation, category, cefr, isLastLevel, isDaily, dayNumber, moves, score, chestType, chestXP, onAdvance }) {
  const [chestDone, setChestDone] = useState(false)

  const confetti = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 10,
      duration: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 0.8,
      shape: ['circle', 'rect', 'square'][Math.floor(Math.random() * 3)],
    }))
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        className="
          fixed inset-0 z-50 flex flex-col items-center justify-center
          bg-linguo-smokyBlack/95 backdrop-blur-sm overflow-hidden
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* ── Confetti ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((c) => (
            <ConfettiPiece key={c.id} {...c} />
          ))}
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">

          {/* ── Chest reveal sequence ── */}
          <AnimatePresence mode="wait">
            {!chestDone && (
              <motion.div
                key="chest"
                className="flex flex-col items-center"
                exit={{ opacity: 0, scale: 0.85, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <ChestReveal
                  chestType={chestType ?? 'bronze'}
                  xpReward={chestXP ?? 25}
                  onDone={() => setChestDone(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* BRILLIANT! — shown only after chest is dismissed */}
          {chestDone && (<>
          <motion.h1
            key="title"
            className="
              font-black text-5xl sm:text-6xl tracking-tight
              bg-gradient-to-r from-linguo-blossomPink via-linguo-brightLavender to-linguo-malibu
              bg-clip-text text-transparent
            "
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.15, 1], opacity: 1 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            {isLastLevel ? 'YOU WON!' : 'BRILLIANT!'}
          </motion.h1>

          {/* Score badge */}
          <motion.div
            className="px-5 py-2 rounded-full bg-linguo-lightGold/10 border border-linguo-lightGold/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-linguo-lightGold font-bold text-sm tracking-widest uppercase">
              Score: {score.toLocaleString()}
            </span>
          </motion.div>

          {/* Phrase letters stagger */}
          <PhraseLetters phrase={phrase} />

          {/* Source + badges row */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-linguo-fantasy/40 text-[10px] uppercase tracking-widest">{source}</span>
            {category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-linguo-blossomPink/30 bg-linguo-blossomPink/8 text-linguo-blossomPink text-[9px] font-bold uppercase tracking-wider leading-none">
                {category}
              </span>
            )}
            <CEFRBadge cefr={cefr} />
          </motion.div>

          {/* Grammar rule card */}
          <GrammarRuleCard
            category={category}
            cefr={cefr}
            grammarExplanation={grammarExplanation}
            animDelay={0.9}
          />

          {/* Buttons row */}
          <div className="flex flex-wrap justify-center gap-3">
            {/* Share (always shown on daily; also shown on normal) */}
            <ShareButton hint={hint} dayNumber={dayNumber} moves={moves} />

            {/* Next / Back button — hidden in daily mode (Exit daily is in the banner) */}
            {!isDaily && (
              <motion.button
                onClick={onAdvance}
                className="
                  px-8 py-3.5 rounded-2xl
                  font-black text-base tracking-wide text-linguo-smokyBlack
                  bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender
                  shadow-xl shadow-linguo-brightLavender/20
                  focus:outline-none focus:ring-4 focus:ring-linguo-brightLavender/40
                "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.06, filter: 'hue-rotate(10deg) brightness(1.08)' }}
                whileTap={{ scale: 0.96 }}
              >
                {isLastLevel ? 'Play Again' : 'NEXT LEVEL →'}
              </motion.button>
            )}
            {isDaily && (
              <motion.button
                onClick={onAdvance}
                className="
                  px-6 py-3 rounded-2xl font-bold text-sm tracking-wide text-linguo-fantasy
                  bg-white/5 hover:bg-white/10 border border-white/15
                  focus:outline-none transition-colors
                "
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.04, filter: 'brightness(1.15)' }}
                whileTap={{ scale: 0.96 }}
              >
                ← Back to game
              </motion.button>
            )}
          </div>
          </>)}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
