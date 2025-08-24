-- Add price column to properties table
ALTER TABLE properties
ADD COLUMN price NUMERIC;

COMMENT ON COLUMN properties.price IS 'The total monthly rental price for the entire property.';
