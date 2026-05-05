# ZimLoans Payment Integration Documentation

This document outlines the payment integration setup for ZimLoans using **Paystack** as the payment gateway.

---

## Environment Variables Required

Add the following environment variables to your `.env.local` file or Vercel project settings:

```env
# Paystack API Keys (Get from https://dashboard.paystack.com/#/settings/developers)
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Paystack Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Copy your **Secret Key** (starts with `sk_live_` for production or `sk_test_` for testing)
4. Copy your **Public Key** (starts with `pk_live_` for production or `pk_test_` for testing)

---

## Payment Flow

### 1. User Initiates Payment
- User selects a loan package and clicks "Apply Now"
- Payment modal opens with form for occupation, email, and phone number

### 2. Payment Initialization (`/api/initiate-payment`)
- Creates a loan application record in Supabase
- Initializes a Paystack transaction via their API
- Returns the authorization URL for the user to complete payment

### 3. User Completes Payment
- User is redirected to Paystack checkout page in a new window
- User completes payment using their preferred method (Card, Mobile Money, etc.)

### 4. Payment Verification
- Frontend polls `/api/check-payment-status` every 5 seconds
- Backend verifies transaction status with Paystack API
- Updates loan application status in Supabase

### 5. Webhook Handling (`/api/webhook/paystack`)
- Paystack sends webhook events for payment updates
- Webhook updates loan application status in real-time

---

## API Endpoints

### POST `/api/initiate-payment`
Initiates a new payment transaction.

**Request Body:**
```json
{
  "packageId": "uuid",
  "occupation": "string",
  "phoneNumber": "string",
  "email": "string",
  "loanAmount": 5000,
  "feeAmount": 22,
  "kshAmount": 150
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "uuid",
  "reference": "ZIM_xxxxx_timestamp",
  "authorization_url": "https://checkout.paystack.com/xxxxx"
}
```

### POST `/api/check-payment-status`
Checks the status of a payment transaction.

**Request Body:**
```json
{
  "reference": "ZIM_xxxxx_timestamp",
  "applicationId": "uuid"
}
```

**Response:**
```json
{
  "status": "success|failed|pending",
  "message": "Payment verified successfully"
}
```

### POST `/api/webhook/paystack`
Webhook endpoint for Paystack events.

**Headers Required:**
- `X-Paystack-Signature`: HMAC SHA512 signature for verification

---

## Database Schema

### `loan_packages` Table
```sql
CREATE TABLE loan_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_amount INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  ksh_equivalent INTEGER NOT NULL,
  disbursal_time TEXT DEFAULT '2-hour disbursal',
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `loan_applications` Table
```sql
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES loan_packages(id),
  occupation TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  loan_amount INTEGER NOT NULL,
  fee_amount INTEGER NOT NULL,
  ksh_amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  paystack_reference TEXT,
  paystack_access_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Webhook Setup in Paystack Dashboard

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** > **API Keys & Webhooks**
3. Add your webhook URL: `https://your-domain.com/api/webhook/paystack`
4. Select events to listen to:
   - `charge.success`
   - `charge.failed`

---

## Security Headers

The application is configured with the following security headers in `next.config.mjs`:

- **Access-Control-Allow-Origin**: Allows cross-origin requests for API routes
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filtering
- **Referrer-Policy**: Controls referrer information
- **X-Paystack-Signature**: Accepted header for webhook verification

---

## Changes Made from IntaSend to Paystack

### Removed Files:
- `/app/api/webhook/intasend/route.ts`

### Updated Files:
1. **`/app/api/initiate-payment/route.ts`**
   - Changed from IntaSend STK Push to Paystack Transaction Initialize
   - Added email field support
   - Updated response to include `authorization_url`

2. **`/app/api/check-payment-status/route.ts`**
   - Changed from IntaSend status check to Paystack Verify Transaction
   - Updated status mapping for Paystack responses

3. **`/components/payment-modal.tsx`**
   - Added email input field (required by Paystack)
   - Updated UI text for Paystack flow
   - Changed from STK push messaging to checkout redirect

4. **`/next.config.mjs`**
   - Added `X-Paystack-Signature` to allowed headers
   - Added additional security headers

### New Files:
- `/app/api/webhook/paystack/route.ts` - Paystack webhook handler

---

## Testing

For testing, use Paystack test keys (prefixed with `sk_test_` and `pk_test_`).

Test card details:
- **Card Number**: 4084 0840 8408 4081
- **Expiry**: Any future date
- **CVV**: 408
- **PIN**: 0000
- **OTP**: 123456

---

## Production Checklist

- [ ] Replace test keys with live keys in environment variables
- [ ] Set up webhook URL in Paystack dashboard
- [ ] Enable HTTPS on your domain
- [ ] Test full payment flow with live credentials
- [ ] Monitor Paystack dashboard for transaction logs
