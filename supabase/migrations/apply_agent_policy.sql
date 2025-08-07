-- SQL to manually apply the missing RLS policy
-- Run this in your Supabase SQL editor or database console

-- Allow agents to view profiles of tenants who have applications for their properties
-- This is needed for receipts and application management
CREATE POLICY "Allow agents to view tenant profiles for their property applications"
  ON public.profiles
  FOR SELECT USING (
    -- Allow if the profile belongs to a tenant who has an application for the current user's property
    EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.beds b ON a.bed_id = b.id
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.properties p ON r.property_id = p.id
      WHERE a.tenant_id = profiles.id 
      AND p.owner_id = auth.uid()
    )
  );
