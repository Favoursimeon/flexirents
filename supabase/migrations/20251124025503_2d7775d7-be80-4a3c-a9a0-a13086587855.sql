-- Make lease_id nullable to support non-rental payments
ALTER TABLE rental_payments ALTER COLUMN lease_id DROP NOT NULL;

-- Add payment_type column to distinguish between different payment types
ALTER TABLE rental_payments ADD COLUMN payment_type text DEFAULT 'rental' CHECK (payment_type IN ('rental', 'sale', 'service'));

-- Add reference columns for different payment types
ALTER TABLE rental_payments ADD COLUMN property_id uuid;
ALTER TABLE rental_payments ADD COLUMN booking_id uuid;

-- Add foreign key constraints
ALTER TABLE rental_payments 
ADD CONSTRAINT fk_property 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE SET NULL;

ALTER TABLE rental_payments 
ADD CONSTRAINT fk_booking 
FOREIGN KEY (booking_id) 
REFERENCES bookings(id) 
ON DELETE SET NULL;

-- Update the table comment to reflect new usage
COMMENT ON TABLE rental_payments IS 'Stores all payment records including rentals, sales, and service bookings';