// ─── ChestReveal ──────────────────────────────────────────────────────────────
// Reward-chest animation shown at the start of LevelComplete.
// Sequence: chest closed → (tap or auto 600ms) → explosion → XP counter → label
// Then calls onDone() so LevelComplete can show the phrase + buttons.

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Chest visuals per tier ─────────────────────────────────────────────────────

const CHEST_CONFIG = {
  gold: {
    label:       'Flawless Solve!',
    gradient:    'linear-gradient(135deg, #FFEDA3, #FFDA57, #F5C200)',
    glowColor:   '#FFDA57',
    lockColor:   '#100F06',
    borderColor: '#FFDA57',
    textColor:   '#FFDA57',
    xpColor:     '#FFDA57',
  },
  silver: {
    label:       'Clean Sweep!',
    gradient:    'linear-gradient(135deg, #D8D6CC, #F5F4ED, #B8B6AC)',
    glowColor:   '#F5F4ED',
    lockColor:   '#100F06',
    borderColor: '#F5F4ED',
    textColor:   '#F5F4ED',
    xpColor:     '#F5F4ED',
  },
  bronze: {
    label:       'Level Cleared!',
    gradient:    'linear-gradient(135deg, #FFCF90, #F4A05A, #E8874A)',
    glowColor:   '#F4A05A',
    lockColor:   '#100F06',
    borderColor: '#F4A05A',
    textColor:   '#F4A05A',
    xpColor:     '#F4A05A',
  },
}

// ── Animated XP counter (setInterval tween) ───────────────────────────────────

function XPCounter({ target, color, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const rafRef   = useRef(null)

  useEffect(() => {
    startRef.current = performance.now()
    function tick(now) {
      const elapsed = now - startRef.current
      const t       = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased   = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return (
    <motion.span
      className="font-black tabular-nums"
      style={{ color, fontSize: '2.5rem', lineHeight: 1 }}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
    >
      +{display} XP
    </motion.span>
  )
}

// ── Closed chest SVG ──────────────────────────────────────────────────────────

function ChestIcon({ cfg }) {
  return (
    <svg viewBox="0 0 80 70" width="80" height="70" aria-hidden="true">
      <defs>
        <linearGradient id="chest-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={cfg.glowColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={cfg.glowColor} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="4" y="30" width="72" height="36" rx="6"
        fill={cfg.gradient} stroke={cfg.borderColor} strokeWidth="1.5" />
      {/* Lid */}
      <rect x="4" y="8" width="72" height="26" rx="6"
        fill={cfg.gradient} stroke={cfg.borderColor} strokeWidth="1.5" />
      {/* Lid band */}
      <rect x="4" y="28" width="72" height="8"
        fill={cfg.glowColor} opacity="0.35" />
      {/* Body band */}
      <rect x="4" y="42" width="72" height="8"
        fill={cfg.glowColor} opacity="0.35" />
      {/* Lock body */}
      <rect x="33" y="36" width="14" height="12" rx="2"
        fill={cfg.lockColor} opacity="0.8" />
      {/* Lock shackle */}
      <path d="M36 36 Q36 28 40 28 Q44 28 44 36"
        fill="none" stroke={cfg.lockColor} strokeWidth="2.5"
        strokeLinecap="round" opacity="0.8" />
      {/* Lock keyhole */}
      <circle cx="40" cy="42" r="2.5" fill={cfg.glowColor} opacity="0.6" />
      {/* Hinges */}
      <rect x="12" y="27" width="6" height="8" rx="2"
        fill={cfg.lockColor} opacity="0.5" />
      <rect x="62" y="27" width="6" height="8" rx="2"
        fill={cfg.lockColor} opacity="0.5" />
    </svg>
  )
}

// ── Sparkle burst ─────────────────────────────────────────────────────────────

function Sparks({ color }) {
  const sparks = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 360
    return { angle, dist: 55 + Math.random() * 30, size: 4 + Math.random() * 5 }
  })

  return (
    <>
      {sparks.map((s, i) => {
        const rad = (s.angle * Math.PI) / 180
        const tx  = Math.cos(rad) * s.dist
        const ty  = Math.sin(rad) * s.dist
        return (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: s.size,
              height: s.size,
              backgroundColor: color,
              top: '50%',
              left: '50%',
              marginTop: -s.size / 2,
              marginLeft: -s.size / 2,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.02 }}
          />
        )
      })}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Props:
 *   chestType — 'gold' | 'silver' | 'bronze'
 *   xpReward  — number  (the bonus XP for this chest)
 *   onDone    — () => void  (called when the animation completes and user can proceed)
 */
export default function ChestReveal({ chestType, xpReward, onDone }) {
  const cfg = CHEST_CONFIG[chestType] ?? CHEST_CONFIG.bronze
  // phase: 'closed' → 'opening' → 'revealed'
  const [phase, setPhase] = useState('closed')

  // Auto-open after 700ms if user hasn't tapped
  useEffect(() => {
    if (phase !== 'closed') return
    const t = setTimeout(() => setPhase('opening'), 700)
    return () => clearTimeout(t)
  }, [phase])

  // After opening animation completes, move to revealed
  function handleOpenEnd() {
    if (phase === 'opening') setPhase('revealed')
  }

  function handleChestTap() {
    if (phase === 'closed') setPhase('opening')
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-3 select-none"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tier label */}
      <motion.span
        className="text-xs font-black uppercase tracking-widest"
        style={{ color: cfg.textColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {chestType.toUpperCase()} CHEST
      </motion.span>

      {/* Chest + sparkle area */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <AnimatePresence mode="wait">
          {phase === 'closed' && (
            <motion.button
              key="closed"
              onClick={handleChestTap}
              className="absolute focus:outline-none"
              style={{
                filter: `drop-shadow(0 0 14px ${cfg.glowColor}88)`,
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              aria-label={`Open ${chestType} chest`}
            >
              <ChestIcon cfg={cfg} />
            </motion.button>
          )}

          {phase === 'opening' && (
            <motion.div
              key="opening"
              className="absolute"
              style={{ filter: `drop-shadow(0 0 20px ${cfg.glowColor})` }}
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: [1, 1.3, 0], rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              onAnimationComplete={handleOpenEnd}
            >
              <ChestIcon cfg={cfg} />
            </motion.div>
          )}

          {phase === 'revealed' && (
            <motion.div
              key="revealed"
              className="relative flex flex-col items-center gap-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            >
              <Sparks color={cfg.glowColor} />
              <XPCounter target={xpReward} color={cfg.xpColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Descriptive label + continue button */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
          >
            <span
              className="font-black text-base tracking-wide"
              style={{ color: cfg.textColor }}
            >
              {cfg.label}
            </span>
            <motion.button
              onClick={onDone}
              className="px-6 py-2 rounded-2xl font-bold text-sm tracking-wide text-linguo-smokyBlack"
              style={{ background: cfg.gradient }}
              whileHover={{ scale: 1.06, filter: 'hue-rotate(10deg) brightness(1.1)' }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
