// ─── LevelTimer ───────────────────────────────────────────────────────────────
// Soft countdown timer per level. Reaching zero does NOT end the level;
// it fires onExpire once and downgrades the chest to bronze.
//
// Props:
//   durationSeconds — total seconds for this level (from getDifficulty)
//   paused          — true when levelComplete or isGameOver
//   onExpire        — () => void — called exactly once when the timer hits 0
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function LevelTimer({ durationSeconds, paused = false, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const expiredRef   = useRef(false)
  const pausedRef    = useRef(paused)

  // Keep ref in sync so the interval closure always reads the latest value
  useEffect(() => { pausedRef.current = paused }, [paused])

  // Reset when durationSeconds changes (new level via key prop on parent)
  useEffect(() => {
    setSecondsLeft(durationSeconds)
    expiredRef.current = false
  }, [durationSeconds])

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpire?.()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  // onExpire intentionally omitted — stable callback via useCallback in parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct      = Math.max(0, secondsLeft / durationSeconds)
  const expired  = secondsLeft === 0
  const warning  = secondsLeft <= 10 && !expired
  const critical = secondsLeft <= 5  && !expired

  // Color ramp: teal → amber → red
  const barColor = expired  ? '#EF4444'
                 : critical ? '#EF4444'
                 : warning  ? '#F59E0B'
                 : '#00917A'

  const textColor = expired  ? 'text-red-400'
                  : critical ? 'text-red-400'
                  : warning  ? 'text-amber-400'
                  : 'text-linguo-fantasy/50'

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-2 w-full" aria-label={`Level timer: ${label}`}>
      {/* Countdown text */}
      <motion.span
        key={expired ? 'expired' : warning ? 'warning' : 'normal'}
        className={`flex-shrink-0 text-[10px] font-black tabular-nums leading-none ${textColor}`}
        animate={critical ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={critical ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' } : {}}
      >
        {expired ? 'TIME' : label}
      </motion.span>

      {/* Progress bar */}
      <div className="flex-1 h-[3px] bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
