import { useRef, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react'

interface KineticScriptProps {
  text: string
  className?: string
  rotateDeg?: number
}

export default function KineticScript({
  text,
  className = '',
  rotateDeg = -2,
}: KineticScriptProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const isHoveredRef = useRef(false)
  const [isHovered, setIsHovered] = useState(false)

  // Physics state for organic spring and kinetic tilt
  const stateRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotate: rotateDeg,
    vRotate: 0,
    scale: 1,
    vScale: 0,
    skew: 0,
    vSkew: 0,
    targetX: 0,
    targetY: 0,
    targetRotate: rotateDeg,
    targetScale: 1,
    targetSkew: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    lastTime: 0,
  })

  // Continuous physics animation loop
  useEffect(() => {
    let animId: number
    let t = Math.random() * 100

    const tick = () => {
      t += 0.03
      const s = stateRef.current

      if (!isHoveredRef.current) {
        // Ambient organic breathing floating wave
        const ambientFloatY = Math.sin(t) * 3
        const ambientRotate = rotateDeg + Math.cos(t * 0.8) * 1.5
        const ambientSkew = Math.sin(t * 0.6) * 1.2

        s.targetY = ambientFloatY
        s.targetRotate = ambientRotate
        s.targetSkew = ambientSkew
        s.targetScale = 1
        s.targetX = 0
      }

      // Spring physics (Hooke's law + damping)
      const springK = isHoveredRef.current ? 0.14 : 0.08
      const damping = isHoveredRef.current ? 0.76 : 0.82

      // Position Y
      const forceY = (s.targetY - s.y) * springK
      s.vy = (s.vy + forceY) * damping
      s.y += s.vy

      // Position X
      const forceX = (s.targetX - s.x) * springK
      s.vx = (s.vx + forceX) * damping
      s.x += s.vx

      // Rotate
      const forceRot = (s.targetRotate - s.rotate) * springK
      s.vRotate = (s.vRotate + forceRot) * damping
      s.rotate += s.vRotate

      // Scale
      const forceScale = (s.targetScale - s.scale) * springK
      s.vScale = (s.vScale + forceScale) * damping
      s.scale += s.vScale

      // Skew
      const forceSkew = (s.targetSkew - s.skew) * springK
      s.vSkew = (s.vSkew + forceSkew) * damping
      s.skew += s.vSkew

      // Apply transform directly to DOM for 60fps / 120fps performance
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) rotate(${s.rotate.toFixed(2)}deg) skewX(${s.skew.toFixed(2)}deg) scale(${s.scale.toFixed(3)})`
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [rotateDeg])

  const handleMouseEnter = (e: ReactMouseEvent<HTMLSpanElement>) => {
    isHoveredRef.current = true
    setIsHovered(true)
    const s = stateRef.current
    s.lastMouseX = e.clientX
    s.lastMouseY = e.clientY
    s.lastTime = performance.now()
    s.targetScale = 1.12
  }

  const handleMouseMove = (e: ReactMouseEvent<HTMLSpanElement>) => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = e.clientX - centerX
    const dy = e.clientY - centerY

    const now = performance.now()
    const dt = Math.max(now - stateRef.current.lastTime, 16)
    const mouseVx = ((e.clientX - stateRef.current.lastMouseX) / dt) * 16
    const mouseVy = ((e.clientY - stateRef.current.lastMouseY) / dt) * 16

    stateRef.current.lastMouseX = e.clientX
    stateRef.current.lastMouseY = e.clientY
    stateRef.current.lastTime = now

    const s = stateRef.current
    // Kinetic magnetic pull towards cursor velocity & cursor position
    s.targetX = Math.max(Math.min(dx * 0.35 + mouseVx * 0.4, 25), -25)
    s.targetY = Math.max(Math.min(dy * 0.35 + mouseVy * 0.4 - 4, 18), -18)

    // Dynamic italic slant & playful tilt based on movement direction
    s.targetSkew = Math.max(Math.min(-mouseVx * 0.6 - dx * 0.08, 14), -14)
    s.targetRotate = rotateDeg + Math.max(Math.min(mouseVx * 0.25 + dx * 0.05, 8), -8)
    s.targetScale = 1.14
  }

  const handleMouseLeave = () => {
    isHoveredRef.current = false
    setIsHovered(false)
    const s = stateRef.current
    s.targetX = 0
    s.targetY = 0
    s.targetScale = 1
    s.targetRotate = rotateDeg
    s.targetSkew = 0
  }

  const handleClick = () => {
    // Playful elastic bounce on click
    const s = stateRef.current
    s.vScale = 0.22
    s.vRotate = (Math.random() > 0.5 ? 1 : -1) * 8
    s.vy = -10
  }

  return (
    <span
      className="inline-block relative cursor-pointer select-none py-1 px-1.5"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ verticalAlign: 'middle' }}
    >
      <span
        ref={containerRef}
        aria-label={text}
        className={`font-script inline-block text-[1.28em] font-normal tracking-normal text-black dark:text-white transition-colors duration-300 will-change-transform ${className}`}
        style={{
          display: 'inline-block',
          transformOrigin: '50% 65%',
        }}
      >
        {/* Split characters with staggered kinetic wave when hovered */}
        {text.split('').map((char, index) => {
          return (
            <span
              key={index}
              aria-hidden="true"
              className="inline-block transition-transform duration-300 ease-out"
              style={{
                display: 'inline-block',
                transform: isHovered
                  ? `translateY(${Math.sin(index * 0.95) * -3}px) rotate(${Math.cos(index * 0.95) * 2.5}deg)`
                  : 'none',
                transitionDelay: `${index * 22}ms`,
              }}
            >
              {char}
            </span>
          )
        })}
      </span>
    </span>
  )
}

