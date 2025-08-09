-- Fix the saved_properties table to use property_id instead of bed_id

-- Step 1: Rename the column if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='saved_properties' AND column_name='bed_id') THEN
    ALTER TABLE public.saved_properties RENAME COLUMN bed_id TO property_id;
  END IF;
END $$;

-- Step 2: Drop the old foreign key constraint. The name is typically <table_name>_<column_name>_fkey.
-- Using IF EXISTS to prevent errors if the constraint name is different or doesn't exist.
ALTER TABLE public.saved_properties
DROP CONSTRAINT IF EXISTS saved_properties_bed_id_fkey;

-- Step 3: Add the new foreign key constraint
-- First, drop the constraint if it already exists to make this migration re-runnable.
ALTER TABLE public.saved_properties
DROP CONSTRAINT IF EXISTS saved_properties_property_id_fkey;

ALTER TABLE public.saved_properties
ADD CONSTRAINT saved_properties_property_id_fkey
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Step 4: Enable RLS on the table
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies. Dropping them first ensures the script is re-runnable.
DROP POLICY IF EXISTS "Users can view their own saved properties" ON public.saved_properties;
CREATE POLICY "Users can view their own saved properties"
ON public.saved_properties
FOR SELECT USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can save properties for themselves" ON public.saved_properties;
CREATE POLICY "Users can save properties for themselves"
ON public.saved_properties
FOR INSERT WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can unsave their own saved properties" ON public.saved_properties;
CREATE POLICY "Users can unsave their own saved properties"
ON public.saved_properties
FOR DELETE USING ( auth.uid() = user_id );

COMMENT ON TABLE public.saved_properties IS 'Stores properties that users have saved or favorited.';
COMMENT ON COLUMN public.saved_properties.property_id IS 'References the saved property.';
