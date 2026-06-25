// ─── PlayerLevelBadge ─────────────────────────────────────────────────────────
// Circular SVG ring showing player level + XP progress toward the next level.

/**
 * Props:
 *   playerLevel — number  (current player level, 1-indexed)
 *   progress    — 0..1   (fraction of XP within current level)
 *   size        — number  (diameter in px, default 36)
 */
export default function PlayerLevelBadge({ playerLevel, progress, size = 36 }) {
  const R        = (size / 2) - 3          // radius leaving 3px for stroke
  const circ     = 2 * Math.PI * R
  const dashOffset = circ * (1 - Math.min(1, Math.max(0, progress)))
  const cx       = size / 2
  const cy       = size / 2

  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
      title={`Player level ${playerLevel} — ${Math.round(progress * 100)}% to next`}
      role="progressbar"
      aria-label={`Player level ${playerLevel}, ${Math.round(progress * 100)}% XP to next level`}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="#A293FF"
          strokeOpacity="0.18"
          strokeWidth="2.5"
        />
        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke="#A293FF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Level number */}
      <span
        className="relative z-10 font-black leading-none select-none"
        style={{ fontSize: size * 0.3, color: '#A293FF' }}
      >
        {playerLevel}
      </span>
    </div>
  )
}
