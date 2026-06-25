// ─── GameOverScreen ────────────────────────────────────────────────────────────
// Loss-aversion game-over screen (Homescapes psychology).
// Shows what the player stands to lose, offers +5 moves as the primary CTA.

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Loss item pill ─────────────────────────────────────────────────────────────

function LossPill({ icon, label }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-linguo-lightCoral/10 border border-linguo-lightCoral/25 w-full"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <span className="text-base leading-none select-none">{icon}</span>
      <span className="text-linguo-lightCoral/90 text-xs font-semibold leading-snug">{label}</span>
    </motion.div>
  )
}

// ── Countdown formatter ────────────────────────────────────────────────────────

function fmtMs(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Props:
 *   streak           — number   current multiplier streak
 *   coins            — number   current Lingot balance
 *   lives            — number
 *   nextLifeMs       — number
 *   dailyMode        — boolean
 *   dailyStreakCount  — number   consecutive days played
 *   challengeProgress — object  { [challengeId]: number }
 *   dailyChallenges   — array   challenge definitions with { id, label, target }
 *   extraMovesCost   — number   Lingot cost for +5 moves
 *   onBuyMoves       — () => void
 *   onSurrender      — () => void
 */
export default function GameOverScreen({
  streak,
  coins,
  lives,
  nextLifeMs,
  dailyMode,
  dailyStreakCount,
  challengeProgress,
  dailyChallenges,
  extraMovesCost,
  onBuyMoves,
  onSurrender,
  lostByStrikes,
}) {
  const canAfford = coins >= extraMovesCost
  const missing   = extraMovesCost - coins

  // ── Build loss items ─────────────────────────────────────────────────────────
  const lossItems = useMemo(() => {
    const items = []

    // 1. Streak
    if (streak > 1) {
      const mult = Math.min(1 + (streak - 1) * 0.5, 5).toFixed(1)
      items.push({ icon: '🔥', label: `You'll lose your ×${mult} chain streak` })
    }

    // 2. Daily challenges that are 1–2 steps away from completion
    if (Array.isArray(dailyChallenges) && challengeProgress) {
      dailyChallenges.forEach((ch) => {
        const current = challengeProgress[ch.id] ?? 0
        const remaining = ch.target - current
        if (remaining > 0 && remaining <= 2) {
          items.push({
            icon: '🎯',
            label: `"${ch.label}" is only ${remaining} away — you'll miss the reward`,
          })
        }
      })
    }

    // 3. Daily streak warning (surrender means today's session ends incomplete)
    if (!dailyMode && dailyStreakCount > 0) {
      items.push({
        icon: '📅',
        label: `Your ${dailyStreakCount}-day streak is on the line`,
      })
    }

    return items
  }, [streak, dailyChallenges, challengeProgress, dailyMode, dailyStreakCount])

  return (
    <motion.div
      className="w-full text-center mt-8 flex flex-col items-center gap-5"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 26 }}
    >
      {/* ── Headline ── */}
      <div className="flex flex-col items-center gap-1">
        <motion.p
          className="text-4xl font-extrabold text-linguo-lightCoral"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        >
          Out of moves!
        </motion.p>
        <p className="text-linguo-fantasy/40 text-xs uppercase tracking-widest">
          Don't give up — you're so close
        </p>
      </div>

      {/* ── Loss items (what you'll lose) ── */}
      <AnimatePresence>
        {lossItems.length > 0 && (
          <motion.div
            className="w-full max-w-xs flex flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {lossItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.08, type: 'spring', stiffness: 280, damping: 24 }}
              >
                <LossPill icon={item.icon} label={item.label} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Primary CTA: Buy +5 moves ── */}
      {!lostByStrikes && (
        <motion.div
          className="flex flex-col items-center gap-2 w-full max-w-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <motion.button
            onClick={canAfford ? onBuyMoves : undefined}
            disabled={!canAfford}
            className={`
              w-full py-4 rounded-2xl font-black text-base tracking-wide
              shadow-xl transition-all duration-150 focus:outline-none
              ${canAfford
                ? 'bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender text-linguo-smokyBlack shadow-linguo-brightLavender/30 cursor-pointer'
                : 'bg-white/8 border border-white/15 text-linguo-fantasy/35 cursor-not-allowed shadow-none'}
            `}
            whileHover={canAfford ? { scale: 1.04, filter: 'brightness(1.08)' } : {}}
            whileTap={canAfford ? { scale: 0.96 } : {}}
          >
            <span className="flex items-center justify-center gap-2">
              <span>+5 Moves</span>
              <span className="flex items-center gap-0.5 text-sm font-bold opacity-80">
                <span>🪙</span>
                <span>{extraMovesCost}</span>
              </span>
            </span>
          </motion.button>

          {/* Coin balance feedback */}
          {canAfford ? (
            <p className="text-linguo-fantasy/35 text-xs">
              Balance: <span className="text-linguo-lightGold font-bold">🪙 {coins}</span>
              {' '}→ <span className="font-bold">🪙 {coins - extraMovesCost}</span>
            </p>
          ) : (
            <p className="text-linguo-fantasy/40 text-xs">
              Need <span className="text-linguo-lightCoral font-bold">🪙 {missing} more</span> — earn lingots by completing levels
            </p>
          )}
        </motion.div>
      )}

      {/* ── Separator ── */}
      <div className="w-full max-w-xs flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-linguo-fantasy/25 text-[10px] uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {lostByStrikes && (
        <div className="w-full text-center px-4 py-3 rounded-xl bg-linguo-lightCoral/10 border border-linguo-lightCoral/25">
          <p className="text-linguo-lightCoral font-bold text-sm">Too many wrong taps</p>
          <p className="text-linguo-fantasy/50 text-xs mt-1">3 strikes — level failed</p>
        </div>
      )}

      {/* ── Secondary: Surrender ── */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.42 }}
      >
        <motion.button
          onClick={onSurrender}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-linguo-fantasy/50 border border-white/12 bg-white/4 hover:bg-white/8 hover:text-linguo-fantasy/70 transition-all focus:outline-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {dailyMode ? '← Exit daily' : 'Give up this round'}
        </motion.button>

        {/* Life cost warning (non-daily only) */}
        {!dailyMode && (
          <p className="text-linguo-fantasy/25 text-[10px]">
            {lives > 0
              ? '❤️ Costs 1 life to surrender'
              : `💔 No lives — next in ${nextLifeMs > 0 ? fmtMs(nextLifeMs) : '…'}`}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
