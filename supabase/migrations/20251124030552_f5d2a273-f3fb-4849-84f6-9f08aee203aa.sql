-- Update status check constraint to include more payment states
ALTER TABLE rental_payments DROP CONSTRAINT IF EXISTS rental_payments_status_check;
ALTER TABLE rental_payments ADD CONSTRAINT rental_payments_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'completed'));

-- Update verification_status check constraint to include all states
ALTER TABLE rental_payments DROP CONSTRAINT IF EXISTS rental_payments_verification_status_check;
ALTER TABLE rental_payments ADD CONSTRAINT rental_payments_verification_status_check 
CHECK (verification_status IN ('verified', 'unverified', 'pending', 'pending_review', 'rejected'));