-- Add payment link field to rental_payments table
ALTER TABLE rental_payments 
ADD COLUMN IF NOT EXISTS payment_link text,
ADD COLUMN IF NOT EXISTS installment_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_first_payment boolean DEFAULT false;

-- Update existing test data to mark first payment
UPDATE rental_payments 
SET is_first_payment = true,
    installment_number = 1
WHERE due_date = (
  SELECT MIN(due_date) 
  FROM rental_payments rp2 
  WHERE rp2.lease_id = rental_payments.lease_id
);

-- Create function to generate payment schedule
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  p_lease_id uuid,
  p_tenant_id uuid,
  p_landlord_id uuid,
  p_lease_start_date date,
  p_lease_duration_months integer,
  p_monthly_rent numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_first_payment_months integer;
  v_first_payment_amount numeric;
  v_remaining_months integer;
  v_installment_start_month integer;
  v_current_due_date date;
  v_installment_num integer;
BEGIN
  -- Determine first payment period based on lease duration
  IF p_lease_duration_months = 12 THEN
    v_first_payment_months := 6;
    v_installment_start_month := 6;
  ELSIF p_lease_duration_months = 24 THEN
    v_first_payment_months := 12;
    v_installment_start_month := 12;
  ELSE
    -- Default: first month only
    v_first_payment_months := 1;
    v_installment_start_month := 1;
  END IF;
  
  v_first_payment_amount := p_monthly_rent * v_first_payment_months;
  v_remaining_months := p_lease_duration_months - v_first_payment_months;
  
  -- Create first payment record
  INSERT INTO rental_payments (
    lease_id,
    tenant_id,
    landlord_id,
    due_date,
    amount,
    status,
    installment_number,
    is_first_payment
  ) VALUES (
    p_lease_id,
    p_tenant_id,
    p_landlord_id,
    p_lease_start_date,
    v_first_payment_amount,
    'pending',
    1,
    true
  );
  
  -- Create remaining installment payments (monthly, starting from 1st of month)
  v_installment_num := 2;
  FOR i IN 1..v_remaining_months LOOP
    v_current_due_date := DATE_TRUNC('month', p_lease_start_date + (v_installment_start_month + i - 1 || ' months')::INTERVAL) + '1 day'::INTERVAL - '1 day'::INTERVAL;
    v_current_due_date := v_current_due_date + '1 day'::INTERVAL; -- First of the month
    
    INSERT INTO rental_payments (
      lease_id,
      tenant_id,
      landlord_id,
      due_date,
      amount,
      status,
      installment_number,
      is_first_payment
    ) VALUES (
      p_lease_id,
      p_tenant_id,
      p_landlord_id,
      v_current_due_date,
      p_monthly_rent,
      'pending',
      v_installment_num,
      false
    );
    
    v_installment_num := v_installment_num + 1;
  END LOOP;
END;
$$;