-- Make landlord_id nullable since not all payment types require a landlord
ALTER TABLE rental_payments ALTER COLUMN landlord_id DROP NOT NULL;

-- Make tenant_id nullable as well for flexibility
ALTER TABLE rental_payments ALTER COLUMN tenant_id DROP NOT NULL;