import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-intasend-signature")
    
    const intasendSecretKey = process.env.INTASEND_SECRET_KEY
    
    if (!intasendSecretKey) {
      console.error("IntaSend secret key not configured")
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      )
    }

    // Verify webhook signature if provided
    if (signature) {
      const expectedSignature = crypto
        .createHmac("sha256", intasendSecretKey)
        .update(body)
        .digest("hex")

      if (expectedSignature !== signature) {
        console.error("Invalid webhook signature")
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(body)
    
    // IntaSend webhook payload structure
    const { invoice_id, state, api_ref, failed_reason } = payload

    if (!invoice_id) {
      return NextResponse.json({ received: true, message: "No invoice_id provided" })
    }

    // Map IntaSend states to payment statuses
    const stateStatusMap: Record<string, string> = {
      "COMPLETE": "completed",
      "FAILED": "failed",
      "PROCESSING": "processing",
      "PENDING": "pending",
      "RETRY": "pending",
    }

    const paymentStatus = stateStatusMap[state] || "pending"
    
    const supabase = await createClient()

    // Find application by invoice_id or api_ref (application id)
    let application = null
    
    // First try by invoice_id
    const { data: byInvoice } = await supabase
      .from("loan_applications")
      .select("*")
      .eq("intasend_invoice_id", invoice_id)
      .single()
    
    if (byInvoice) {
      application = byInvoice
    } else if (api_ref) {
      // Try by api_ref (which should be the application id)
      const { data: byRef } = await supabase
        .from("loan_applications")
        .select("*")
        .eq("id", api_ref)
        .single()
      
      if (byRef) {
        application = byRef
      }
    }

    if (!application) {
      console.error("Application not found for invoice:", invoice_id, "api_ref:", api_ref)
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Update the application with payment status
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      intasend_invoice_id: invoice_id,
      updated_at: new Date().toISOString(),
    }

    // Store failure reason if payment failed
    if (paymentStatus === "failed" && failed_reason) {
      updateData.payment_status = `failed: ${failed_reason}`
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
  return NextResponse.json({ status: "IntaSend webhook endpoint active" })
}
