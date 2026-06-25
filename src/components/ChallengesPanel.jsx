// ─── ChallengesPanel ──────────────────────────────────────────────────────────
// Collapsible overlay showing today's 3 daily challenges with progress bars.

import { motion, AnimatePresence } from 'framer-motion'
import { CAKE_TARGET } from '../data/events.js'

// ── Cake o'clock event row ──────────────────────────────────────────────────

function fmtMs(ms) {
  const s = Math.ceil(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function CakeEventRow({ progress, granted, infiniteRemainingMs }) {
  const pct         = Math.min(1, progress / CAKE_TARGET)
  const infiniteOn  = infiniteRemainingMs > 0

  return (
    <motion.div
      layout
      className="
        w-full rounded-2xl px-4 py-3
        bg-linguo-lightGold/8 border border-linguo-lightGold/35
        flex flex-col gap-2
      "
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none select-none">🎂</span>
          <p className="text-xs font-bold text-linguo-lightGold leading-snug">
            Cake o’clock
          </p>
        </div>
        {infiniteOn ? (
          <span className="text-linguo-lightGold text-[10px] font-black tabular-nums flex-shrink-0">
            ♥∞ {fmtMs(infiniteRemainingMs)}
          </span>
        ) : granted ? (
          <span className="text-linguo-lightGold text-base leading-none flex-shrink-0">✓</span>
        ) : (
          <span className="text-linguo-lightGold/50 text-[10px] font-bold flex-shrink-0">
            15 min ♥∞
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"
        role="progressbar"
        aria-label={`Cake o'clock: ${Math.min(progress, CAKE_TARGET)} of ${CAKE_TARGET} levels`}
        aria-valuenow={Math.min(progress, CAKE_TARGET)}
        aria-valuemin={0}
        aria-valuemax={CAKE_TARGET}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #FFDA57, #F5C200)' }}
          aria-hidden="true"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Sub-label */}
      <p className="text-[10px] text-linguo-lightGold/50 font-bold tabular-nums">
        {infiniteOn
          ? 'Unlimited lives active — play now!'
          : granted
          ? 'Completed today — great session!'
          : `Complete ${Math.min(progress, CAKE_TARGET)} / ${CAKE_TARGET} levels to unlock`}
      </p>
    </motion.div>
  )
}

// ── Single challenge card ─────────────────────────────────────────────────────

function ChallengeCard({ challenge, current, done }) {
  const pct = Math.min(1, current / challenge.target)

  return (
    <motion.div
      layout
      className="
        w-full rounded-2xl px-4 py-3
        bg-linguo-smokyBlack border border-linguo-brightLavender/20
        flex flex-col gap-2
      "
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {/* Label row */}
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-semibold leading-snug flex-1 ${done ? 'text-linguo-fantasy/50 line-through' : 'text-linguo-fantasy/90'}`}>
          {challenge.label}
        </p>
        {done
          ? <span className="text-linguo-lightGold text-base leading-none flex-shrink-0">✓</span>
          : <span className="text-linguo-brightLavender/50 text-[10px] font-bold flex-shrink-0 mt-0.5">
              +{challenge.xpReward} XP
            </span>
        }
      </div>

      {/* Progress bar — role=progressbar for screen readers */}
      <div
        className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"
        role="progressbar"
        aria-label={`${challenge.label}: ${Math.min(current, challenge.target)} of ${challenge.target}`}
        aria-valuenow={Math.min(current, challenge.target)}
        aria-valuemin={0}
        aria-valuemax={challenge.target}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #40B8A6, #00917A)' }}
          aria-hidden="true"
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Count label */}
      <p className="text-[10px] text-linguo-fantasy/40 font-bold tabular-nums">
        {Math.min(current, challenge.target)} / {challenge.target}
      </p>
    </motion.div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────

/**
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   challenges — array of challenge objects (from getDailyChallenges)
 *   progress   — { [id]: count }
 *   completed  — Set<string>  (ids already fully completed today)
 */
export default function ChallengesPanel({ open, onClose, challenges, progress, completed, cakeProgress = 0, cakeGranted = false, infiniteRemainingMs = 0 }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="
              fixed top-16 right-3 z-[46]
              w-72
              bg-linguo-smokyBlack border border-linguo-brightLavender/25
              rounded-2xl p-4
              flex flex-col gap-3
              shadow-2xl shadow-black/60
            "
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <span className="font-black text-sm text-linguo-fantasy tracking-wide uppercase">
                  Daily Challenges
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-linguo-fantasy/40 hover:text-linguo-fantasy/80 text-lg leading-none transition-colors focus:outline-none"
                aria-label="Close challenges panel"
              >
                ×
              </button>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/10" />

            {/* Cake o'clock event row */}
            <CakeEventRow
              progress={cakeProgress}
              granted={cakeGranted}
              infiniteRemainingMs={infiniteRemainingMs}
            />

            {/* Divider */}
            <div className="w-full h-px bg-white/8" />

            {/* Challenge cards */}
            {challenges.map((ch) => (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                current={progress[ch.id] ?? 0}
                done={completed.has(ch.id)}
              />
            ))}

            {/* All done message */}
            {challenges.length > 0 && challenges.every((ch) => completed.has(ch.id)) && (
              <motion.p
                className="text-center text-linguo-lightGold text-xs font-bold uppercase tracking-widest pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                All challenges complete! 🏆
              </motion.p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
