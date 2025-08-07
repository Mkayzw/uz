-- Migration: Fix application approval issues for property owners
-- Created: 2025-08-13
-- Purpose: Fix RLS policies and create approve_application function to handle application approvals

-- Add property_id column to applications if it doesn't exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE CASCADE;

-- Update existing applications to set property_id based on bed_id
UPDATE applications 
SET property_id = (
    SELECT r.property_id 
    FROM beds b 
    JOIN rooms r ON b.room_id = r.id 
    WHERE b.id = applications.bed_id
)
WHERE property_id IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_bed_id ON applications(bed_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Drop existing RLS policies for applications to recreate them properly
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can view their own applications') THEN
        DROP POLICY "Users can view their own applications" ON applications;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Property owners can view applications for their properties') THEN
        DROP POLICY "Property owners can view applications for their properties" ON applications;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Users can update their own applications') THEN
        DROP POLICY "Users can update their own applications" ON applications;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Property owners can update applications for their properties') THEN
        DROP POLICY "Property owners can update applications for their properties" ON applications;
    END IF;
END $$;

-- Create new RLS policies for applications using IN clauses to prevent recursion
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT
    USING (auth.uid() = tenant_id);

CREATE POLICY "Property owners can view applications for their properties" ON applications
    FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE
    USING (auth.uid() = tenant_id)
    WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Property owners can update applications for their properties" ON applications
    FOR UPDATE
    USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Create or replace the approve_application function
CREATE OR REPLACE FUNCTION public.approve_application(application_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    app_record applications%ROWTYPE;
    bed_record beds%ROWTYPE;
    chat_exists boolean;
BEGIN
    -- Get the application record with authorization check
    SELECT * INTO app_record
    FROM applications a
    WHERE a.id = application_uuid
    AND a.property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or unauthorized';
    END IF;

    -- Get the bed record
    SELECT * INTO bed_record
    FROM beds b
    WHERE b.id = app_record.bed_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bed not found';
    END IF;

    -- Check if bed is already occupied
    IF bed_record.is_occupied THEN
        RAISE EXCEPTION 'Bed is already occupied';
    END IF;

    -- Update application status to approved
    UPDATE applications 
    SET status = 'approved', 
        updated_at = NOW()
    WHERE id = application_uuid;

    -- Mark the bed as occupied
    UPDATE beds 
    SET is_occupied = true, 
        updated_at = NOW()
    WHERE id = app_record.bed_id;

    -- Reject all other pending applications for this bed
    UPDATE applications 
    SET status = 'rejected', 
        updated_at = NOW()
    WHERE bed_id = app_record.bed_id 
    AND id != application_uuid 
    AND status = 'pending';

    -- Check if chat already exists for this application
    SELECT EXISTS (
        SELECT 1 FROM chats WHERE application_id = application_uuid
    ) INTO chat_exists;

    -- Create chat if it doesn't exist
    IF NOT chat_exists THEN
        INSERT INTO chats (title, property_id, application_id, created_at, updated_at)
        VALUES (
            'Application: ' || (SELECT title FROM properties WHERE id = app_record.property_id) || ' - ' || (SELECT full_name FROM profiles WHERE id = app_record.tenant_id),
            app_record.property_id,
            application_uuid,
            NOW(),
            NOW()
        );
    END IF;
END;
$$;

-- Grant execute permission on approve_application to authenticated users
GRANT EXECUTE ON FUNCTION public.approve_application(uuid) TO authenticated;

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- Create trigger to automatically set property_id for new applications
CREATE OR REPLACE FUNCTION trigger_set_application_property_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.property_id IS NULL THEN
        NEW.property_id := (
            SELECT r.property_id 
            FROM beds b 
            JOIN rooms r ON b.room_id = r.id 
            WHERE b.id = NEW.bed_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_application_property_id
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_application_property_id();

-- Add comments for documentation
COMMENT ON FUNCTION public.approve_application(uuid) IS 'Approve an application for a property. Only the property owner can approve applications for their properties. This function handles the approval process including updating application status, marking beds as occupied, rejecting other pending applications, and creating a chat.';
COMMENT ON COLUMN applications.property_id IS 'Direct reference to the property for easier RLS policies and better performance';