import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference, applicationId } = body

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference" },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
      },
    })

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to verify payment status" },
        { status: 500 }
      )
    }

    const transactionStatus = responseData.data?.status || "pending"
    
    // Map Paystack statuses to our statuses
    let paymentStatus = "pending"
    if (transactionStatus === "success") {
      paymentStatus = "completed"
    } else if (transactionStatus === "failed") {
      paymentStatus = "failed"
    } else if (transactionStatus === "abandoned") {
      paymentStatus = "cancelled"
    } else if (transactionStatus === "pending") {
      paymentStatus = "processing"
    }

    // Update database if we have applicationId
    if (applicationId) {
      const supabase = await createClient()
      await supabase
        .from("loan_applications")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      gatewayStatus: transactionStatus,
      gatewayResponse: responseData.data?.gateway_response || null,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
