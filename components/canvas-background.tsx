'use client'

import React, { useRef, useEffect } from 'react'

export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    
    // Config
    const particleCount = 60
    const connectionDistance = 150
    const mouseRadius = 200

    let mouse = {
      x: -1000,
      y: -1000
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    class Particle {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      baseX: number
      baseY: number

      constructor() {
        const c = canvas as HTMLCanvasElement
        this.x = Math.random() * c.width
        this.y = Math.random() * c.height
        this.baseX = this.x
        this.baseY = this.y
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 1
      }

      update() {
        const c = canvas as HTMLCanvasElement
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > c.width) this.vx *= -1
        if (this.y < 0 || this.y > c.height) this.vy *= -1

        // Mouse interaction
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < mouseRadius) {
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          const force = (mouseRadius - distance) / mouseRadius
          const directionX = forceDirectionX * force * 2
          const directionY = forceDirectionY * force * 2
          
          this.x -= directionX
          this.y -= directionY
        }
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(156, 163, 175, 0.3)' // ink-light with low opacity
        ctx.fill()
      }
    }

    const initParticles = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.update()
        p.draw()
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            const opacity = 1 - (distance / connectionDistance)
            ctx.strokeStyle = `rgba(156, 163, 175, ${opacity * 0.15})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const onMouseLeave = () => {
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    resize()
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}
