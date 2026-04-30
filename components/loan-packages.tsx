"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PaymentModal } from "./payment-modal"

interface LoanPackage {
  id: string
  loan_amount: number
  fee: number
  ksh_equivalent: number
  disbursal_time: string
  is_popular: boolean
}

// Default packages for instant loading
const defaultPackages: LoanPackage[] = [
  { id: "1", loan_amount: 5000, fee: 22, ksh_equivalent: 150, disbursal_time: "2-hour disbursal", is_popular: true },
  { id: "2", loan_amount: 7000, fee: 37, ksh_equivalent: 250, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "3", loan_amount: 9500, fee: 49, ksh_equivalent: 320, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "4", loan_amount: 1200, fee: 55, ksh_equivalent: 370, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "5", loan_amount: 1300, fee: 59, ksh_equivalent: 399, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "6", loan_amount: 1450, fee: 64, ksh_equivalent: 438, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "7", loan_amount: 1550, fee: 70, ksh_equivalent: 500, disbursal_time: "2-hour disbursal", is_popular: false },
  { id: "8", loan_amount: 2000, fee: 85, ksh_equivalent: 600, disbursal_time: "2-hour disbursal", is_popular: false },
]

export function LoanPackages() {
  const [packages, setPackages] = useState<LoanPackage[]>(defaultPackages)
  const [selectedPackage, setSelectedPackage] = useState<LoanPackage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Fetch from database in background to get actual IDs
    async function fetchPackages() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("loan_packages")
        .select("*")
        .order("loan_amount", { ascending: false })

      if (data && !error && data.length > 0) {
        setPackages(data)
      }
    }

    fetchPackages()
  }, [])

  const handleApplyNow = (pkg: LoanPackage) => {
    setSelectedPackage(pkg)
    setIsModalOpen(true)
  }

  return (
    <>
      <section id="packages" className="w-full bg-[#f5f5f5] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-[#3d7c47] bg-white px-4 py-2 text-sm font-medium text-[#3d7c47]">
              Transparent Pricing
            </span>
            <h2 className="mb-4 text-3xl font-bold text-[#1e3d24] md:text-4xl">
              Loan Packages & Fees
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Choose the amount that fits your needs. Low processing fees, no hidden charges.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md ${
                  pkg.is_popular
                    ? "bg-[#3d7c47] text-white"
                    : "bg-white text-[#1e3d24]"
                }`}
              >
                {pkg.is_popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#e9a23b] px-4 py-1 text-xs font-semibold text-[#1e3d24]">
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <p className={`text-sm ${pkg.is_popular ? "text-white/80" : "text-gray-500"}`}>
                    Loan Amount
                  </p>
                  <p className="text-3xl font-bold">
                    ZMW {pkg.loan_amount.toLocaleString()}
                  </p>
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${pkg.is_popular ? "text-white" : "text-[#3d7c47]"}`} />
                    <span className={`text-sm ${pkg.is_popular ? "text-white/90" : "text-gray-600"}`}>
                      Fee: ZMW {pkg.fee}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${pkg.is_popular ? "text-white" : "text-[#3d7c47]"}`} />
                    <span className={`text-sm ${pkg.is_popular ? "text-white/90" : "text-gray-600"}`}>
                      ≈ KSH {pkg.ksh_equivalent}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${pkg.is_popular ? "text-white" : "text-[#3d7c47]"}`} />
                    <span className={`text-sm ${pkg.is_popular ? "text-white/90" : "text-gray-600"}`}>
                      {pkg.disbursal_time}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyNow(pkg)}
                  className={`w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
                    pkg.is_popular
                      ? "bg-white text-[#3d7c47] hover:bg-gray-100"
                      : "bg-[#3d7c47] text-white hover:bg-[#2d5a35]"
                  }`}
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedPackage && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          loanPackage={selectedPackage}
        />
      )}
    </>
  )
}
