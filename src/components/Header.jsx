// ─── Header ───────────────────────────────────────────────────────────────────
// Two-row fixed header:
//   Row 1 — left zone (logo + nav buttons) | right zone (resources + settings)
//   Row 2 — level progress bar (full width)
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PlayerLevelBadge from './PlayerLevelBadge.jsx'
import { isMuted, toggleMute } from '../audio/sfx.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Animated counter (RAF ease-out cubic) ─────────────────────────────────────
function AnimCounter({ value, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef  = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to   = value
    prevRef.current = value
    if (from === to) return
    cancelAnimationFrame(rafRef.current)
    const duration = 550
    const start    = performance.now()
    function tick(now) {
      const t     = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <span className={`tabular-nums ${className}`}>{display}</span>
}

// ── IconBtn — small circular icon button ──────────────────────────────────────
function IconBtn({ onClick, title, ariaLabel, ariaPressed, children, active = false, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-pressed={ariaPressed}
      className={[
        'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
        'text-[13px] border transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-white/30',
        active  ? 'bg-linguo-teal/20 border-linguo-teal/50 text-linguo-teal'
                : danger
                ? 'bg-white/5 border-white/15 text-linguo-fantasy/40 hover:border-linguo-lightCoral/50 hover:text-linguo-lightCoral'
                : 'bg-white/5 border-white/15 text-linguo-fantasy/40 hover:border-white/30 hover:text-linguo-fantasy/80',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── NavBtn — pill button for Daily / Challenges ───────────────────────────────
function NavBtn({ onClick, title, active, accentOn, accentOff, badge, icon, label }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={[
        'relative flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full',
        'text-[10px] font-black uppercase tracking-wider border',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/20',
        active ? accentOn : accentOff,
      ].join(' ')}
    >
      {icon}
      {label && <span className="hidden sm:inline">{label}</span>}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-linguo-lightGold text-linguo-smokyBlack text-[8px] font-black flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Strikes HUD ─────────────────────────────────────────────────────────────
// Shows level-specific mistake indicators — visually distinct from global ❤️ lives.
function StrikesHUD({ strikes = 0, maxStrikes = 3 }) {
  if (maxStrikes <= 0) return null
  return (
    <div
      className="flex items-center gap-[3px]"
      title={`Level strikes: ${strikes}/${maxStrikes} — ${maxStrikes - strikes} remaining`}
    >
      {Array.from({ length: maxStrikes }).map((_, i) => {
        const consumed = i < strikes
        return (
          <motion.span
            key={`strike-${i}-${consumed}`}
            className="text-[13px] leading-none select-none"
            style={{
              opacity:   consumed ? 1    : 0.22,
              filter:    consumed ? 'none' : 'grayscale(1) brightness(0.5)',
            }}
            initial={consumed ? { scale: 1.6, filter: 'brightness(2) saturate(2)' } : false}
            animate={{ scale: 1, filter: consumed ? 'none' : 'grayscale(1) brightness(0.5)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {consumed ? '💢' : '🛡️'}
          </motion.span>
        )
      })}
    </div>
  )
}

// ── Lives chip ────────────────────────────────────────────────────────────────
function LivesChip({ lives, maxLives, nextLifeMs, infiniteRemainingMs }) {
  const infinite = infiniteRemainingMs > 0

  if (infinite) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full border border-linguo-brightLavender/50 bg-linguo-brightLavender/10"
        title={`Infinite lives — ${fmtMs(infiniteRemainingMs)} remaining`}
      >
        <span className="text-[12px] leading-none">♾️</span>
        <span className="text-[10px] font-black text-linguo-brightLavender tabular-nums">
          {fmtMs(infiniteRemainingMs)}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center gap-0"
      title={`${lives}/${maxLives} lives${lives < maxLives && nextLifeMs > 0 ? ` · next in ${fmtMs(nextLifeMs)}` : ''}`}
    >
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: maxLives }).map((_, i) => (
          <span
            key={i}
            className="text-[12px] leading-none select-none transition-all duration-300"
            style={{
              opacity:   i < lives ? 1    : 0.18,
              filter:    i < lives ? 'none' : 'grayscale(1) brightness(0.5)',
              transform: i < lives ? 'scale(1)' : 'scale(0.85)',
            }}
          >
            ❤️
          </span>
        ))}
      </div>
      {lives < maxLives && nextLifeMs > 0 && (
        <span className="text-[9px] font-bold tabular-nums text-linguo-lightCoral leading-none mt-[2px]">
          +{fmtMs(nextLifeMs)}
        </span>
      )}
    </div>
  )
}

// ── Settings popover ──────────────────────────────────────────────────────────
function SettingsPopover({ open, onClose, isMuted, onToggleMute, onShowTutorial, onResetProgress, onShowMastery, onToggleDuel, onToggleBuilder, duelMode, builderMode }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-[180px] py-1 rounded-xl border border-white/12 bg-[#1a1910] shadow-2xl shadow-black/60"
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: -4, scale: 0.96 }}
          transition={{ duration: 0.14 }}
        >
          {/* Mute toggle */}
          <button
            onClick={() => { onToggleMute(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-fantasy/70 hover:text-linguo-fantasy hover:bg-white/5 transition-colors"
          >
            <span className="text-base">{isMuted ? '🔇' : '🔊'}</span>
            {isMuted ? 'Unmute sounds' : 'Mute sounds'}
          </button>

          <div className="h-px mx-3 bg-white/8 my-0.5" />

          {/* Grammar Progress */}
          <button
            onClick={() => { onShowMastery?.(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-fantasy/70 hover:text-linguo-fantasy hover:bg-white/5 transition-colors"
          >
            <span className="text-base">📊</span>
            Grammar progress
          </button>

          <div className="h-px mx-3 bg-white/8 my-0.5" />

          {/* Grammar Duel */}
          <button
            onClick={() => { onToggleDuel(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-fantasy/70 hover:text-linguo-fantasy hover:bg-white/5 transition-colors"
          >
            <span className="text-base">⚔️</span>
            {duelMode ? 'Exit Grammar Duel' : 'Grammar Duel'}
          </button>

          {/* Sentence Builder */}
          <button
            onClick={() => { onToggleBuilder(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-fantasy/70 hover:text-linguo-fantasy hover:bg-white/5 transition-colors"
          >
            <span className="text-base">🧩</span>
            {builderMode ? 'Exit Sentence Builder' : 'Sentence Builder'}
          </button>

          <div className="h-px mx-3 bg-white/8 my-0.5" />

          {/* Tutorial */}
          <button
            onClick={() => { onShowTutorial(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-fantasy/70 hover:text-linguo-fantasy hover:bg-white/5 transition-colors"
          >
            <span className="text-base">📖</span>
            Ver tutorial otra vez
          </button>

          <div className="h-px mx-3 bg-white/8 my-0.5" />

          {/* Reset */}
          <button
            onClick={() => { onResetProgress(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-semibold text-linguo-lightCoral/70 hover:text-linguo-lightCoral hover:bg-white/5 transition-colors"
          >
            <span className="text-base">↺</span>
            Reset progress
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
/**
 * Props (existing):
 *   score, movesLeft, level, totalLevels, progress, onResetProgress,
 *   dailyMode, onToggleDaily, playerLevel, playerProgress, dailyStreakCount,
 *   challengesOpen, onToggleChallenges, completedChallengesCount,
 *   lives, maxLives, nextLifeMs, coins
 *
 * Props (new — wire from App.jsx):
 *   isMuted           — boolean  (controlled mute state from App)
 *   onToggleMute      — () => void
 *   onShowTutorial    — () => void  (clears onboarding key + relaunches)
 *   infiniteRemainingMs — number  (ms until infinite lives expire, 0 if inactive)
 */
export default function Header({
  score, movesLeft, level, totalLevels, progress,
  onResetProgress,
  dailyMode, onToggleDaily,
  duelMode = false, onToggleDuel,
  builderMode = false, onToggleBuilder,
  playerLevel, playerProgress, dailyStreakCount,
  challengesOpen, onToggleChallenges, completedChallengesCount,
  lives = 5, maxLives = 5, nextLifeMs = 0,
  coins = 0,
  isMuted: isMutedProp = false,
  onToggleMute,
  onShowTutorial,
  onShowMastery,
  infiniteRemainingMs = 0,
  strikes = 0,
  maxStrikes = 3,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsBtnRef = useRef(null)

  // Internal mute state mirrors prop so it still works if prop isn't wired yet
  const [mutedLocal, setMutedLocal] = useState(() => isMuted())
  const effectiveMuted = onToggleMute != null ? isMutedProp : mutedLocal

  const handleToggleMute = useCallback(() => {
    if (onToggleMute) {
      onToggleMute()
    } else {
      toggleMute()
      setMutedLocal(isMuted())
    }
  }, [onToggleMute])

  const handleShowTutorial = useCallback(() => {
    if (onShowTutorial) {
      onShowTutorial()
    } else {
      localStorage.removeItem('linguo-onboarding-done')
      window.location.reload()
    }
  }, [onShowTutorial])

  // ── Progress bar color: Teal → LightGold as progress grows ──────────────────
  const pct = Math.round(progress * 100)
  const t   = Math.min(1, Math.max(0, progress))
  const barR = Math.round(0x00 + (0xFF - 0x00) * t)
  const barG = Math.round(0x91 + (0xDA - 0x91) * t)
  const barB = Math.round(0x7A + (0x57 - 0x7A) * t)
  const barColor      = `rgb(${barR},${barG},${barB})`
  const barColorLight = `rgb(${Math.min(255, barR + 40)},${Math.min(255, barG + 40)},${Math.min(255, barB + 40)})`

  // ── Moves coloring thresholds ────────────────────────────────────────────────
  const movesColor =
    movesLeft > 10 ? 'text-linguo-fantasy' :
    movesLeft > 5  ? 'text-linguo-lightGold' :
                     'text-linguo-lightCoral'
  const movesBg =
    movesLeft > 10 ? 'bg-white/5 border-white/15' :
    movesLeft > 5  ? 'bg-linguo-lightGold/10 border-linguo-lightGold/30' :
                     'bg-linguo-lightCoral/15 border-linguo-lightCoral/40'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-linguo-smokyBlack border-b border-white/8 select-none">

      {/* ── Row 1: Nav | Resources ── */}
      <div className="px-3 sm:px-4 h-12 flex items-center gap-2">

        {/* ──── LEFT ZONE ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Logo */}
          <span className="font-black tracking-widest text-base leading-none select-none bg-gradient-to-r from-linguo-blossomPink to-linguo-brightLavender bg-clip-text text-transparent whitespace-nowrap">
            ✦ LINGUO
          </span>

          {/* Daily */}
          <NavBtn
            onClick={onToggleDaily}
            title={dailyMode ? 'Exit daily mode' : "Play today's daily puzzle"}
            active={dailyMode}
            accentOn="bg-linguo-malibu/20 border-linguo-malibu/60 text-linguo-malibu"
            accentOff="bg-white/5 border-white/15 text-linguo-fantasy/50 hover:border-linguo-malibu/50 hover:text-linguo-malibu"
            icon="🗓"
            label="Daily"
          />

          {/* Challenges */}
          <NavBtn
            onClick={onToggleChallenges}
            title="Daily Challenges"
            active={challengesOpen}
            accentOn="bg-linguo-teal/20 border-linguo-teal/60 text-linguo-teal"
            accentOff="bg-white/5 border-white/15 text-linguo-fantasy/50 hover:border-linguo-teal/50 hover:text-linguo-teal"
            badge={completedChallengesCount}
            icon="🎯"
          />

          {/* Daily streak */}
          {dailyStreakCount >= 2 && (
            <span className="hidden sm:flex items-center gap-0.5 text-linguo-lightGold font-black text-[11px]">
              �{dailyStreakCount}
            </span>
          )}
        </div>

        {/* ──── SPACER ─────────────────────────────────────────────────────── */}
        <div className="flex-1" />

        {/* ──── RIGHT ZONE ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Level strikes — distinct from global ❤️ lives */}
          <StrikesHUD strikes={strikes} maxStrikes={maxStrikes} />

          {/* Moves — most important tension resource */}
          <motion.div
            key={movesLeft}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border font-black transition-colors duration-300 ${movesBg} ${movesColor}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            title={`${movesLeft} moves remaining`}
          >
            <span className="text-[13px] leading-none">↯</span>
            <span className="text-[13px] tabular-nums">{movesLeft}</span>
          </motion.div>

          {/* Coins */}
          <motion.div
            key={coins}
            className="flex items-center gap-1 px-2 py-1 rounded-full border border-linguo-lightGold/30 bg-linguo-lightGold/5"
            title="Lingots"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <span className="text-[12px] leading-none">🪙</span>
            <span className="text-[11px] font-black text-linguo-lightGold">
              <AnimCounter value={coins} />
            </span>
          </motion.div>

          {/* Lives */}
          <LivesChip
            lives={lives}
            maxLives={maxLives}
            nextLifeMs={nextLifeMs}
            infiniteRemainingMs={infiniteRemainingMs}
          />

          {/* Score — secondary, desktop only */}
          <span className="hidden md:flex items-center gap-1 text-[11px] text-linguo-fantasy/50 font-bold">
            <span className="text-linguo-lightGold text-[13px] leading-none">⬡</span>
            {score.toLocaleString()}
          </span>

          {/* Player level badge */}
          <PlayerLevelBadge playerLevel={playerLevel} progress={playerProgress} size={28} />

          {/* Settings gear ⚙ */}
          <div className="relative">
            <IconBtn
              onClick={() => setSettingsOpen((o) => !o)}
              title="Settings"
              ariaLabel="Open settings"
              ariaPressed={settingsOpen}
              active={settingsOpen}
            >
              ⚙
            </IconBtn>
            <SettingsPopover
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              isMuted={effectiveMuted}
              onToggleMute={handleToggleMute}
              onShowTutorial={handleShowTutorial}
              onResetProgress={onResetProgress}
              onShowMastery={onShowMastery}
              onToggleDuel={onToggleDuel}
              onToggleBuilder={onToggleBuilder}
              duelMode={duelMode}
              builderMode={builderMode}
            />
          </div>
        </div>
      </div>

      {/* ── Row 2: Level progress bar ── */}
      <div className="px-3 sm:px-4 pb-1.5 flex items-center gap-2">
        <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-linguo-fantasy/35 whitespace-nowrap">
          Lv {level}<span className="text-linguo-fantasy/20">/{totalLevels}</span>
        </span>
        <div className="flex-1 h-[5px] bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${barColorLight}, ${barColor})` }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
        <span className="flex-shrink-0 text-[9px] font-bold text-linguo-fantasy/35 tabular-nums w-6 text-right">
          {pct}%
        </span>
      </div>

    </header>
  )
}
