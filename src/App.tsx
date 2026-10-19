import LogoHero from "./components/LogoHero";
import Navbar from "./components/Navbar";
import TechStack from "./components/TechStack";
import KineticScript from "./components/KineticScript";
import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

const services = [
  [
    "01",
    "Custom Software",
    "Purpose-built applications designed around how your business actually works.",
  ],
  [
    "02",
    "Web Applications",
    "Fast, reliable, and maintainable web platforms built with modern technology.",
  ],
  [
    "03",
    "System Design",
    "Scalable architecture, clear boundaries, and infrastructure that lasts.",
  ],
  [
    "04",
    "API & Integrations",
    "Connecting your tools and data through clean, well-documented interfaces.",
  ],
  [
    "05",
    "Technical Consulting",
    "Code reviews, audits, and guidance for teams making important decisions.",
  ],
];

const whyUs = [
  {
    num: "01",
    title: "First Principles",
    desc: "We solve the underlying business bottleneck, not surface-level symptoms.",
  },
  {
    num: "02",
    title: "Disciplined Craft",
    desc: "Clean, maintainable architectures engineered to scale without costly rewrites.",
  },
  {
    num: "03",
    title: "Direct Dialogue",
    desc: "You collaborate directly with senior builders—no middle layers, zero noise.",
  },
  {
    num: "04",
    title: "Total Ownership",
    desc: "From first architecture decisions to production systems running at scale.",
  },
];

export default function App() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [pastHero, setPastHero] = useState(false);
  const themeTimer = useRef<number | undefined>(undefined);

  // Track scroll position to show navbar smoothly when past hero
  useEffect(() => {
    const onScroll = () => {
      const heroThreshold = window.innerHeight * 0.65;
      setPastHero(window.scrollY > heroThreshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Enable slow color transitions only while the theme is switching
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.clearTimeout(themeTimer.current);
    themeTimer.current = window.setTimeout(
      () => root.classList.remove("theme-transition"),
      1700,
    );
    setDark((d) => !d);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Inertia scrolling: low lerp = slower, softer glide that follows the user's pace
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.05,
      wheelMultiplier: 0.8,
      touchMultiplier: 1,
      autoRaf: true,
      anchors: { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) },
    });
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach(
          (e) =>
            e.isIntersecting &&
            (e.target.classList.add("in"), io.unobserve(e.target)),
        ),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const label = "text-xs sm:text-sm font-mono font-medium uppercase tracking-[0.25em] opacity-45 pt-1.5";

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <Navbar dark={dark} toggleTheme={toggleTheme} visible={pastHero} />

      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={`fixed right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black/70 transition-all duration-500 hover:border-black hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white dark:hover:text-white ${
          pastHero
            ? "pointer-events-none -translate-y-2 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        {dark ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        )}
      </button>

      <LogoHero dark={dark} />

      <main className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16">
        <section
          id="about"
          className="reveal relative grid gap-10 border-t border-black/10 py-32 dark:border-white/15 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] md:py-44"
        >
          <p className={label}>About</p>
          <div>
            <h2 className="text-4xl font-light leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              We design and build software that is{" "}
              <KineticScript text="simple" />
              , reliable, and made to last.
            </h2>
            <p className="mt-10 max-w-4xl text-xl leading-relaxed opacity-65 sm:text-2xl font-light">
              KB Productions is a software development studio. We work closely
              with companies to turn complex problems into clear,
              well-engineered products — from first architecture decisions to
              production systems running at scale.
            </p>
          </div>
        </section>

        <section
          id="services"
          className="reveal grid gap-10 border-t border-black/10 py-32 dark:border-white/15 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] md:py-44"
        >
          <p className={label}>Services</p>
          <ul className="divide-y divide-black/10 dark:divide-white/15">
            {services.map(([n, t, d]) => (
              <li
                key={n}
                className="grid gap-4 py-10 sm:py-12 first:pt-0 sm:grid-cols-[70px_1.1fr_1.6fr] sm:gap-8 items-baseline"
              >
                <span className="text-base font-mono tabular-nums opacity-40">{n}</span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight">{t}</h3>
                <p className="text-base sm:text-lg leading-relaxed opacity-65">{d}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="work"
          className="reveal border-t border-black/10 py-32 dark:border-white/15 md:py-44"
        >
          <div className="grid gap-10 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">
            <p className={label}>Selected Work</p>
            <div>
              <h2 className="text-4xl font-light leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
                A clean slate. Undivided focus. Be our{" "}
                <KineticScript text="first" /> client.
              </h2>
              <p className="mt-10 max-w-4xl text-xl leading-relaxed opacity-65 sm:text-2xl font-light">
                We are currently opening our books for our inaugural collaboration. That means
                100% of our engineering bandwidth dedicated to your product, zero competing client
                deadlines, and an obsessive commitment to making your build our flagship case study.
              </p>

              <div className="mt-12">
                <a
                  href="#contact"
                  className="font-display inline-block border-b-2 border-current pb-1 text-xl sm:text-2xl font-normal transition-opacity hover:opacity-60"
                >
                  Start a project together →
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="why-us"
          className="reveal border-t border-black/10 py-32 dark:border-white/15 md:py-44"
        >
          <div className="flex flex-col gap-16 sm:gap-20">
            <div className="flex flex-col gap-5">
              <p className={label}>Why Work With Us</p>
              <h2 className="text-4xl font-light leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl max-w-5xl">
                Engineered for teams that value simplicity and{" "}
                <KineticScript text="craft" />
                .
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 lg:gap-10">
              {whyUs.map(({ num, title, desc }) => (
                <div
                  key={num}
                  className="group flex flex-col border-t border-black/10 pt-8 transition-colors duration-500 hover:border-black/50 dark:border-white/15 dark:hover:border-white/50"
                >
                  <span className="text-sm font-mono tabular-nums opacity-40 transition-opacity duration-300 group-hover:opacity-75">
                    {num}
                  </span>
                  <h3 className="mt-5 text-xl font-medium tracking-tight sm:text-2xl">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed opacity-65 transition-opacity duration-300 group-hover:opacity-85">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TechStack />

        <section
          id="contact"
          className="reveal grid gap-10 border-t border-black/10 py-32 dark:border-white/15 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr] md:py-44"
        >
          <p className={label}>Contact</p>
          <div>
            <h2 className="text-4xl font-light leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              Have a{" "}
              <KineticScript text="project" />{" "}
              in mind?
            </h2>
            <a
              href="mailto:kb.productions.work@gmail.com"
              className="font-display mt-10 inline-block border-b-2 border-current pb-2 text-2xl sm:text-4xl lg:text-5xl font-light transition-opacity hover:opacity-60"
            >
              kb.productions.work@gmail.com
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1400px] items-center justify-between border-t border-black/10 px-6 py-12 text-sm opacity-60 dark:border-white/15 sm:px-12 lg:px-16">
        <span>© {new Date().getFullYear()} KB Productions</span>
        <a href="#top" className="hover:opacity-60">
          Back to top
        </a>
      </footer>
    </div>
  );
}
