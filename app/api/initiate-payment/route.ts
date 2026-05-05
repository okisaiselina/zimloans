import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, occupation, phoneNumber, loanAmount, feeAmount, kshAmount } = body

    // Validate required fields
    if (!occupation || !phoneNumber || !loanAmount || !feeAmount || !kshAmount) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
      }, { status: 400 })
    }

    // Validate phone number format (Kenyan format)
    const cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "")
    if (!/^254\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({
        success: false,
        error: "Invalid phone number format. Use format: 0712345678 or 254712345678",
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Create loan application record
    const { data: application, error: insertError } = await supabase
      .from("loan_applications")
      .insert({
        package_id: packageId || null,
        occupation,
        phone_number: cleanPhone,
        loan_amount: loanAmount,
        fee_amount: feeAmount,
        ksh_amount: kshAmount,
        payment_status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create application:", insertError)
      return NextResponse.json({
        success: false,
        error: "Failed to create loan application",
      }, { status: 500 })
    }

    // Get IntaSend credentials
    const intasendSecretKey = process.env.INTASEND_SECRET_KEY
    const intasendPublishableKey = process.env.INTASEND_PUBLISHABLE_KEY

    if (!intasendSecretKey || !intasendPublishableKey) {
      return NextResponse.json({
        success: false,
        error: "Payment gateway not configured",
      }, { status: 500 })
    }

    // Use IntaSend M-Pesa STK Push Collection API
    const response = await fetch("https://payment.intasend.com/api/v1/payment/collection/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${intasendSecretKey}`,
        "X-IntaSend-Public-API-Key": intasendPublishableKey,
      },
      body: JSON.stringify({
        amount: kshAmount,
        currency: "KES",
        phone_number: cleanPhone,
        api_ref: application.id,
        name: occupation,
        email: `${cleanPhone}@zimloans.com`,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("IntaSend API error:", responseData)
      
      // Update application status to failed
      await supabase
        .from("loan_applications")
        .update({ payment_status: "failed" })
        .eq("id", application.id)

      return NextResponse.json({
        success: false,
        error: responseData.message || "Payment initiation failed",
      }, { status: response.status })
    }

    // Update application with IntaSend tracking info
    await supabase
      .from("loan_applications")
      .update({
        intasend_invoice_id: responseData.invoice?.invoice_id || responseData.id,
        intasend_tracking_id: responseData.tracking_id || responseData.id,
        payment_status: "processing",
      })
      .eq("id", application.id)

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      invoiceId: responseData.invoice?.invoice_id || responseData.id,
      trackingId: responseData.tracking_id || responseData.id,
      message: "STK push sent to your phone. Please enter your M-Pesa PIN to complete payment.",
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
    }, { status: 500 })
  }
}
