"use client"

export function Footer() {
  return (
    <footer className="w-full bg-[#2d5a35] py-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#e9a23b]">Zim</span>
              <span className="text-xl font-bold text-white">Loans</span>
            </div>
            <p className="mt-1 text-sm text-white/70">
              Quick financial solutions in Zimbabwe
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-white/90">
              Ensure your registered phone number is active and correct to avoid delays.
            </p>
            <p className="mt-2 text-xs text-white/60">
              © {new Date().getFullYear()} Zim Loan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
