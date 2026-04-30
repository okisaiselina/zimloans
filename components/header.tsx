"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#2e7d42]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-[#f5a623]">Zim</span>
          <span className="text-xl font-bold text-white">Loan</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToSection("packages")}
            className="text-sm font-medium text-white hover:text-[#f5a623] transition-colors"
          >
            Packages
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm font-medium text-white hover:text-[#f5a623] transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("packages")}
            className="rounded-full border-2 border-[#f5a623] bg-transparent px-6 py-2 text-sm font-semibold text-[#f5a623] hover:bg-[#f5a623] hover:text-[#1a472a] transition-colors"
          >
            Apply Now
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-white hover:text-[#f5a623] transition-colors"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <nav className="flex flex-col bg-[#256635] border-t border-white/20">
          <button
            onClick={() => scrollToSection("packages")}
            className="w-full px-6 py-4 text-left text-sm font-medium text-white hover:bg-[#2e7d42] hover:text-[#f5a623] transition-colors border-b border-white/10"
          >
            Packages
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="w-full px-6 py-4 text-left text-sm font-medium text-white hover:bg-[#2e7d42] hover:text-[#f5a623] transition-colors border-b border-white/10"
          >
            How It Works
          </button>
          <div className="p-4">
            <button
              onClick={() => scrollToSection("packages")}
              className="w-full rounded-full border-2 border-[#f5a623] bg-transparent px-6 py-3 text-sm font-semibold text-[#f5a623] hover:bg-[#f5a623] hover:text-[#1a472a] transition-colors"
            >
              Apply Now
            </button>
          </div>
        </nav>
      </div>

      {/* Thin white separator line */}
      <div className="w-full h-[1px] bg-white/30"></div>
    </header>
  )
}
