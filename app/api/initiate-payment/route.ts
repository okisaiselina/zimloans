import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, occupation, phoneNumber, email, loanAmount, feeAmount, kshAmount } = body

    // Validate required fields
    if (!packageId || !occupation || !phoneNumber || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Format phone number for Paystack (should be in format 254XXXXXXXXX)
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

    // Get Paystack credentials
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    const paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY

    if (!paystackSecretKey || !paystackPublicKey) {
      return NextResponse.json({
        success: false,
        error: "Payment gateway not configured",
      }, { status: 500 })
    }

    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${paystackSecretKey}`,
      },
      body: JSON.stringify({
        email: email,
        amount: kshAmount * 100, // Paystack expects amount in kobo/cents
        currency: "KES",
        reference: application.id,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://zimloans.vercel.app'}/payment/callback`,
        channels: ["mobile_money"],
        mobile_money: {
          phone: formattedPhone,
          provider: "mpesa"
        },
        metadata: {
          application_id: application.id,
          loan_amount: loanAmount,
          fee_amount: feeAmount,
          occupation: occupation,
          custom_fields: [
            {
              display_name: "Loan Amount",
              variable_name: "loan_amount",
              value: `ZMW ${loanAmount}`
            },
            {
              display_name: "Processing Fee",
              variable_name: "processing_fee", 
              value: `KSH ${kshAmount}`
            }
          ]
        }
      }),
    })

    const responseData = await response.json()

    if (!response.ok || !responseData.status) {
      // Update application status to failed
      await supabase
        .from("loan_applications")
        .update({ payment_status: "initiation_failed" })
        .eq("id", application.id)

      return NextResponse.json(
        { error: responseData.message || "Failed to initialize payment" },
        { status: 500 }
      )
    }

    // Update application with Paystack reference
    await supabase
      .from("loan_applications")
      .update({
        paystack_reference: responseData.data.reference,
        paystack_access_code: responseData.data.access_code,
        payment_status: "initialized",
      })
      .eq("id", application.id)

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      reference: responseData.data.reference,
      access_code: responseData.data.access_code,
      authorization_url: responseData.data.authorization_url,
      publicKey: paystackPublicKey,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
