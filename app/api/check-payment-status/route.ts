import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import IntaSend from "intasend-node"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, applicationId } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoice ID" },
        { status: 400 }
      )
    }

    const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY
    const secretKey = process.env.INTASEND_SECRET_KEY

    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    // Initialize IntaSend
    const isTestMode = process.env.INTASEND_TEST_MODE === "true"
    const intasend = new IntaSend(publishableKey, secretKey, isTestMode)

    // Check invoice status
    const collection = intasend.collection()
    const response = await collection.status(invoiceId)

    const invoiceState = response?.invoice?.state || "PENDING"
    
    // Map IntaSend statuses to our statuses
    let paymentStatus = "pending"
    if (invoiceState === "COMPLETE") {
      paymentStatus = "completed"
    } else if (invoiceState === "FAILED") {
      paymentStatus = "failed"
    } else if (invoiceState === "PROCESSING") {
      paymentStatus = "processing"
    } else if (invoiceState === "PENDING") {
      paymentStatus = "pending"
    }

    // Update database if we have applicationId
    if (applicationId && (paymentStatus === "completed" || paymentStatus === "failed")) {
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
      status: invoiceState,
      paymentStatus: paymentStatus,
      message: response?.invoice?.failed_reason || null,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
