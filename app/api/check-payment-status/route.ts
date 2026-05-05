import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, trackingId } = body

    if (!applicationId) {
      return NextResponse.json({
        success: false,
        error: "Application ID is required",
      }, { status: 400 })
    }

    const supabase = await createClient()

    // First check our database for the current status
    const { data: application, error: dbError } = await supabase
      .from("loan_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (dbError || !application) {
      return NextResponse.json({
        success: false,
        error: "Application not found",
      }, { status: 404 })
    }

    // If already completed or failed, return the status
    if (application.payment_status === "completed" || application.payment_status === "failed") {
      return NextResponse.json({
        success: true,
        status: application.payment_status,
        applicationId: application.id,
      })
    }

    // Check with IntaSend API for real-time status
    const intasendSecretKey = process.env.INTASEND_SECRET_KEY
    const intasendPublishableKey = process.env.INTASEND_PUBLISHABLE_KEY

    if (intasendSecretKey && trackingId) {
      try {
        const response = await fetch(`https://payment.intasend.com/api/v1/payment/collection/${trackingId}/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${intasendSecretKey}`,
            "X-IntaSend-Public-API-Key": intasendPublishableKey || "",
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          let newStatus = application.payment_status
          
          if (data.state === "COMPLETE" || data.state === "SUCCESSFUL") {
            newStatus = "completed"
          } else if (data.state === "FAILED" || data.state === "CANCELLED") {
            newStatus = "failed"
          } else if (data.state === "PENDING" || data.state === "PROCESSING") {
            newStatus = "processing"
          }

          // Update database if status changed
          if (newStatus !== application.payment_status) {
            await supabase
              .from("loan_applications")
              .update({ 
                payment_status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq("id", applicationId)
          }

          return NextResponse.json({
            success: true,
            status: newStatus,
            applicationId: application.id,
            intasendState: data.state,
          })
        }
      } catch (apiError) {
        console.error("IntaSend API check error:", apiError)
      }
    }

    // Return current database status if API check fails
    return NextResponse.json({
      success: true,
      status: application.payment_status,
      applicationId: application.id,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to check payment status",
    }, { status: 500 })
  }
}
