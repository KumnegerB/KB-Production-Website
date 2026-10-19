import { useEffect, useRef, useState } from 'react'
import logo from '../assets/logo.png'

interface NavbarProps {
  dark: boolean
  toggleTheme: () => void
  visible?: boolean
}

export default function Navbar({ dark, toggleTheme, visible: controlledVisible }: NavbarProps) {
  const [internalVisible, setInternalVisible] = useState(false)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const scrollTimer = useRef<number | undefined>(undefined)
  const lastScrollY = useRef(0)

  // Track scroll threshold for navbar appearance
  useEffect(() => {
    if (controlledVisible !== undefined) return

    const handleScroll = () => {
      const scrollThreshold = window.innerHeight * 0.7
      setInternalVisible(window.scrollY > scrollThreshold)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [controlledVisible])

  // Track scroll direction: shrink ONLY when scrolling DOWN, keep expanded when scrolling UP
  useEffect(() => {
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY
      const deltaY = currentY - lastScrollY.current

      // Only shrink when scrolling down by a deliberate amount
      if (deltaY > 3) {
        setIsScrollingDown(true)
        window.clearTimeout(scrollTimer.current)
        scrollTimer.current = window.setTimeout(() => {
          setIsScrollingDown(false)
        }, 2000)
      } else if (deltaY < -2) {
        // Scrolling UP: do NOT shrink, expand immediately
        window.clearTimeout(scrollTimer.current)
        setIsScrollingDown(false)
      }

      lastScrollY.current = Math.max(0, currentY)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(scrollTimer.current)
    }
  }, [])

  const visible = controlledVisible !== undefined ? controlledVisible : internalVisible
  // Collapse only when scrolling DOWN, but keep expanded when scrolling UP or hovered
  const isCollapsed = isScrollingDown && !isHovered

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex w-full items-center rounded-full border border-black/10 bg-white/80 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-[#0c0d12]/85 ${
          isCollapsed
            ? 'max-w-[56px] sm:max-w-[64px] h-[52px] sm:h-[58px] px-0 justify-center shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.7)]'
            : 'max-w-[1400px] h-auto px-5 py-3.5 sm:px-8 sm:py-4 justify-between shadow-[0_16px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.55)]'
        }`}
      >
        {/* Left / Center when collapsed: KB Logo */}
        <a
          href="#top"
          aria-label="KB Productions - Scroll to top"
          className="group flex shrink-0 items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-80 focus-visible:outline-none"
        >
          <img
            src={logo}
            alt="KB Productions"
            width={36}
            height={50}
            className={`w-auto select-none transition-all duration-500 group-hover:scale-105 dark:invert ${
              isCollapsed ? 'h-6 sm:h-7' : 'h-8 sm:h-10'
            }`}
          />
        </a>

        {/* Center: Nav Links */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] text-xs sm:text-[13px] font-medium uppercase tracking-[0.22em] ${
            isCollapsed
              ? 'max-w-0 opacity-0 pointer-events-none gap-0 scale-95'
              : 'max-w-[600px] opacity-100 pointer-events-auto gap-6 sm:gap-12 scale-100 delay-100'
          }`}
        >
          <a
            href="#about"
            className="whitespace-nowrap text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            About
          </a>
          <a
            href="#services"
            className="whitespace-nowrap text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Services
          </a>
          <a
            href="#contact"
            className="whitespace-nowrap text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            Contact Us
          </a>
        </div>

        {/* Right: Theme Toggle Button */}
        <div
          className={`flex shrink-0 items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isCollapsed
              ? 'max-w-0 opacity-0 pointer-events-none scale-75'
              : 'max-w-[60px] opacity-100 pointer-events-auto scale-100 delay-100'
          }`}
        >
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
        </div>
      </nav>
    </header>
  )
}
