import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Static mini-grid mockup (Step 2) ────────────────────────────────────────

const MINI_CELLS = [
  { id: 'a', color: '#A293FF', shape: 'circle',   chain: true  },
  { id: 'b', color: '#FFBBF4', shape: 'diamond',  chain: false },
  { id: 'c', color: '#FFDA57', shape: 'triangle', chain: false },
  { id: 'd', color: '#A293FF', shape: 'square',   chain: true  },
  { id: 'e', color: '#7DCAF6', shape: 'circle',   chain: false },
  { id: 'f', color: '#FFDA57', shape: 'star',     chain: false },
  { id: 'g', color: '#A293FF', shape: 'triangle', chain: true  },
  { id: 'h', color: '#FFBBF4', shape: 'square',   chain: false },
  { id: 'i', color: '#00917A', shape: 'circle',   chain: false },
]

function MiniShape({ shape, fill, stroke }) {
  const p = { fill, stroke, strokeWidth: 1.5 }
  switch (shape) {
    case 'circle':   return <circle cx="20" cy="20" r="14" {...p} />
    case 'diamond':  return <polygon points="20,4 36,20 20,36 4,20" {...p} />
    case 'triangle': return <polygon points="20,4 38,36 2,36" {...p} />
    case 'square':   return <rect x="5" y="5" width="30" height="30" rx="3" {...p} />
    case 'star':     return <polygon points="20,3 24,14 36,14 27,22 30,34 20,27 10,34 13,22 4,14 16,14" {...p} />
    default:         return null
  }
}

function MiniGrid() {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10 w-36">
      {MINI_CELLS.map((cell) => (
        <div
          key={cell.id}
          className={`aspect-square rounded-lg flex items-center justify-center ${cell.chain ? 'ring-2 ring-linguo-blossomPink' : ''}`}
          style={{ background: cell.chain ? 'rgba(34,30,26,0.9)' : 'rgba(26,26,16,0.7)' }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <MiniShape
              shape={cell.shape}
              fill={cell.color}
              stroke={cell.chain ? '#fff' : 'rgba(255,255,255,0.15)'}
            />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ─── Static phrase mockup (Step 3) ───────────────────────────────────────────

function MiniPhrase() {
  const slots = [
    { char: 'S', revealed: true  },
    { char: 'H', revealed: true  },
    { char: 'E', revealed: false },
    { char: ' ', revealed: true  },
    { char: 'H', revealed: true  },
    { char: 'A', revealed: false },
    { char: 'S', revealed: true  },
  ]
  return (
    <div className="flex gap-1.5 flex-wrap justify-center">
      {slots.map((s, i) =>
        s.char === ' ' ? (
          <div key={i} className="w-3" />
        ) : (
          <div
            key={i}
            className="w-8 h-10 rounded-lg flex items-center justify-center text-sm font-black border"
            style={{
              background:   s.revealed ? 'rgba(162,147,255,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor:  s.revealed ? 'rgba(162,147,255,0.5)'  : 'rgba(255,255,255,0.12)',
              color:        s.revealed ? '#F5F4ED' : 'transparent',
            }}
          >
            {s.char}
          </div>
        )
      )}
    </div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    emoji: '🧠',
    title: 'Welcome to Linguo',
    subtitle: 'Learn English grammar by solving hidden phrases. Swipe, chain, and discover!',
    visual: null,
  },
  {
    emoji: '✨',
    title: 'Build chains',
    subtitle: 'Drag across gems that follow the rule shown. The longer the chain, the more letters you reveal.',
    visual: <MiniGrid />,
  },
  {
    emoji: '💬',
    title: 'Reveal the phrase',
    subtitle: 'Each chain reveals letters. Figure out the grammar phrase before you run out of moves!',
    visual: <MiniPhrase />,
  },
  {
    emoji: '💡',
    title: 'Use hints wisely',
    subtitle: 'Stuck? Use a hint to reveal a letter — but you only get 2 per round. Swipe up to activate!',
    visual: null,
  },
]

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0,   opacity: 1 },
  exit:  { x: -300, opacity: 0 },
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  function advance() {
    if (isLast) { onDone() } else { setStep((s) => s + 1) }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-linguo-smokyBlack flex flex-col items-center justify-center overflow-hidden">

      {/* ── Animated slide ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex flex-col items-center justify-center gap-6 px-8 text-center w-full max-w-sm"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Emoji */}
          <motion.span
            className="text-7xl leading-none select-none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          >
            {current.emoji}
          </motion.span>

          {/* Title */}
          <h1 className="font-black text-3xl sm:text-4xl bg-gradient-to-r from-linguo-blossomPink via-linguo-brightLavender to-linguo-malibu bg-clip-text text-transparent leading-tight">
            {current.title}
          </h1>

          {/* Subtitle */}
          <p className="text-linguo-fantasy/70 text-base leading-relaxed">
            {current.subtitle}
          </p>

          {/* Visual mockup (steps 2 & 3) */}
          {current.visual && (
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
            >
              {current.visual}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation dots ── */}
      <div className="absolute bottom-32 flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width:      i === step ? 20 : 8,
              height:     8,
              background: i === step
                ? 'linear-gradient(90deg, #FFBBF4, #A293FF)'
                : 'rgba(255,255,255,0.18)',
            }}
          />
        ))}
      </div>

      {/* ── Next / Play button ── */}
      <div className="absolute bottom-14">
        <motion.button
          onClick={advance}
          className="px-10 py-3.5 rounded-2xl font-black text-base text-linguo-smokyBlack shadow-xl shadow-black/40"
          style={{
            background: isLast
              ? 'linear-gradient(135deg, #00917A, #40B8A6)'
              : 'linear-gradient(135deg, #FFBBF4, #A293FF)',
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
        >
          {isLast ? "Let's play! 🚀" : 'Next →'}
        </motion.button>
      </div>
    </div>
  )
}
