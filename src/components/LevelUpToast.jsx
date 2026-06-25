// ─── LevelUpToast ─────────────────────────────────────────────────────────────
// Animated toast that appears when the player reaches a new player level.

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Props:
 *   show        — boolean
 *   playerLevel — number  (the new level just reached)
 *   onDone      — () => void  (called after auto-dismiss)
 */
export default function LevelUpToast({ show, playerLevel, onDone }) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [show, playerLevel, onDone])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={playerLevel}
          className="
            fixed top-14 left-1/2 z-[60]
            flex items-center gap-2 px-5 py-2.5
            rounded-2xl shadow-2xl shadow-black/60
            pointer-events-none select-none
          "
          style={{
            background: 'linear-gradient(135deg, #A293FF, #7DCAF6)',
            x: '-50%',
          }}
          initial={{ opacity: 0, y: -24, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        >
          <span className="text-xl leading-none">⬆</span>
          <span
            className="font-black tracking-wide text-sm"
            style={{ color: '#100F06' }}
          >
            Level Up! Lvl {playerLevel}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
