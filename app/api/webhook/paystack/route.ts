import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")
    
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(body)
      .digest("hex")

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    const { event, data } = payload

    // Map Paystack events to payment statuses
    const eventStatusMap: Record<string, string> = {
      "charge.success": "completed",
      "charge.failed": "failed",
      "transfer.success": "completed",
      "transfer.failed": "failed",
    }

    const paymentStatus = eventStatusMap[event]
    
    if (!paymentStatus) {
      // Event not relevant, acknowledge receipt
      return NextResponse.json({ received: true })
    }

    const supabase = await createClient()
    const reference = data.reference

    // Find and update the application
    const { data: application, error: findError } = await supabase
      .from("loan_applications")
      .select("*")
      .eq("paystack_reference", reference)
      .single()

    if (findError || !application) {
      console.error("Application not found for reference:", reference)
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Update the application with payment status
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    }

    // Store failure reason if payment failed
    if (paymentStatus === "failed" && data.gateway_response) {
      updateData.payment_status = `failed: ${data.gateway_response}`
    }

    const { error: updateError } = await supabase
      .from("loan_applications")
      .update(updateData)
      .eq("id", application.id)

    if (updateError) {
      console.error("Failed to update application:", updateError)
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      status: paymentStatus,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: "Paystack webhook endpoint active" })
}
