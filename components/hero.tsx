"use client"
import { PaycodeBanner } from "@/components/paycode";
export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#2e7d42]">
      {/* Flowing wave/mesh background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute right-0 bottom-0 w-full h-full"
          viewBox="0 0 1200 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMaxYMax slice"
        >
          {/* Multiple flowing wave lines creating mesh effect */}
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d9e52" stopOpacity="0" />
              <stop offset="30%" stopColor="#3d9e52" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#4db862" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5cc96f" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2d6b3a" stopOpacity="0" />
              <stop offset="40%" stopColor="#3d9e52" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4db862" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Large flowing curves */}
          <path
            d="M400 600 Q600 500 800 520 T1200 450"
            stroke="url(#waveGradient1)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M300 600 Q550 480 750 500 T1200 400"
            stroke="url(#waveGradient1)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M500 600 Q700 520 900 540 T1200 480"
            stroke="url(#waveGradient2)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M350 600 Q580 450 780 480 T1200 350"
            stroke="url(#waveGradient1)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M450 600 Q650 500 850 520 T1200 420"
            stroke="url(#waveGradient2)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Mesh/net-like crossing lines */}
          <path
            d="M600 600 Q750 400 900 450 T1200 300"
            stroke="url(#waveGradient1)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M550 600 Q720 480 880 500 T1200 380"
            stroke="url(#waveGradient2)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M650 600 Q800 450 950 480 T1200 350"
            stroke="url(#waveGradient1)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M500 600 Q680 520 840 540 T1200 450"
            stroke="url(#waveGradient2)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M700 600 Q850 480 1000 510 T1200 420"
            stroke="url(#waveGradient1)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Additional subtle lines for depth */}
          <path
            d="M400 600 Q620 530 820 550 T1200 500"
            stroke="url(#waveGradient2)"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M750 600 Q900 500 1050 530 T1200 470"
            stroke="url(#waveGradient1)"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M600 600 Q780 480 940 510 T1200 400"
            stroke="url(#waveGradient2)"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-12 md:px-6 md:py-20">
        {/*<PaycodeBanner />*/}
        <div className="max-w-2xl">
          {/* Trust badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            <span className="mr-2 text-xs font-bold text-[#f5a623]">ZM</span>
            <span className="text-white/90">Trusted in Zimbabwe</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            <span className="text-white">Quick Financial</span>
            <br />
            <span className="text-[#f5a623]">Solutions</span>
            <br />
            <span className="text-white">When You Need Them</span>
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg leading-relaxed text-white/80 md:text-xl">
            Get up to <span className="font-bold text-[#f5a623]">ZMW 9,500</span> sent directly to your mobile
            money account within 2 hours. No paperwork, no queues.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => scrollToSection("packages")}
              className="rounded-full bg-[#f5a623] px-8 py-3.5 text-base font-semibold text-[#1a472a] shadow-lg hover:bg-[#e09000] transition-all hover:shadow-xl"
            >
              View Loan Packages
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="rounded-full border-2 border-white bg-transparent px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              How It Works
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
