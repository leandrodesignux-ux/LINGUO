// ─── Linguo SFX ───────────────────────────────────────────────────────────────
// All sounds are synthesised with Web Audio API — zero network requests.
// AudioContext is created lazily on the first call, satisfying browser
// autoplay policies (gesture required before audio can start).

const MUTE_KEY = 'linguo-sfx-muted'

// ── Mute state ────────────────────────────────────────────────────────────────

let _muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch (_) { return false }
})()

export function isMuted() { return _muted }

export function setMuted(val) {
  _muted = Boolean(val)
  try { localStorage.setItem(MUTE_KEY, _muted ? '1' : '0') } catch (_) {}
}

export function toggleMute() { setMuted(!_muted) }

// ── Singleton AudioContext ────────────────────────────────────────────────────

let _ctx = null

function ctx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch (_) {
      return null
    }
  }
  // Resume if suspended (some browsers suspend after inactivity)
  if (_ctx.state === 'suspended') {
    try { _ctx.resume() } catch (_) {}
  }
  return _ctx
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

/**
 * Play a single oscillator note.
 * @param {number} freq   - Hz
 * @param {number} gain   - 0–1 master gain
 * @param {number} dur    - seconds
 * @param {'sine'|'triangle'|'square'|'sawtooth'} type
 * @param {number} [attack=0.005]  - gain ramp-up time
 * @param {number} [release=0.08] - gain ramp-down time
 */
function note(freq, gain, dur, type = 'sine', attack = 0.005, release = 0.08) {
  const c = ctx()
  if (!c) return
  const now = c.currentTime

  const osc = c.createOscillator()
  const env = c.createGain()

  osc.type      = type
  osc.frequency.setValueAtTime(freq, now)

  env.gain.setValueAtTime(0, now)
  env.gain.linearRampToValueAtTime(gain, now + attack)
  env.gain.setValueAtTime(gain, now + dur - release)
  env.gain.linearRampToValueAtTime(0, now + dur)

  osc.connect(env)
  env.connect(c.destination)
  osc.start(now)
  osc.stop(now + dur)
}

/**
 * Play two oscillators simultaneously (for chords / richer tones).
 */
function chord(freqs, gain, dur, type = 'sine') {
  freqs.forEach((f) => note(f, gain / freqs.length, dur, type))
}

// ── Ascending scale for chain streaks ─────────────────────────────────────────
// Pentatonic major starting at C5, capped so very high streaks stay musical.

const CHAIN_SCALE = [523, 587, 659, 784, 880, 988, 1047, 1175] // C5–D6

// ── Public sound API ──────────────────────────────────────────────────────────

/**
 * Short rising note on each valid chain submission.
 * Pitch climbs with streak (capped at the top of the scale).
 */
export function playChain(streak = 0) {
  if (_muted) return
  const idx  = Math.min(Math.max(streak, 0), CHAIN_SCALE.length - 1)
  const freq = CHAIN_SCALE[idx]
  note(freq, 0.13, 0.12, 'triangle', 0.004, 0.07)
}

/**
 * Short dissonant blip for a wrong / failed chain.
 */
export function playWrong() {
  if (_muted) return
  note(160, 0.12, 0.18, 'sawtooth', 0.004, 0.14)
  // Add a quick pitch drop for extra "wrong" feel
  const c = ctx()
  if (!c) return
  const now = c.currentTime
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(200, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.15)
  env.gain.setValueAtTime(0, now)
  env.gain.linearRampToValueAtTime(0.08, now + 0.01)
  env.gain.linearRampToValueAtTime(0, now + 0.16)
  osc.connect(env)
  env.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.17)
}

/**
 * Cheerful arpeggio chord for a correct Solve button press.
 */
export function playSolve() {
  if (_muted) return
  const c = ctx()
  if (!c) return
  // C5 – E5 – G5 staggered 40 ms apart
  const arp = [523, 659, 784]
  arp.forEach((freq, i) => {
    const now   = c.currentTime + i * 0.04
    const osc   = c.createOscillator()
    const env   = c.createGain()
    osc.type    = 'triangle'
    osc.frequency.setValueAtTime(freq, now)
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(0.14, now + 0.01)
    env.gain.linearRampToValueAtTime(0, now + 0.22)
    osc.connect(env)
    env.connect(c.destination)
    osc.start(now)
    osc.stop(now + 0.23)
  })
}

/**
 * Big triumphant chord for level complete.
 */
export function playBig() {
  if (_muted) return
  const c = ctx()
  if (!c) return
  // C5 – E5 – G5 – C6  played together, then a high shimmer
  const now = c.currentTime
  chord([523, 659, 784, 1047], 0.15, 0.55, 'triangle')
  // Shimmer overtone delayed 120 ms
  const osc2 = c.createOscillator()
  const env2 = c.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(1568, now + 0.12)   // G6
  osc2.frequency.linearRampToValueAtTime(2093, now + 0.5) // C7 glide up
  env2.gain.setValueAtTime(0, now + 0.12)
  env2.gain.linearRampToValueAtTime(0.09, now + 0.18)
  env2.gain.linearRampToValueAtTime(0, now + 0.55)
  osc2.connect(env2)
  env2.connect(c.destination)
  osc2.start(now + 0.12)
  osc2.stop(now + 0.56)
}

/**
 * Soft coin tinkle — high sine ping.
 */
export function playCoin() {
  if (_muted) return
  note(1400, 0.10, 0.10, 'sine', 0.003, 0.08)
  // second partial slightly lower pitched 30 ms later
  const c = ctx()
  if (!c) return
  const now2 = c.currentTime + 0.03
  const osc  = c.createOscillator()
  const env  = c.createGain()
  osc.type   = 'sine'
  osc.frequency.setValueAtTime(1760, now2)
  env.gain.setValueAtTime(0, now2)
  env.gain.linearRampToValueAtTime(0.07, now2 + 0.003)
  env.gain.linearRampToValueAtTime(0, now2 + 0.09)
  osc.connect(env)
  env.connect(c.destination)
  osc.start(now2)
  osc.stop(now2 + 0.10)
}

/**
 * Soft upward blip for hint usage.
 */
export function playHint() {
  if (_muted) return
  const c = ctx()
  if (!c) return
  const now = c.currentTime
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type  = 'sine'
  osc.frequency.setValueAtTime(880, now)
  osc.frequency.linearRampToValueAtTime(1320, now + 0.12)
  env.gain.setValueAtTime(0, now)
  env.gain.linearRampToValueAtTime(0.11, now + 0.01)
  env.gain.linearRampToValueAtTime(0, now + 0.14)
  osc.connect(env)
  env.connect(c.destination)
  osc.start(now)
  osc.stop(now + 0.15)
}
