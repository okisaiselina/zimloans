import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Log webhook for debugging
    console.log("IntaSend webhook received:", JSON.stringify(payload, null, 2))

    const { 
      invoice_id,
      tracking_id,
      state,
      api_ref,
      failed_reason,
      failed_code,
    } = payload

    // Map IntaSend states to our payment statuses
    const statusMap: Record<string, string> = {
      PENDING: "pending",
      PROCESSING: "processing",
      COMPLETE: "completed",
      FAILED: "failed",
      CANCELLED: "cancelled",
      RETRY: "retry",
    }

    const paymentStatus = statusMap[state] || state?.toLowerCase() || "unknown"

    const supabase = await createClient()

    // Find the application by api_ref (our application ID) or by tracking_id
    let query = supabase.from("loan_applications").select("*")
    
    if (api_ref) {
      query = query.eq("id", api_ref)
    } else if (tracking_id) {
      query = query.eq("intasend_tracking_id", tracking_id)
    } else if (invoice_id) {
      query = query.eq("intasend_invoice_id", invoice_id)
    } else {
      return NextResponse.json(
        { error: "No identifier provided" },
        { status: 400 }
      )
    }

    const { data: application, error: findError } = await query.single()

    if (findError || !application) {
      console.error("Application not found:", findError)
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

    // Store additional details if payment failed
    if (paymentStatus === "failed" && (failed_reason || failed_code)) {
      updateData.payment_status = `failed: ${failed_reason || failed_code}`
    }

    // Update tracking ID if not already set
    if (tracking_id && !application.intasend_tracking_id) {
      updateData.intasend_tracking_id = tracking_id
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

    // Return success response
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

// Also handle GET for webhook verification if needed
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" })
}
