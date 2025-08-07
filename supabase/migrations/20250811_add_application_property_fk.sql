-- Create application<->property relationship
ALTER TABLE applications
ADD COLUMN property_id UUID REFERENCES properties(id);

CREATE INDEX idx_applications_property_id ON applications(property_id);