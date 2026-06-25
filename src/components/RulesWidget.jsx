import { useState, useEffect, useCallback } from 'react'

// ─── Mascot emoji cycle ────────────────────────────────────────────────────────

const EMOJIS = ['🔮', '🃏', '🎯']

function MascotEmoji() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % EMOJIS.length)
        setVisible(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className="text-3xl animate-lex-float select-none"
      style={{
        display: 'inline-block',
        transition: 'opacity 0.2s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {EMOJIS[idx]}
    </span>
  )
}

// ─── CEFR badge ─────────────────────────────────────────────────────────────────

const CEFR_STYLES = {
  A2: 'bg-linguo-teal/15 border-linguo-teal/40 text-linguo-teal',
  B1: 'bg-linguo-teal/15 border-linguo-teal/40 text-linguo-teal',
  B2: 'bg-linguo-malibu/15 border-linguo-malibu/40 text-linguo-malibu',
  C1: 'bg-linguo-brightLavender/15 border-linguo-brightLavender/40 text-linguo-brightLavender',
  C2: 'bg-linguo-lightGold/15 border-linguo-lightGold/40 text-linguo-lightGold',
}

function CEFRBadge({ cefr }) {
  if (!cefr) return null
  const cls = CEFR_STYLES[cefr] ?? 'bg-white/8 border-white/20 text-linguo-fantasy/60'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest leading-none ${cls}`}>
      {cefr}
    </span>
  )
}

// ─── Active-color legend ────────────────────────────────────────────────────────

const COLOR_LABEL = { gold: 'Gold', cyan: 'Blue', lime: 'Green', pink: 'Pink', purple: 'Purple' }
const SWATCH      = { gold: '#FFDA57', cyan: '#7DCAF6', lime: '#34D9B3', pink: '#FFBBF4', purple: '#C4B8FF' }

// ─── Category label map ───────────────────────────────────────────────────────

const CATEGORY_LABEL = {
  'Verb Tenses':              'Verb tense',
  'Prepositions':             'Preposition',
  'Subject-Verb Agreement':   'Subject–verb agreement',
  'Subjunctive':              'Subjunctive mood',
  'Articles':                 'Articles (a / an / the)',
  'Adjectives':               'Comparative adjective',
  'Phrasal Verbs':            'Phrasal verb',
  'Punctuation':              'Punctuation',
  'Mixed Conditionals':       'Mixed conditional',
  'Inversion':                'Inversion',
  'Cleft Sentences':          'Cleft sentence',
  'Reporting Passive':        'Reporting passive',
  'Past Modals of Deduction': 'Past modal of deduction',
}

// ─── Lex Hint button ─────────────────────────────────────────────────────────

function LexHintButton({ onUseHint, hintsLeft }) {
  const [justUsed, setJustUsed] = useState(false)

  const handleClick = useCallback(() => {
    onUseHint()
    setJustUsed(true)
    setTimeout(() => setJustUsed(false), 2000)
  }, [onUseHint])

  if (justUsed) {
    return (
      <div
        className="w-full text-center animate-lex-pulse"
        style={{ animationDuration: '0.8s' }}
      >
        <span className="text-linguo-lightGold text-[10px] font-bold uppercase tracking-wider leading-tight">
          Letter<br />revealed! ✨
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="
        w-full py-1.5 rounded-xl
        bg-linguo-lightGold/10 border border-linguo-lightGold/40
        text-linguo-lightGold text-[10px] font-bold uppercase tracking-wider
        animate-lex-pulse
        hover:bg-linguo-lightGold/20 transition-colors duration-150
        focus:outline-none
      "
    >
      Hint 💡{' '}
      <span className="ml-0.5 px-1 py-0.5 rounded-md bg-linguo-lightGold/20 text-linguo-lightGold text-[9px] font-black normal-case tracking-normal">
        {hintsLeft} left
      </span>
    </button>
  )
}

// ─── Paid hint button (shown after free hints exhausted) ─────────────────────

function PaidHintButton({ onBuyHint, coins, hintCost }) {
  const [justUsed, setJustUsed] = useState(false)
  const canAfford = coins >= hintCost

  const handleClick = useCallback(() => {
    if (!canAfford) return
    onBuyHint()
    setJustUsed(true)
    setTimeout(() => setJustUsed(false), 2000)
  }, [onBuyHint, canAfford])

  if (justUsed) {
    return (
      <div className="w-full text-center animate-lex-pulse" style={{ animationDuration: '0.8s' }}>
        <span className="text-linguo-lightGold text-[10px] font-bold uppercase tracking-wider leading-tight">
          Letter<br />revealed! ✨
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canAfford}
      title={canAfford ? `Buy hint for ${hintCost} lingots` : `Need ${hintCost} lingots (you have ${coins})`}
      className={`
        w-full py-1.5 rounded-xl
        border text-[10px] font-bold uppercase tracking-wider
        transition-colors duration-150 focus:outline-none
        ${
          canAfford
            ? 'bg-linguo-lightGold/10 border-linguo-lightGold/40 text-linguo-lightGold hover:bg-linguo-lightGold/20'
            : 'bg-white/5 border-white/15 text-linguo-fantasy/30 cursor-not-allowed'
        }
      `}
    >
      <span className="leading-none">🪙</span>{' '}
      {hintCost} Hint
      {!canAfford && (
        <span className="ml-1 text-[8px] normal-case tracking-normal opacity-60">(not enough)</span>
      )}
    </button>
  )
}

// ─── Shared panel content ─────────────────────────────────────────────────────

function WidgetContent({ streak, hintAvailable, hintsLeft, hint, source, grammarExplanation, onUseHint, onBuyHint, coins, hintCost, cefr, category, activeColor }) {
  const hintsExhausted = hintsLeft === 0
  const categoryLabel = CATEGORY_LABEL[category] ?? category
  const swatchColor   = SWATCH[activeColor]
  const colorLabel    = COLOR_LABEL[activeColor]
  return (
    <>
      {/* ── Mascot ── */}
      <div className="flex flex-col items-center gap-1">
        <MascotEmoji />
        <span className="text-linguo-blossomPink font-bold text-xs tracking-widest uppercase">LEX</span>
      </div>

      {/* ── Always-visible: category label + CEFR badge + color pill + hint ── */}
      <div className="w-full rounded-xl bg-linguo-brightLavender/8 border border-linguo-brightLavender/20 px-2 py-2 flex flex-col gap-1.5">
        {source && (
          <p className="text-linguo-fantasy/30 text-[8px] uppercase tracking-widest leading-none">{source}</p>
        )}
        {categoryLabel && (
          <p className="text-linguo-fantasy font-black text-[11px] leading-tight">
            {categoryLabel}
          </p>
        )}
        {cefr && <CEFRBadge cefr={cefr} />}
        {swatchColor && colorLabel && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: swatchColor, flexShrink: 0 }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: swatchColor }}>
              Tap {colorLabel} tiles
            </span>
          </div>
        )}
        {hint && (
          <p className="text-linguo-fantasy/60 text-[9px] leading-relaxed">{hint}</p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="w-full h-px bg-white/10" />

      {/* ── Streak badge ── */}
      {streak > 1 && (
        <div className="w-full bg-linguo-lightGold/10 border border-linguo-lightGold/30 rounded-xl px-2 py-1 text-center">
          <p className="text-linguo-lightGold text-[10px] font-bold uppercase tracking-widest">Streak</p>
          <p className="text-linguo-lightGold font-black text-sm">
            ×{Math.min(1 + (streak - 1) * 0.5, 5).toFixed(1)}
          </p>
        </div>
      )}

      {/* ── Lex Hint button (free hints remaining) ── */}
      {hintAvailable && !hintsExhausted && (
        <LexHintButton onUseHint={onUseHint} hintsLeft={hintsLeft} />
      )}

      {/* ── Paid hint button (after free hints exhausted) ── */}
      {hintsExhausted && onBuyHint && (
        <PaidHintButton onBuyHint={onBuyHint} coins={coins ?? 0} hintCost={hintCost ?? 20} />
      )}

      {/* ── Grammar explanation (shown once all hints are used) ── */}
      {hintsExhausted && grammarExplanation && (
        <div className="w-full rounded-xl bg-linguo-malibu/10 border border-linguo-malibu/30 px-2 py-1.5">
          <p className="text-linguo-malibu text-[10px] font-bold uppercase tracking-widest mb-0.5">Grammar tip</p>
          <p className="text-linguo-fantasy/80 text-[10px] leading-relaxed">{grammarExplanation}</p>
        </div>
      )}

      {/* ── Tap prompt ── */}
      <div className="w-full text-center animate-lex-pulse">
        <span className="text-linguo-brightLavender/70 text-[10px] font-bold uppercase tracking-wider leading-tight">
          Tap a tile<br />to reveal
        </span>
      </div>
    </>
  )
}

// ─── RulesWidget ─────────────────────────────────────────────────────────────

export default function RulesWidget({ streak, hintAvailable, hintsLeft, hint, source, grammarExplanation, onUseHint, onBuyHint, coins, hintCost, cefr, category, activeColor }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentProps = { streak, hintAvailable, hintsLeft, hint, source, grammarExplanation, onUseHint, onBuyHint, coins, hintCost, cefr, category, activeColor }

  return (
    <>
      {/* ── Desktop: fixed right panel (sm and above) ── */}
      <aside className="
        hidden sm:flex
        fixed right-3 top-20 z-30
        w-36
        bg-linguo-smokyBlack border border-linguo-brightLavender/30
        rounded-2xl p-4
        flex-col items-center gap-3
        shadow-xl shadow-black/40
      " aria-label="Lex rules panel">
        <WidgetContent {...contentProps} />
      </aside>

      {/* ── Mobile: collapsed pill button (below sm) ── */}
      <div className="sm:hidden fixed top-16 right-3 z-30">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="
            flex items-center gap-1.5 px-3 py-1.5
            bg-linguo-smokyBlack border border-linguo-brightLavender/40
            rounded-full text-xs font-bold text-linguo-blossomPink
            shadow-lg shadow-black/30
            focus:outline-none focus:ring-2 focus:ring-linguo-brightLavender
          "
          aria-label={mobileOpen ? 'Close Lex panel' : 'Open Lex panel'}
          aria-expanded={mobileOpen}
        >
          <span>🔮</span>
          <span>LEX</span>
          <span className="text-linguo-fantasy/40">{mobileOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown panel */}
        {mobileOpen && (
          <div
            className="
              absolute right-0 top-10 mt-1
              w-44
              bg-linguo-smokyBlack border border-linguo-brightLavender/30
              rounded-2xl p-4
              flex flex-col items-center gap-3
              shadow-xl shadow-black/50
            "
            role="dialog"
            aria-label="Lex rules"
          >
            <WidgetContent {...contentProps} />
          </div>
        )}
      </div>
    </>
  )
}
