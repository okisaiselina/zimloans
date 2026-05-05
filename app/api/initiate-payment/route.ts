import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import IntaSend from "intasend-node"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, occupation, phoneNumber, loanAmount, feeAmount, kshAmount } = body

    // Validate required fields
    if (!packageId || !occupation || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Format phone number for IntaSend (should be in format 254XXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/-/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith("254") && !formattedPhone.startsWith("+254")) {
      formattedPhone = "254" + formattedPhone
    }
    formattedPhone = formattedPhone.replace("+", "")

    const supabase = await createClient()

    // Create loan application record
    const { data: application, error: dbError } = await supabase
      .from("loan_applications")
      .insert({
        package_id: packageId,
        occupation,
        phone_number: formattedPhone,
        loan_amount: loanAmount,
        fee_amount: feeAmount,
        ksh_amount: kshAmount,
        payment_status: "pending",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      )
    }

    // Get IntaSend credentials
    const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY
    const secretKey = process.env.INTASEND_SECRET_KEY

    if (!publishableKey || !secretKey) {
      return NextResponse.json({
        success: false,
        error: "Payment gateway not configured",
      }, { status: 500 })
    }

    // Initialize IntaSend - use test_mode based on environment
    const isTestMode = process.env.INTASEND_TEST_MODE === "true"
    const intasend = new IntaSend(publishableKey, secretKey, isTestMode)

    // Create M-Pesa STK Push collection
    const collection = intasend.collection()
    
    const response = await collection.mpesaStkPush({
      first_name: occupation.split(" ")[0] || "Customer",
      last_name: occupation.split(" ").slice(1).join(" ") || "User",
      email: `${formattedPhone}@zimloans.app`,
      phone_number: formattedPhone,
      host: process.env.NEXT_PUBLIC_APP_URL || "https://zimloans.vercel.app",
      amount: kshAmount,
      api_ref: application.id,
      narrative: `Loan processing fee for ZMW ${loanAmount}`,
    })

    if (!response || !response.invoice) {
      // Update application status to failed
      await supabase
        .from("loan_applications")
        .update({ payment_status: "initiation_failed" })
        .eq("id", application.id)

      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 500 }
      )
    }

    // Update application with IntaSend invoice details
    await supabase
      .from("loan_applications")
      .update({
        intasend_invoice_id: response.invoice.invoice_id,
        intasend_tracking_id: response.invoice.tracking_id || null,
        payment_status: "stk_pushed",
      })
      .eq("id", application.id)

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      invoiceId: response.invoice.invoice_id,
      trackingId: response.invoice.tracking_id,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
