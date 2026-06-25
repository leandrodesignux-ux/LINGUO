import { useEffect, useRef } from 'react'

/**
 * Attaches touch-based swipe detection to a DOM element via ref.
 * Callbacks are stored in refs so the effect only re-registers when the
 * element or threshold changes — not on every render.
 *
 * @param {React.RefObject} ref - ref attached to the target element
 * @param {{ onSwipeLeft?, onSwipeRight?, onSwipeUp?, onSwipeDown?, threshold? }} callbacks
 */
export function useSwipeGesture(ref, {
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 60,
} = {}) {
  const startRef    = useRef(null)
  const callbackRef = useRef({})

  // Keep callbacks fresh without re-registering listeners
  callbackRef.current = { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onTouchStart(e) {
      const t = e.touches[0]
      startRef.current = { x: t.clientX, y: t.clientY }
    }

    function onTouchEnd(e) {
      if (!startRef.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startRef.current.x
      const dy = t.clientY - startRef.current.y
      startRef.current = null

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Require dominant axis to exceed threshold
      if (absDx < threshold && absDy < threshold) return

      const { onSwipeLeft: left, onSwipeRight: right, onSwipeUp: up, onSwipeDown: down } = callbackRef.current
      if (absDx >= absDy) {
        if (dx < 0) left?.()
        else        right?.()
      } else {
        if (dy < 0) up?.()
        else        down?.()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [ref, threshold]) // callbacks intentionally excluded — read via ref
}
