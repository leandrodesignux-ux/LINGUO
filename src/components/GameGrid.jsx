import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { playChain, playWrong } from '../audio/sfx.js'

const COLOR_HEX   = { gold: '#FFDA57', cyan: '#7DCAF6', lime: '#34D9B3', pink: '#FFBBF4', purple: '#C4B8FF' }
const COLOR_LABEL = { gold: 'Gold',    cyan: 'Blue',    lime: 'Green',   pink: 'Pink',    purple: 'Purple'  }

// ── Plate palette — solid tile backgrounds ──────────────────────────────────
const PLATE_BG = {
  pink:   '#2a1a2e',
  purple: '#1a1535',
  gold:   '#2a2010',
  cyan:   '#0e1f2e',
  lime:   '#0a2018',
}
const PLATE_BORDER = {
  pink:   'rgba(255,150,230,0.35)',
  purple: 'rgba(162,147,255,0.40)',
  gold:   'rgba(255,218,87,0.35)',
  cyan:   'rgba(125,202,246,0.35)',
  lime:   'rgba(0,145,122,0.40)',
}
const PLATE_TEXT = {
  pink:   '#FFBBF4',
  purple: '#C4B8FF',
  gold:   '#FFDA57',
  cyan:   '#7DCAF6',
  lime:   '#34D9B3',
}
const PLATE_SHADOW = {
  pink:   '0 4px 12px rgba(255,100,220,0.18)',
  purple: '0 4px 12px rgba(100,80,255,0.22)',
  gold:   '0 4px 12px rgba(200,160,0,0.20)',
  cyan:   '0 4px 12px rgba(0,120,200,0.20)',
  lime:   '0 4px 12px rgba(0,145,122,0.22)',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellCenter(el) {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function cellAriaLabel(cell) {
  if (cell.revealed)              return 'revealed'
  if (cell.phraseIndex !== null)  return `tap to reveal letter ${cell.letter}`
  return `decoy ${cell.decoyChar}`
}

// ─── Particle burst ───────────────────────────────────────────────────────────

const PARTICLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

function GemParticles({ bursts }) {
  if (bursts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 51 }}>
      {bursts.map(({ id, x, y, color }) =>
        PARTICLE_ANGLES.map((angle, pi) => {
          const jitter = (pi % 3 - 1) * 8
          const rad    = ((angle + jitter) * Math.PI) / 180
          const dist   = 28 + (pi % 3) * 14
          const tx     = Math.cos(rad) * dist
          const ty     = Math.sin(rad) * dist
          const size   = pi % 2 === 0 ? 5 : 3
          const delay  = pi * 0.018
          return (
            <motion.div
              key={`${id}-p${pi}`}
              style={{
                position: 'absolute',
                left: x - size / 2,
                top:  y - size / 2,
                width:  size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                willChange: 'transform, opacity',
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: tx, y: ty, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.4, 1] }}
            />
          )
        })
      )}
    </div>
  )
}

// ─── CellTile ─────────────────────────────────────────────────────────────────
// Solid rounded plate — no clip-path, no absolute shape div, no inert state.

const CellTile = memo(function CellTile({ cell, isExploding, isShaking, isDecoyFailed, isActiveColor, cellRef, ariaLabel }) {
  const { revealed, color } = cell
  const displayChar = revealed ? null : (cell.letter ?? cell.decoyChar ?? null)
  const tappable    = !revealed

  const bg      = revealed ? '#111009' : isDecoyFailed ? '#3a0808' : PLATE_BG[color]     ?? '#1a1535'
  const border  = revealed ? 'rgba(255,255,255,0.06)' : isDecoyFailed ? 'rgba(220,60,60,0.7)' : PLATE_BORDER[color] ?? 'rgba(162,147,255,0.3)'
  const txtClr  = revealed ? '#333' : isDecoyFailed ? '#ff9090' : PLATE_TEXT[color]      ?? '#C4B8FF'
  const shadow  = revealed ? 'none' : isDecoyFailed ? '0 0 0 2px rgba(220,60,60,0.5)' : PLATE_SHADOW[color] ?? '0 4px 12px rgba(100,80,255,0.2)'

  return (
    <motion.div
      ref={cellRef}
      data-cell-id={cell.id}
      className={[
        'aspect-square w-full flex items-center justify-center select-none touch-none',
        'rounded-xl cursor-pointer',
        revealed ? 'opacity-30 cursor-default pointer-events-none' : '',
        isShaking ? 'tile-shake' : '',
      ].join(' ')}
      animate={isExploding
        ? { scale: [1, 1.45, 1.1, 0], opacity: [1, 1, 0.7, 0] }
        : { scale: 1, opacity: 1 }
      }
      transition={isExploding
        ? { duration: 0.44, times: [0, 0.35, 0.6, 1], ease: 'easeOut' }
        : { duration: 0.15 }
      }
      whileHover={tappable ? { scale: 1.07, transition: { duration: 0.12 } } : {}}
      whileTap={tappable   ? { scale: 0.91, transition: { duration: 0.08 } } : {}}
      style={{
        background: bg,
        border: isActiveColor ? `2.5px solid ${PLATE_BORDER[color] ?? 'rgba(162,147,255,0.4)'}` : `1.5px solid ${border}`,
        boxShadow: isActiveColor
          ? `${shadow}, 0 0 0 2.5px ${PLATE_BORDER[color] ?? 'rgba(162,147,255,0.4)'}`
          : shadow,
        transformOrigin: 'center',
      }}
      role="gridcell"
      aria-label={ariaLabel}
      aria-disabled={revealed}
    >
      {displayChar && (
        <motion.span
          key={`${cell.id}-${displayChar}`}
          style={{
            fontSize: 'clamp(14px, 5vw, 22px)',
            fontWeight: 800,
            fontFamily: "'Space Grotesk', monospace",
            color: txtClr,
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            letterSpacing: '-0.02em',
          }}
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {displayChar}
        </motion.span>
      )}
    </motion.div>
  )
}, (prev, next) =>
  prev.cell.revealed    === next.cell.revealed    &&
  prev.cell.isDecoy     === next.cell.isDecoy     &&
  prev.cell.letter      === next.cell.letter      &&
  prev.cell.decoyChar   === next.cell.decoyChar   &&
  prev.cell.color       === next.cell.color       &&
  prev.isExploding      === next.isExploding      &&
  prev.isShaking        === next.isShaking        &&
  prev.isDecoyFailed    === next.isDecoyFailed    &&
  prev.isActiveColor    === next.isActiveColor
)

// ─── GameGrid ─────────────────────────────────────────────────────────────────

/**
 * Props:
 *   grid          — Cell[][]
 *   onCellReveal  — (cell: Cell) => void
 *   onDecoyTap    — (cell: Cell) => void
 *   streak        — number
 *   activeColor   — string   color shared by all real-letter tiles this level
 */
export default function GameGrid({ grid, onCellReveal, onDecoyTap, streak = 0, activeColor = '' }) {
  const [explodingIds,   setExplodingIds]   = useState([])
  const [particleBursts, setParticleBursts] = useState([])
  const [shakingId,      setShakingId]      = useState(null)
  const [failedDecoyIds, setFailedDecoyIds] = useState([])

  useEffect(() => {
    const decoyIds = new Set(grid.flat().filter((c) => c.isDecoy).map((c) => c.id))
    setFailedDecoyIds((prev) => prev.filter((id) => decoyIds.has(id)))
  }, [grid])

  const cellRefs         = useRef({})
  const centerCache      = useRef({})
  const gridContainerRef = useRef(null)
  const graceCellsRef    = useRef(new Set())

  const rebuildCache = useCallback(() => {
    const cache = {}
    for (const [id, el] of Object.entries(cellRefs.current)) {
      if (el) cache[id] = cellCenter(el)
    }
    centerCache.current = cache
  }, [])

  useEffect(() => {
    const el = gridContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(rebuildCache)
    ro.observe(el)
    window.addEventListener('scroll', rebuildCache, { passive: true })
    return () => { ro.disconnect(); window.removeEventListener('scroll', rebuildCache) }
  }, [rebuildCache])

  const vibrate = useCallback((pattern) => {
    try { navigator.vibrate?.(pattern) } catch (_) {}
  }, [])

  const triggerExplode = useCallback((cell) => {
    setExplodingIds((prev) => [...prev, cell.id])
    const burstId = Date.now()
    setParticleBursts((prev) => [
      ...prev,
      {
        id:    `${burstId}-${cell.id}`,
        x:     centerCache.current[cell.id]?.x ?? 0,
        y:     centerCache.current[cell.id]?.y ?? 0,
        color: PLATE_TEXT[cell.color] ?? '#A293FF',
      },
    ])
    setTimeout(() => {
      setExplodingIds((prev) => prev.filter((id) => id !== cell.id))
      setParticleBursts((prev) => prev.filter((b) => b.id !== `${burstId}-${cell.id}`))
    }, 520)
  }, [])

  const triggerShake = useCallback((cell) => {
    setShakingId(cell.id)
    setFailedDecoyIds((prev) => [...prev, cell.id])
    setTimeout(() => setShakingId(null), 420)
  }, [])

  const gridRef = useRef(grid)
  useEffect(() => { gridRef.current = grid }, [grid])
  const streakRef = useRef(streak)
  useEffect(() => { streakRef.current = streak }, [streak])

  const handleContainerPointerDown = useCallback((e) => {
    const target = e.target.closest('[data-cell-id]')
    if (!target) return
    const cellId = target.dataset.cellId
    const cell = gridRef.current.flat().find((c) => c.id === cellId)
    if (!cell) return
    e.stopPropagation()
    if (cell.revealed) return

    if (cell.isDecoy) {
      if (graceCellsRef.current.has(cell.id)) return
      vibrate([40, 30, 40])
      playWrong()
      triggerShake(cell)
      onDecoyTap?.(cell)
      return
    }

    if (cell.phraseIndex === null) return

    vibrate(40)
    playChain(streakRef.current)
    triggerExplode(cell)
    onCellReveal(cell)
    graceCellsRef.current.add(cell.id)
    setTimeout(() => graceCellsRef.current.delete(cell.id), 600)
  }, [onCellReveal, onDecoyTap, triggerExplode, triggerShake, vibrate])

  // ── Streak glow on grid container ────────────────────────────────────────

  const streakIntensity = streak >= 5 ? Math.min((streak - 4) / 6, 1) : 0
  const gridShadow = streakIntensity > 0
    ? [
        `0 0 0 ${(streakIntensity * 2).toFixed(1)}px #A293FF33`,
        `0 0 ${(6 + streakIntensity * 22).toFixed(0)}px ${(streakIntensity * 0.28).toFixed(2)}px #A293FF`,
        `0 0 ${(14 + streakIntensity * 20).toFixed(0)}px ${(streakIntensity * 0.10).toFixed(2)}px #7DCAF6`,
      ].join(', ')
    : undefined

  const cols = grid[0]?.length ?? 5

  return (
    <div className="relative w-full">
      <GemParticles bursts={particleBursts} />

      <div
        ref={gridContainerRef}
        className="grid w-full p-2 rounded-2xl"
        onPointerDown={handleContainerPointerDown}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: '8px',
          width: '100%',
          touchAction: 'none',
          background: '#0d0c06',
          boxShadow: gridShadow,
          willChange: streakIntensity > 0 ? 'box-shadow' : 'auto',
        }}
        role="grid"
        aria-label="Game grid"
      >
        {grid.flat().map((cell) => (
          <CellTile
            key={cell.id}
            cell={cell}
            isExploding={explodingIds.includes(cell.id)}
            isShaking={shakingId === cell.id}
            isDecoyFailed={failedDecoyIds.includes(cell.id)}
            isActiveColor={cell.color === activeColor && cell.phraseIndex !== null && !cell.revealed}
            ariaLabel={cellAriaLabel(cell)}
            cellRef={(el) => { cellRefs.current[cell.id] = el }}
          />
        ))}
      </div>
    </div>
  )
}
