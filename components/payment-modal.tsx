"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, CheckCircle, XCircle, Clock, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export function PaymentModal({ isOpen, onClose, loanPackage }: PaymentModalProps) {
  const [occupation, setOccupation] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")
  const [error, setError] = useState("")
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const { toast } = useToast()

  // Reset state when modal closes
  const resetState = useCallback(() => {
    setOccupation("")
    setPhoneNumber("")
    setPaymentStatus("idle")
    setError("")
    setTrackingId(null)
    setApplicationId(null)
    setTimeLeft(30)
  }, [])

  // Poll for payment status during processing
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let timeoutTimer: NodeJS.Timeout | null = null

    if (paymentStatus === "processing" && applicationId) {
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

      // Poll every 3 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/check-payment-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applicationId, trackingId }),
          })

          const data = await response.json()

          if (data.status === "completed") {
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
      }, 3000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (timeoutTimer) clearInterval(timeoutTimer)
    }
  }, [paymentStatus, trackingId, applicationId, toast])

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen, resetState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPaymentStatus("initiating")

    try {
      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: loanPackage.id,
          occupation,
          phoneNumber,
          loanAmount: loanPackage.loan_amount,
          feeAmount: loanPackage.fee,
          kshAmount: loanPackage.ksh_equivalent,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment initiation failed")
      }

      // STK push sent successfully
      setTrackingId(data.trackingId)
      setApplicationId(data.applicationId)
      setPaymentStatus("processing")
      setTimeLeft(30)

      toast({
        title: "Check Your Phone",
        description: "An M-Pesa payment request has been sent to your phone. Enter your PIN to complete.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPaymentStatus("failed")
    }
  }

  const handleRetry = () => {
    setPaymentStatus("idle")
    setError("")
    setTrackingId(null)
    setApplicationId(null)
    setTimeLeft(30)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  if (!isOpen) return null

  return (
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

        {/* Payment Processing - STK Push Sent */}
        {paymentStatus === "processing" && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f5e9]">
              <Smartphone className="h-8 w-8 text-[#3d7c47]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-[#1e3d24]">
              Check Your Phone
            </h3>
            <p className="mb-4 text-gray-600">
              An M-Pesa payment request has been sent to your phone. Enter your PIN to complete the payment.
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
                disabled={paymentStatus === "initiating"}
                className="w-full rounded-lg bg-[#3d7c47] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2d5a35] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {paymentStatus === "initiating" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending STK Push...
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
  )
}
