import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'

interface NavbarProps {
  dark: boolean
  toggleTheme: () => void
  visible?: boolean
}

export default function Navbar({ dark, toggleTheme, visible: controlledVisible }: NavbarProps) {
  const [internalVisible, setInternalVisible] = useState(false)

  useEffect(() => {
    if (controlledVisible !== undefined) return

    const handleScroll = () => {
      // Show navbar smoothly after scrolling past ~70% of hero section height
      const scrollThreshold = window.innerHeight * 0.7
      setInternalVisible(window.scrollY > scrollThreshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [controlledVisible])

  const visible = controlledVisible !== undefined ? controlledVisible : internalVisible

  return (
    <header
      className={`fixed top-5 sm:top-7 inset-x-0 z-50 flex justify-center px-4 sm:px-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <nav
        aria-label="Main Navigation"
        className="flex w-full max-w-5xl items-center justify-between rounded-full border border-black/10 bg-white/75 px-5 py-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-colors duration-500 dark:border-white/10 dark:bg-[#0c0d12]/80 dark:shadow-[0_16px_48px_rgba(0,0,0,0.55)] sm:px-8 sm:py-4"
      >
        {/* Left: KB Logo */}
        <a
          href="#top"
          aria-label="KB Productions - Scroll to top"
          className="group flex items-center transition-opacity hover:opacity-75 focus-visible:outline-none"
        >
          <img
            src={logo}
            alt="KB Productions"
            width={36}
            height={50}
            className="h-8 sm:h-10 w-auto select-none transition-transform duration-300 group-hover:scale-105 dark:invert"
          />
        </a>

        {/* Center: Nav Links */}
        <div className="flex items-center gap-6 sm:gap-12 text-xs sm:text-[13px] font-medium uppercase tracking-[0.22em]">
          <a
            href="#work"
            className="text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Work
          </a>
          <a
            href="#services"
            className="text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Services
          </a>
          <a
            href="#contact"
            className="text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Contact Us
          </a>
        </div>

        {/* Right: Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-black/15 text-black/70 transition-colors hover:border-black hover:text-black focus-visible:outline-none dark:border-white/20 dark:text-white/70 dark:hover:border-white dark:hover:text-white"
        >
          {dark ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  )
}
