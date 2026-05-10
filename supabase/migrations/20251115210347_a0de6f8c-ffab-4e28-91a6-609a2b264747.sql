-- Add is_featured column to portfolio_images table
ALTER TABLE portfolio_images 
ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

-- Add index for better performance when filtering featured images
CREATE INDEX idx_portfolio_images_featured ON portfolio_images(provider_id, is_featured) WHERE is_featured = true;