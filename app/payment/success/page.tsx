"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f5] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-[#1e3d24]">
          Payment Successful!
        </h1>
        
        <p className="mb-6 text-gray-600">
          Thank you for your payment. Your loan application has been received and is being processed. 
          You will receive your funds within 2 hours.
        </p>

        <div className="mb-6 rounded-lg bg-[#e8f5e9] p-4">
          <p className="text-sm text-[#3d7c47]">
            Please ensure your mobile money account is active to receive the funds.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block w-full rounded-lg bg-[#3d7c47] py-3 font-semibold text-white transition-colors hover:bg-[#2d5a35]"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
