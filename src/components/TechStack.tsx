import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { techStackData, type TechIconData } from '../data/techStackIcons'

interface FloatingNode extends TechIconData {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  isDragging: boolean
  isThrown: boolean
  currentScale: number
  currentOpacity: number
}

// Initial scattered positions distributed evenly across the area
// Initial scattered positions distributed evenly across the area for 15 items
const INITIAL_SPREAD = [
  { rx: 0.18, ry: 0.12 },
  { rx: 0.48, ry: 0.10 },
  { rx: 0.82, ry: 0.14 },
  { rx: 0.32, ry: 0.24 },
  { rx: 0.68, ry: 0.22 },
  { rx: 0.14, ry: 0.38 },
  { rx: 0.50, ry: 0.38 },
  { rx: 0.86, ry: 0.36 },
  { rx: 0.26, ry: 0.52 },
  { rx: 0.72, ry: 0.50 },
  { rx: 0.16, ry: 0.66 },
  { rx: 0.52, ry: 0.64 },
  { rx: 0.84, ry: 0.68 },
  { rx: 0.32, ry: 0.82 },
  { rx: 0.70, ry: 0.84 },
]

export default function TechStack() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  hoveredIdRef.current = hoveredId

  const nodesRef = useRef<FloatingNode[]>([])
  const [, setRenderTrigger] = useState(0)

  // Drag tracking
  const dragRef = useRef<{
    activeId: string | null
    lastX: number
    lastY: number
    lastTime: number
    vx: number
    vy: number
  }>({
    activeId: null,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    vx: 0,
    vy: 0,
  })

  // Initialize node states
  useEffect(() => {
    nodesRef.current = techStackData.map((tech, idx) => {
      // Natural gentle wandering velocity in random directions
      const angle = (idx / techStackData.length) * Math.PI * 2 + Math.random() * 0.8
      const speed = 0.38 + Math.random() * 0.2
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed

      return {
        ...tech,
        x: 0,
        y: 0,
        vx,
        vy,
        phase: Math.random() * Math.PI * 2,
        isDragging: false,
        isThrown: false,
        currentScale: 1,
        currentOpacity: 0.85,
      }
    })
  }, [])

  // Physics, Free Floating Drift & Interactive Loop (Completely free, NO orbit, NO pulling forces)
  useEffect(() => {
    let animId: number
    let t = 0
    let initialized = false

    const tick = () => {
      t += 1
      const container = containerRef.current
      if (!container) {
        animId = requestAnimationFrame(tick)
        return
      }

      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Initial placement once container is measured
      if (!initialized && width > 0 && height > 0) {
        nodesRef.current.forEach((node, i) => {
          const spread = INITIAL_SPREAD[i % INITIAL_SPREAD.length]
          node.x = spread.rx * width
          node.y = spread.ry * height
        })
        initialized = true
      }

      const activeHoverId = hoveredIdRef.current
      const isAnyHovered = activeHoverId !== null
      const pad = 32 // boundary margin so icons stay visible within canvas
      const nodes = nodesRef.current

      // Soft natural mutual repulsion between floating icons so they drift around each other
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i]
          const n2 = nodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.hypot(dx, dy)
          const minDist = 58

          if (dist < minDist && dist > 0.01) {
            const overlap = (minDist - dist) / dist
            const pushX = dx * overlap * 0.04
            const pushY = dy * overlap * 0.04
            if (!n1.isDragging && activeHoverId !== n1.id) {
              n1.x -= pushX
              n1.y -= pushY
            }
            if (!n2.isDragging && activeHoverId !== n2.id) {
              n2.x += pushX
              n2.y += pushY
            }
          }
        }
      }

      // Update positions and velocities
      nodes.forEach((node) => {
        const isHovered = activeHoverId === node.id

        if (node.isDragging) {
          // Handled directly by cursor move
          node.currentScale = 1.4
          node.currentOpacity = 1
        } else if (isHovered) {
          // Hovered from list: freeze motion completely in place, scale up and highlight
          node.currentScale += (1.45 - node.currentScale) * 0.15
          node.currentOpacity += (1 - node.currentOpacity) * 0.15
          // DO NOT MOVE: position stays exactly where it currently is
        } else if (node.isThrown) {
          // Thrown: apply kinetic velocity and natural friction
          node.x += node.vx
          node.y += node.vy
          node.vx *= 0.96
          node.vy *= 0.96

          // Soft boundary bounce
          if (node.x < pad) {
            node.x = pad
            node.vx = Math.abs(node.vx) * 0.75
          } else if (node.x > width - pad) {
            node.x = width - pad
            node.vx = -Math.abs(node.vx) * 0.75
          }

          if (node.y < pad) {
            node.y = pad
            node.vy = Math.abs(node.vy) * 0.75
          } else if (node.y > height - pad) {
            node.y = height - pad
            node.vy = -Math.abs(node.vy) * 0.75
          }

          // When velocity drops down to cruising speed, smoothly transition to free floating
          // NO PULL BACK TO ANY ORBIT - simply continue floating wherever it landed!
          const speed = Math.hypot(node.vx, node.vy)
          if (speed < 0.55) {
            node.isThrown = false
            const angle = Math.atan2(node.vy, node.vx) || node.phase
            const cruisingSpeed = 0.38 + Math.random() * 0.18
            node.vx = Math.cos(angle) * cruisingSpeed
            node.vy = Math.sin(angle) * cruisingSpeed
          }

          node.currentScale = 1.15
          node.currentOpacity = 0.95
        } else {
          // Pure free ambient floating: icon drifts freely across space
          const swayX = Math.cos(t * 0.015 + node.phase) * 0.25
          const swayY = Math.sin(t * 0.015 + node.phase) * 0.25

          node.x += node.vx + swayX
          node.y += node.vy + swayY

          // Soft boundary reflection
          if (node.x < pad) {
            node.x = pad
            node.vx = Math.abs(node.vx)
          } else if (node.x > width - pad) {
            node.x = width - pad
            node.vx = -Math.abs(node.vx)
          }

          if (node.y < pad) {
            node.y = pad
            node.vy = Math.abs(node.vy)
          } else if (node.y > height - pad) {
            node.y = height - pad
            node.vy = -Math.abs(node.vy)
          }

          // Maintain gentle cruising drift so it never stops floating
          const speed = Math.hypot(node.vx, node.vy)
          const minSpeed = 0.32
          const maxSpeed = 0.55
          if (speed < minSpeed) {
            const angle = Math.atan2(node.vy, node.vx) || node.phase
            node.vx = Math.cos(angle) * minSpeed
            node.vy = Math.sin(angle) * minSpeed
          } else if (speed > maxSpeed) {
            node.vx *= 0.98
            node.vy *= 0.98
          }

          // Scale & opacity management
          if (isAnyHovered) {
            node.currentScale += (0.9 - node.currentScale) * 0.1
            node.currentOpacity += (0.28 - node.currentOpacity) * 0.1
          } else {
            node.currentScale += (1.0 - node.currentScale) * 0.1
            node.currentOpacity += (0.85 - node.currentOpacity) * 0.1
          }
        }
      })

      setRenderTrigger((prev) => (prev + 1) % 10000)
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Pointer drag & throw handlers
  const handlePointerDown = (id: string, e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const drag = dragRef.current
    drag.activeId = id
    drag.lastX = px
    drag.lastY = py
    drag.lastTime = performance.now()
    drag.vx = 0
    drag.vy = 0

    const node = nodesRef.current.find((n) => n.id === id)
    if (node) {
      node.isDragging = true
      node.isThrown = false
      node.vx = 0
      node.vy = 0
    }

    const onPointerMove = (evt: PointerEvent) => {
      const now = performance.now()
      const dt = Math.max(now - drag.lastTime, 16)
      const curX = evt.clientX - rect.left
      const curY = evt.clientY - rect.top

      const instantVx = ((curX - drag.lastX) / dt) * 16
      const instantVy = ((curY - drag.lastY) / dt) * 16
      drag.vx = drag.vx * 0.5 + instantVx * 0.5
      drag.vy = drag.vy * 0.5 + instantVy * 0.5

      drag.lastX = curX
      drag.lastY = curY
      drag.lastTime = now

      if (node) {
        node.x = curX
        node.y = curY
      }
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      if (node) {
        node.isDragging = false
        const maxV = 28
        node.vx = Math.max(Math.min(drag.vx, maxV), -maxV)
        node.vy = Math.max(Math.min(drag.vy, maxV), -maxV)
        node.isThrown = true
      }
      drag.activeId = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Render official SVG for each technology
  const renderOfficialIcon = (tech: TechIconData) => {
    if (tech.id === 'nextjs' || tech.id === 'express') {
      return (
        <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="currentColor">
          <path d={tech.path} className="text-black dark:text-white" />
        </svg>
      )
    }

    if (tech.id === 'prisma') {
      return (
        <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="currentColor">
          <path d={tech.path} className="text-[#2D3748] dark:text-white" />
        </svg>
      )
    }

    if (tech.id === 'aws') {
      return (
        <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill="currentColor">
          <path d={tech.path} className="text-black dark:text-white" />
          {tech.path2 && <path d={tech.path2} fill="#FF9900" />}
        </svg>
      )
    }

    if (tech.id === 'typescript') {
      return (
        <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9">
          <rect x="0.5" y="0.5" width="23" height="23" rx="3" fill="#ffffff" />
          <path d={tech.path} fill={tech.hex} />
        </svg>
      )
    }

    if (tech.id === 'javascript') {
      return (
        <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9">
          <rect width="24" height="24" rx="2" fill="#000000" />
          <path d={tech.path} fill={tech.hex} />
        </svg>
      )
    }

    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-9 sm:w-9" fill={tech.hex}>
        <path d={tech.path} />
      </svg>
    )
  }

  return (
    <section
      id="tech-stack"
      className="reveal border-t border-black/10 py-32 sm:py-44 dark:border-white/15"
    >
      <div className="w-full">
        {/* Split layout: Left list | Thin vertical line | Right free-floating area */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 lg:gap-16">
          {/* Left Column: Tech Stack List */}
          <div className="pb-12 md:pb-0 md:pr-10 lg:pr-16 md:border-r border-black/10 dark:border-white/10">
            <p className="text-xs sm:text-sm font-mono font-medium uppercase tracking-[0.25em] opacity-45">
              Tech Stack
            </p>

            {/* Interactive Tech List */}
            <div className="mt-8 divide-y divide-black/5 dark:divide-white/5 border-y border-black/10 dark:border-white/10">
              {techStackData.map((tech) => {
                const isHovered = hoveredId === tech.id
                return (
                  <div
                    key={tech.id}
                    onMouseEnter={() => setHoveredId(tech.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`group flex items-center justify-between py-2.5 sm:py-3 px-3.5 -mx-3.5 rounded-lg cursor-pointer transition-all duration-300 ${
                      isHovered
                        ? 'bg-black/[0.04] dark:bg-white/[0.06] translate-x-1.5'
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`font-display text-base sm:text-lg tracking-tight transition-colors duration-200 ${
                        isHovered
                          ? 'font-medium text-black dark:text-white'
                          : 'text-black/75 dark:text-white/75 group-hover:text-black dark:group-hover:text-white'
                      }`}
                    >
                      {tech.name}
                    </span>

                    <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.15em] opacity-40">
                      {tech.category}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Free Floating Area (Completely open, NO circular lines, NO orbit pull) */}
          <div className="pt-8 md:pt-0 flex flex-col items-center justify-center w-full">
            {/* Free Floating Canvas */}
            <div
              ref={containerRef}
              className="relative h-[480px] w-full sm:h-[620px] select-none touch-none overflow-hidden"
            >
              {/* Floating, Draggable & Throwable Technology Icons */}
              {nodesRef.current.map((node) => {
                const isHovered = hoveredId === node.id
                return (
                  <div
                    key={node.id}
                    title={node.name}
                    aria-label={node.name}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onPointerDown={(e) => handlePointerDown(node.id, e)}
                    style={{
                      transform: `translate3d(${node.x - 28}px, ${node.y - 28}px, 0) scale(${node.currentScale})`,
                      opacity: node.currentOpacity,
                      zIndex: isHovered || node.isDragging ? 50 : 10,
                      filter: isHovered
                        ? `drop-shadow(0 0 20px ${node.hex}99)`
                        : undefined,
                    }}
                    className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center cursor-grab active:cursor-grabbing will-change-transform transition-[filter] duration-200"
                  >
                    <div className="p-2 transition-transform duration-200">
                      {renderOfficialIcon(node)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
