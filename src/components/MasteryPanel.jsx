import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { allMasteryRecords, masterySummary, dueCategories } from '../data/mastery.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(ts) {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const min  = Math.floor(diff / 60_000)
  const hr   = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (min < 2)   return 'just now'
  if (min < 60)  return `${min}m ago`
  if (hr  < 24)  return `${hr}h ago`
  return `${days}d ago`
}

function fmtDue(nextDueTs) {
  if (!nextDueTs || nextDueTs === 0) return null
  const diff = nextDueTs - Date.now()
  if (diff <= 0) return 'due now'
  const hr   = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (hr < 1)   return 'due <1h'
  if (hr < 24)  return `due in ${hr}h`
  return `due in ${days}d`
}

// ─── Score colour ─────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 0.75) return { bar: '#00917A', text: 'text-linguo-teal',          label: 'Strong' }
  if (score >= 0.45) return { bar: '#7DCAF6', text: 'text-linguo-malibu',        label: 'Learning' }
  return                     { bar: '#F47575', text: 'text-linguo-lightCoral',    label: 'Needs work' }
}

// ─── Category row ─────────────────────────────────────────────────────────────

function CategoryRow({ category, record, score, isDue, index }) {
  const pct   = Math.round(score * 100)
  const col   = scoreColor(score)
  const acc   = record.seen > 0 ? Math.round((record.correct / record.seen) * 100) : 0
  const due   = fmtDue(record.nextDueTs)

  return (
    <motion.div
      className="flex flex-col gap-1.5 py-3 border-b border-white/6 last:border-0"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Due indicator */}
          {isDue && (
            <motion.span
              className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-linguo-lightCoral"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          <span className="font-semibold text-linguo-fantasy/90 text-xs truncate">{category}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {due && (
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDue ? 'text-linguo-lightCoral' : 'text-linguo-fantasy/35'}`}>
              {due}
            </span>
          )}
          <span className={`text-[10px] font-black ${col.text}`}>{pct}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[5px] bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: col.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[9px] text-linguo-fantasy/35">
        <span>{record.seen} seen</span>
        <span>✓ {acc}% accuracy</span>
        <span>{record.correct}✓ {record.wrong}✗</span>
        {record.lastSeenTs > 0 && <span>{fmtRelative(record.lastSeenTs)}</span>}
      </div>
    </motion.div>
  )
}

// ─── Summary chips ────────────────────────────────────────────────────────────

function SummaryChip({ label, value, color }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${color} min-w-[64px]`}>
      <span className="font-black text-lg leading-none tabular-nums">{value}</span>
      <span className="text-[9px] uppercase tracking-widest opacity-70 mt-0.5">{label}</span>
    </div>
  )
}

// ─── MasteryPanel ─────────────────────────────────────────────────────────────

/**
 * Props:
 *   open    — boolean
 *   onClose — () => void
 */
export default function MasteryPanel({ open, onClose }) {
  const records = useMemo(() => allMasteryRecords(), [open])  // recompute when opened
  const summary = useMemo(() => masterySummary(), [open])
  const due     = useMemo(() => new Set(dueCategories()), [open])

  const hasData = records.length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[76] max-h-[85dvh] flex flex-col bg-linguo-smokyBlack border-t border-white/10 rounded-t-2xl overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          >
            {/* Handle */}
            <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 px-4 border-b border-white/8">
              <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg select-none">📊</span>
                  <span className="font-black text-linguo-fantasy text-sm tracking-wide">Grammar Progress</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-linguo-fantasy/40 hover:text-linguo-fantasy/80 transition-colors text-lg leading-none focus:outline-none"
                  aria-label="Close mastery panel"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!hasData ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-5xl select-none">🌱</span>
                  <p className="text-linguo-fantasy/50 text-sm max-w-xs">
                    Play some grammar levels, Grammar Duel or Sentence Builder to start tracking your progress!
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary chips */}
                  <div className="flex gap-2 justify-center mb-5">
                    <SummaryChip
                      label="Tracked"
                      value={summary.total}
                      color="border-white/15 text-linguo-fantasy/70"
                    />
                    <SummaryChip
                      label="Strong"
                      value={summary.mastered}
                      color="border-linguo-teal/30 bg-linguo-teal/8 text-linguo-teal"
                    />
                    <SummaryChip
                      label="Needs work"
                      value={summary.struggling}
                      color="border-linguo-lightCoral/30 bg-linguo-lightCoral/8 text-linguo-lightCoral"
                    />
                    <SummaryChip
                      label="Due"
                      value={due.size}
                      color="border-linguo-lightGold/30 bg-linguo-lightGold/8 text-linguo-lightGold"
                    />
                  </div>

                  {/* Due section */}
                  {due.size > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-linguo-lightCoral/70 mb-1 flex items-center gap-1.5">
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >●</motion.span>
                        Review due
                      </p>
                      <p className="text-linguo-fantasy/40 text-[10px] mb-3">
                        Open Grammar Duel or Sentence Builder — they'll prioritise these categories.
                      </p>
                    </div>
                  )}

                  {/* Category list */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-linguo-fantasy/30 mb-1">
                      All categories
                    </p>
                    {records.map((r, i) => (
                      <CategoryRow
                        key={r.category}
                        category={r.category}
                        record={r.record}
                        score={r.score}
                        isDue={due.has(r.category)}
                        index={i}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
