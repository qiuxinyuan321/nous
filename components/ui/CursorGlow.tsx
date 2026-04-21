'use client'

import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    let raf = 0
    let x = -200
    let y = -200

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      if (!raf) {
        raf = requestAnimationFrame(() => {
          glow.style.transform = `translate(${x}px, ${y}px)`
          raf = 0
        })
      }
    }

    const onLeave = () => {
      glow.style.opacity = '0'
    }

    const onEnter = () => {
      glow.style.opacity = '1'
    }

    document.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(28,27,25,0.18) 0%, rgba(28,27,25,0.06) 40%, transparent 70%)',
        boxShadow: '0 0 24px 8px rgba(28,27,25,0.10)',
        transition: 'opacity 0.3s ease',
        willChange: 'transform',
      }}
    />
  )
}
