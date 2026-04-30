"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Script from "next/script"

interface LoanPackage {
  id: string
  loan_amount: number
  fee: number
  ksh_equivalent: number
  disbursal_time: string
  is_popular: boolean
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  loanPackage: LoanPackage
}

type PaymentStatus = "idle" | "initiating" | "processing" | "completed" | "failed" | "timeout"

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        channels?: string[]
        metadata?: Record<string, unknown>
        onClose: () => void
        callback: (response: { reference: string; status: string }) => void
      }) => {
        openIframe: () => void
      }
    }
  }
}

export function PaymentModal({ isOpen, onClose, loanPackage }: PaymentModalProps) {
  const [occupation, setOccupation] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [error, setError] = useState("")
  const [reference, setReference] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const { toast } = useToast()

  // Reset state when modal closes
  const resetState = useCallback(() => {
    setOccupation("")
    setPhoneNumber("")
    setEmail("")
    setPaymentStatus("idle")
    setError("")
    setReference(null)
    setApplicationId(null)
    setTimeLeft(60)
  }, [])

  // Poll for payment status during processing
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let timeoutTimer: NodeJS.Timeout | null = null

    if (paymentStatus === "processing" && reference) {
      // Start countdown timer
      timeoutTimer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentStatus("timeout")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Poll every 5 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/check-payment-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference, applicationId }),
          })

          const data = await response.json()

          if (data.status === "success" || data.status === "completed") {
            setPaymentStatus("completed")
            toast({
              title: "Payment Successful!",
              description: "Your loan application is being processed. You will receive your funds within 2 hours.",
            })
          } else if (data.status === "failed") {
            setPaymentStatus("failed")
            setError(data.message || "Payment was declined or cancelled")
          }
        } catch {
          // Continue polling on error
        }
      }, 5000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (timeoutTimer) clearInterval(timeoutTimer)
    }
  }, [paymentStatus, reference, applicationId, toast])

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  const openPaystackPopup = useCallback((config: {
    publicKey: string
    email: string
    amount: number
    reference: string
    currency: string
    phone: string
    metadata: Record<string, unknown>
  }) => {
    if (!window.PaystackPop) {
      setError("Payment system not loaded. Please refresh and try again.")
      setPaymentStatus("failed")
      return
    }

    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency,
      ref: config.reference,
      channels: ['card', 'bank', 'ussd', 'mobile_money'],
      metadata: config.metadata,
      onClose: () => {
        // User closed the popup without completing payment
        if (paymentStatus === "processing") {
          setPaymentStatus("failed")
          setError("Payment was cancelled")
        }
      },
      callback: (response) => {
        // Payment completed successfully
        if (response.status === "success" || response.reference) {
          setPaymentStatus("completed")
          toast({
            title: "Payment Successful!",
            description: "Your loan application is being processed. You will receive your funds within 2 hours.",
          })
        } else {
          setPaymentStatus("failed")
          setError("Payment could not be completed")
        }
      },
    })

    handler.openIframe()
  }, [paymentStatus, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPaymentStatus("initiating")

    if (!paystackLoaded) {
      setError("Payment system is still loading. Please wait a moment and try again.")
      setPaymentStatus("idle")
      return
    }

    try {
      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: loanPackage.id,
          occupation,
          phoneNumber,
          email,
          loanAmount: loanPackage.loan_amount,
          feeAmount: loanPackage.fee,
          kshAmount: loanPackage.ksh_equivalent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initiation failed")
      }

      setReference(data.reference)
      setApplicationId(data.applicationId)
      setPaymentStatus("processing")
      setTimeLeft(60)

      // Open Paystack inline popup (same tab)
      openPaystackPopup({
        publicKey: data.publicKey,
        email: email,
        amount: loanPackage.ksh_equivalent * 100, // Paystack uses kobo/cents
        reference: data.reference,
        currency: "KES",
        phone: phoneNumber,
        metadata: {
          occupation,
          phone_number: phoneNumber,
          loan_amount: loanPackage.loan_amount,
          application_id: data.applicationId,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPaymentStatus("failed")
    }
  }

  const handleRetry = () => {
    setPaymentStatus("idle")
    setError("")
    setReference(null)
    setApplicationId(null)
    setTimeLeft(60)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Load Paystack inline script */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="lazyOnload"
        onLoad={() => setPaystackLoaded(true)}
        onError={() => setError("Failed to load payment system")}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            disabled={paymentStatus === "processing"}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Payment Completed */}
          {paymentStatus === "completed" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1e3d24]">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                Your loan application is being processed. You will receive your{" "}
                <span className="font-semibold">ZMW {loanPackage.loan_amount.toLocaleString()}</span>{" "}
                within 2 hours.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 w-full rounded-lg bg-[#3d7c47] py-3 text-white hover:bg-[#2d5a35]"
              >
                Done
              </button>
            </div>
          )}

          {/* Payment Processing */}
          {paymentStatus === "processing" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5e9]">
                <Loader2 className="h-8 w-8 text-[#3d7c47] animate-spin" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1e3d24]">
                Complete Your Payment
              </h3>
              <p className="mb-4 text-gray-600">
                Please complete your payment in the popup window. Do not close this page.
              </p>
              <div className="mb-4 flex items-center justify-center gap-2 text-[#3d7c47]">
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">{timeLeft}s</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for payment confirmation...
              </div>
            </div>
          )}

          {/* Payment Timeout */}
          {paymentStatus === "timeout" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1e3d24]">
                Payment Timed Out
              </h3>
              <p className="text-gray-600">
                We did not receive a response in time. If you completed the payment, please wait a moment or try again.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-lg bg-[#3d7c47] py-3 text-white hover:bg-[#2d5a35]"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Payment Failed */}
          {paymentStatus === "failed" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#1e3d24]">
                Payment Failed
              </h3>
              <p className="text-gray-600">
                {error || "The payment could not be completed. Please try again."}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-gray-300 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-lg bg-[#3d7c47] py-3 text-white hover:bg-[#2d5a35]"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Initial Form */}
          {(paymentStatus === "idle" || paymentStatus === "initiating") && (
            <>
              <h2 className="mb-2 text-xl font-bold text-[#1e3d24]">
                Pay Processing Fee
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Pay{" "}
                <span className="font-semibold text-[#3d7c47]">
                  ZMW {loanPackage.fee} (KSH {loanPackage.ksh_equivalent})
                </span>{" "}
                processing fee for your{" "}
                <span className="font-semibold text-[#1e3d24]">
                  ZMW {loanPackage.loan_amount.toLocaleString()}
                </span>{" "}
                loan.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="occupation"
                    className="mb-1 block text-sm font-medium text-[#1e3d24]"
                  >
                    Occupation
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Teacher, Farmer, Business Owner"
                    required
                    disabled={paymentStatus === "initiating"}
                    className="w-full rounded-lg border border-gray-200 bg-[#e8f5e9] px-4 py-3 text-sm text-[#1e3d24] placeholder:text-gray-400 focus:border-[#3d7c47] focus:outline-none focus:ring-1 focus:ring-[#3d7c47] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-[#1e3d24]"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. your.email@example.com"
                    required
                    disabled={paymentStatus === "initiating"}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-[#1e3d24] placeholder:text-gray-400 focus:border-[#3d7c47] focus:outline-none focus:ring-1 focus:ring-[#3d7c47] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1 block text-sm font-medium text-[#1e3d24]"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678 or 254712345678"
                    required
                    disabled={paymentStatus === "initiating"}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-[#1e3d24] placeholder:text-gray-400 focus:border-[#3d7c47] focus:outline-none focus:ring-1 focus:ring-[#3d7c47] disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your registered mobile money number
                  </p>
                </div>

                {error && paymentStatus === "idle" && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paymentStatus === "initiating" || !paystackLoaded}
                  className="w-full rounded-lg bg-[#3d7c47] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d5a35] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentStatus === "initiating" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Initiating Payment...
                    </span>
                  ) : !paystackLoaded ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading Payment System...
                    </span>
                  ) : (
                    `Pay ZMW ${loanPackage.fee} (KSH ${loanPackage.ksh_equivalent})`
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
