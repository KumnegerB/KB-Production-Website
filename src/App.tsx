import LogoHero from './components/LogoHero'
import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const services = [
  ['01', 'Custom Software', 'Purpose-built applications designed around how your business actually works.'],
  ['02', 'Web Applications', 'Fast, reliable, and maintainable web platforms built with modern technology.'],
  ['03', 'System Design', 'Scalable architecture, clear boundaries, and infrastructure that lasts.'],
  ['04', 'API & Integrations', 'Connecting your tools and data through clean, well-documented interfaces.'],
  ['05', 'Technical Consulting', 'Code reviews, audits, and guidance for teams making important decisions.'],
]

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const themeTimer = useRef<number | undefined>(undefined)

  // Enable slow color transitions only while the theme is switching
  const toggleTheme = () => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.clearTimeout(themeTimer.current)
    themeTimer.current = window.setTimeout(() => root.classList.remove('theme-transition'), 1700)
    setDark((d) => !d)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Inertia scrolling: low lerp = slower, softer glide that follows the user's pace
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.05,
      wheelMultiplier: 0.8,
      touchMultiplier: 1,
      autoRaf: true,
      anchors: { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) },
    })
    return () => lenis.destroy()
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.15 },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const label = 'text-xs font-medium uppercase tracking-[0.2em] opacity-50'

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black/70 transition-colors hover:border-black hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white dark:hover:text-white"
      >
        {dark ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        )}
      </button>

      <LogoHero dark={dark} />

      <main className="mx-auto max-w-5xl px-6 sm:px-10">
        <section id="about" className="reveal grid gap-8 border-t border-black/10 py-28 dark:border-white/15 md:grid-cols-[200px_1fr] md:py-40">
          <p className={label}>About</p>
          <div>
            <h2 className="text-3xl font-light leading-tight tracking-tight sm:text-5xl">
              We design and build software that is simple, reliable, and made to last.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed opacity-60">
              KB Productions is a software development studio. We work closely with companies to turn complex
              problems into clear, well-engineered products — from first architecture decisions to production
              systems running at scale.
            </p>
          </div>
        </section>

        <section className="reveal grid gap-8 border-t border-black/10 py-28 dark:border-white/15 md:grid-cols-[200px_1fr] md:py-40">
          <p className={label}>Services</p>
          <ul>
            {services.map(([n, t, d]) => (
              <li key={n} className="grid gap-2 border-b border-black/10 py-8 first:pt-0 dark:border-white/15 sm:grid-cols-[60px_1fr_1.3fr] sm:gap-6">
                <span className="text-sm tabular-nums opacity-40">{n}</span>
                <h3 className="text-xl font-medium tracking-tight">{t}</h3>
                <p className="leading-relaxed opacity-60">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="reveal grid gap-8 border-t border-black/10 py-28 dark:border-white/15 md:grid-cols-[200px_1fr] md:py-40">
          <p className={label}>Contact</p>
          <div>
            <h2 className="text-3xl font-light tracking-tight sm:text-5xl">Have a project in mind?</h2>
            <a href="mailto:hello@kbproductions.com" className="mt-8 inline-block border-b border-current pb-1 text-xl transition-opacity hover:opacity-60 sm:text-2xl">
              hello@kbproductions.com
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl items-center justify-between border-t border-black/10 px-6 py-10 text-sm opacity-60 dark:border-white/15 sm:px-10">
        <span>© {new Date().getFullYear()} KB Productions</span>
        <a href="#top" className="hover:opacity-60">Back to top</a>
      </footer>
    </div>
  )
}
