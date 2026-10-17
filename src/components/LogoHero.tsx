import { useCallback, useEffect, useRef, useState } from 'react'
// High-res raster of logo.svg: the vector has thousands of clip paths and is too costly to repaint
import logo from '../assets/logo.png'
// Small copy used only for sampling dot positions (avoids decoding the large image into a canvas)
import logoSample from '../assets/logo-sample.png'

type Particle = { x: number; y: number; hx: number; hy: number; vx: number; vy: number; delay: number }

// Tuning
const REPEL_RADIUS = 110 // px around the cursor that pushes dots away
const REPEL_FORCE = 2.4
const SPRING = 0.022 // pull back toward the logo shape
const SCATTER_FRICTION = 0.955
const RETURN_FRICTION = 0.86
const RESTORE_IDLE_MS = 1400 // settled + cursor away this long -> crisp logo fades back
const MAX_DPR = 1.5 // tiny dots don't need full retina resolution; keeps canvas memory low on phones

// Sample the logo into a grid of dot positions: one canvas pixel per dot cell
function sampleLogo(src: HTMLImageElement, w: number, h: number, step: number) {
  const cols = Math.max(1, Math.round(w / step))
  const rows = Math.max(1, Math.round(h / step))
  const c = document.createElement('canvas')
  c.width = cols
  c.height = rows
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(src, 0, 0, cols, rows)
  const data = ctx.getImageData(0, 0, cols, rows).data
  const sx = w / cols
  const sy = h / rows
  const pts: number[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (data[(y * cols + x) * 4 + 3] > 110) pts.push(x * sx, y * sy)
    }
  }
  return pts
}

export default function LogoHero({ dark }: { dark: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shattered, setShattered] = useState(false)

  const sim = useRef({
    particles: [] as Particle[],
    raf: 0,
    start: 0,
    client: { x: -1e5, y: -1e5 }, // latest pointer position (viewport coords)
    mouse: { x: -1e5, y: -1e5 }, // pointer position relative to the hero
    freeTimer: 0,
    dpr: 1,
    lastNear: 0,
    dot: 2,
    key: '',
    color: '#000',
    sample: { key: '', pts: [] as number[], step: 3 },
    sampleImg: null as HTMLImageElement | null,
  })
  sim.current.color = dark ? '#fff' : '#000'

  // Sample the logo for its current size (cached; pre-warmed while idle so clicks feel instant)
  const getSample = useCallback(() => {
    const img = imgRef.current
    const s = sim.current.sample
    const src = sim.current.sampleImg
    if (!img || !img.offsetWidth || !src?.complete || !src.naturalWidth) return s
    const key = `${img.offsetWidth}x${img.offsetHeight}`
    if (s.key !== key) {
      const step = Math.max(3, Math.round(img.offsetWidth / 120))
      sim.current.sample = { key, step, pts: sampleLogo(src, img.offsetWidth, img.offsetHeight, step) }
    }
    return sim.current.sample
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(sim.current.raf)
    sim.current.raf = 0
  }, [])

  // Back to the crisp logo; release the canvas memory once it has faded out
  const restore = useCallback(() => {
    const s = sim.current
    stop()
    setShattered(false)
    window.clearTimeout(s.freeTimer)
    s.freeTimer = window.setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas && !s.raf) {
        canvas.width = 0
        canvas.height = 0
      }
    }, 1000)
  }, [stop])

  const tick = useCallback(() => {
    const s = sim.current
    const canvas = canvasRef.current
    const section = sectionRef.current
    const img = imgRef.current
    if (!canvas || !section || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const now = performance.now()
    const t = now - s.start
    const w = canvas.width / s.dpr
    const h = canvas.height / s.dpr

    // Pointer geometry once per frame (not per pointermove)
    const sec = section.getBoundingClientRect()
    const { x: cx, y: cy } = s.client
    s.mouse.x = cx - sec.left
    s.mouse.y = cy - sec.top
    const ir = img.getBoundingClientRect()
    if (cx > ir.left - 120 && cx < ir.right + 120 && cy > ir.top - 120 && cy < ir.bottom + 120) s.lastNear = now
    const { x: mx, y: my } = s.mouse
    const r2 = REPEL_RADIUS * REPEL_RADIUS
    let maxOff = 0

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = s.color
    ctx.beginPath()
    for (const p of s.particles) {
      let fr = SCATTER_FRICTION
      if (t > p.delay) {
        // Ease the spring in so the dots drift home instead of snapping
        const k = SPRING * Math.min(1, (t - p.delay) / 700)
        p.vx += (p.hx - p.x) * k
        p.vy += (p.hy - p.y) * k
        fr = RETURN_FRICTION
      }
      const dx = p.x - mx
      const dy = p.y - my
      const d2 = dx * dx + dy * dy
      if (d2 < r2 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const f = (1 - d / REPEL_RADIUS) ** 2 * REPEL_FORCE * 6
        p.vx += (dx / d) * f
        p.vy += (dy / d) * f
      }
      p.vx *= fr
      p.vy *= fr
      p.x += p.vx
      p.y += p.vy
      // Soft bounce off the edges of the hero
      if (p.x < 0) (p.x = 0), (p.vx *= -0.5)
      else if (p.x > w) (p.x = w), (p.vx *= -0.5)
      if (p.y < 0) (p.y = 0), (p.vy *= -0.5)
      else if (p.y > h) (p.y = h), (p.vy *= -0.5)
      maxOff = Math.max(maxOff, Math.abs(p.hx - p.x) + Math.abs(p.hy - p.y))
      ctx.rect(p.x, p.y, s.dot, s.dot)
    }
    ctx.fill()

    const settled = t > 1500 && maxOff < 0.8
    if (settled && now - s.lastNear > RESTORE_IDLE_MS) {
      restore()
      return
    }
    s.raf = requestAnimationFrame(tick)
  }, [restore])

  const shatter = (clientX: number, clientY: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const s = sim.current
    const section = sectionRef.current
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!section || !img || !canvas) return

    window.clearTimeout(s.freeTimer)
    const sec = section.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    s.dpr = dpr
    canvas.width = Math.round(sec.width * dpr)
    canvas.height = Math.round(sec.height * dpr)
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Unscaled layout size of the logo (ignores the hover scale)
    const iw = img.offsetWidth
    const ih = img.offsetHeight
    const ir = img.getBoundingClientRect()
    const ox = ir.left + ir.width / 2 - iw / 2 - sec.left
    const oy = ir.top + ir.height / 2 - ih / 2 - sec.top
    const { pts, step } = getSample()
    const key = `${iw}x${ih}@${ox},${oy}`

    if (key !== s.key || s.particles.length === 0) {
      s.particles = []
      for (let i = 0; i < pts.length; i += 2) {
        const hx = ox + pts[i]
        const hy = oy + pts[i + 1]
        s.particles.push({ x: hx, y: hy, hx, hy, vx: 0, vy: 0, delay: 0 })
      }
      s.key = key
      s.dot = Math.max(1.4, step * 0.62)
    }

    // Blast outward from the click point
    const cx = clientX - sec.left
    const cy = clientY - sec.top
    for (const p of s.particles) {
      const dx = p.x - cx
      const dy = p.y - cy
      const d = Math.hypot(dx, dy) || 1
      const speed = (8 + Math.random() ** 2 * 34) * (0.55 + 0.9 * Math.exp(-d / 350))
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9
      p.vx = Math.cos(a) * speed
      p.vy = Math.sin(a) * speed
      p.delay = 650 + Math.random() * 750
    }

    s.start = performance.now()
    s.lastNear = s.start
    s.client.x = clientX
    s.client.y = clientY
    setShattered(true)
    // Draw the first frame right away so there is no blank gap when the logo hides
    if (!s.raf) tick()
  }

  // Track the cursor relative to the hero for the repel effect
  useEffect(() => {
    const s = sim.current
    const onMove = (e: PointerEvent) => {
      s.client.x = e.clientX
      s.client.y = e.clientY
    }
    const onLeave = () => {
      s.client.x = -1e5
      s.client.y = -1e5
    }
    // Mobile browsers fire resize while scrolling (toolbar show/hide); only react to real layout changes
    let lastW = window.innerWidth
    let lastH = window.innerHeight
    const onResize = () => {
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return
      lastW = window.innerWidth
      lastH = window.innerHeight
      s.particles = []
      s.key = ''
      if (s.raf) restore()
    }
    // Leaving the hero: settle immediately so nothing animates off-screen
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && s.raf) restore()
    })
    if (sectionRef.current) io.observe(sectionRef.current)
    // Load the small sampling image, then pre-sample once the landing animation is done
    const sampleImg = new Image()
    sampleImg.src = logoSample
    s.sampleImg = sampleImg
    const idle = window.setTimeout(() => {
      if (sampleImg.complete) getSample()
      else sampleImg.addEventListener('load', () => getSample(), { once: true })
    }, 2200)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(idle)
      window.clearTimeout(s.freeTimer)
      io.disconnect()
      stop()
    }
  }, [stop, restore, getSample])

  return (
    <section ref={sectionRef} id="top" className="relative flex h-svh items-center justify-center overflow-hidden">
      <button
        type="button"
        onClick={(e) => shatter(e.clientX, e.clientY)}
        // Drop the entrance animation once done so it doesn't keep the logo on an animated layer
        onAnimationEnd={(e) => e.animationName === 'logo-land' && e.currentTarget.classList.remove('logo-land')}
        aria-label="KB Productions logo"
        className="logo-land group relative block cursor-pointer outline-none"
      >
        <span aria-hidden="true" className="logo-glow pointer-events-none absolute inset-0" />
        <img
          ref={imgRef}
          src={logo}
          alt="KB Productions"
          width={366}
          height={514}
          draggable={false}
          fetchPriority="high"
          style={{ transition: `scale .9s cubic-bezier(0.22, 1, 0.36, 1), opacity ${shattered ? '0s' : '.8s ease'}` }}
          className={`relative block h-[78svh] max-h-[900px] w-auto max-w-[85vw] select-none dark:invert ${
            shattered ? 'opacity-0' : 'opacity-100 group-hover:scale-[1.04]'
          }`}
        />
      </button>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: shattered ? 1 : 0, transition: shattered ? 'none' : 'opacity .8s ease' }}
      />

      {/* Scroll cue */}
      <div className="scroll-cue absolute bottom-8 left-6 sm:bottom-10 sm:left-10">
        <a
          href="#about"
          className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] opacity-60 transition-opacity hover:opacity-100"
        >
          <span className="relative block h-7 w-4 overflow-hidden">
            <svg
              className="scroll-cue-arrow absolute inset-0 h-full w-full"
              viewBox="0 0 16 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v23M3 20l5 5 5-5" />
            </svg>
          </span>
          Scroll
        </a>
      </div>
    </section>
  )
}
