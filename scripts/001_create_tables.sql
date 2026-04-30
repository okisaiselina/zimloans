-- Create loan_packages table to store different loan amounts
CREATE TABLE IF NOT EXISTS public.loan_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_amount INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  ksh_equivalent INTEGER NOT NULL,
  disbursal_time TEXT NOT NULL DEFAULT '2-hour disbursal',
  is_popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loan_applications table to store user applications and payment info
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.loan_packages(id),
  occupation TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  loan_amount INTEGER NOT NULL,
  fee_amount INTEGER NOT NULL,
  ksh_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  intasend_invoice_id TEXT,
  intasend_tracking_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow public access for this app (no auth required)
ALTER TABLE public.loan_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read loan packages
CREATE POLICY "Allow public read access to loan_packages" 
  ON public.loan_packages FOR SELECT 
  USING (true);

-- Allow anyone to insert loan applications
CREATE POLICY "Allow public insert to loan_applications" 
  ON public.loan_applications FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read their applications (by phone number lookup via API)
CREATE POLICY "Allow public read access to loan_applications" 
  ON public.loan_applications FOR SELECT 
  USING (true);

-- Allow updates to loan applications (for payment status updates)
CREATE POLICY "Allow public update to loan_applications" 
  ON public.loan_applications FOR UPDATE 
  USING (true);

-- Insert loan packages data
INSERT INTO public.loan_packages (loan_amount, fee, ksh_equivalent, is_popular) VALUES
  (5000, 22, 150, true),
  (7000, 37, 250, false),
  (9500, 49, 320, false),
  (1200, 55, 370, false),
  (1300, 59, 399, false),
  (1450, 64, 438, false),
  (1550, 70, 500, false),
  (2000, 85, 600, false);
