-- =========================================================================
-- Supabase SQL Workspace Setup Script for HOE Property Management
-- This script configures Row Level Security (RLS), adds the `views` column,
-- and creates the `increment_property_views` RPC database function.
-- =========================================================================

-- -------------------------------------------------------------------------
-- TASK 2: IMPLEMENTING THE VIEWS COUNTER (SQL)
-- -------------------------------------------------------------------------

-- 1. Ensure the 'properties' table has the 'views' column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0 NOT NULL;

-- 2. Create the secure RPC Postgres function to safely increment property views
-- We use SECURITY DEFINER so that any visitor can increment the view count 
-- without granting them write/update permissions on the full property columns.
CREATE OR REPLACE FUNCTION public.increment_property_views(property_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator/database manager
AS $$
BEGIN
  UPDATE public.properties
  SET views = COALESCE(views, 0) + 1
  WHERE id = property_id;
END;
$$;

-- Grant execution permissions to public and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO authenticated;


-- -------------------------------------------------------------------------
-- TASK 1: DATABASE SECURITY AND ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

-- 1. Explicitly enable Row Level Security on the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to prevent conflict when running clean setups
DROP POLICY IF EXISTS "Allow public read access for Live properties" ON public.properties;
DROP POLICY IF EXISTS "Allow landlords full control over their own properties" ON public.properties;

-- 3. Policy: Public viewers should only be able to SELECT rows where the status is Live
CREATE POLICY "Allow public read access for Live properties" 
ON public.properties
FOR SELECT
TO anon, authenticated
USING (status = 'Live');

-- 4. Policy: Authenticated landlords must only be able to SELECT, UPDATE, and DELETE rows 
-- where their auth.uid() perfectly matches the landlord_id column.
-- Note: Landlords also get SELECT access to their own drafts/paused listings.
CREATE POLICY "Allow landlords full control over their own properties"
ON public.properties
FOR ALL
TO authenticated
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);

-- -------------------------------------------------------------------------
-- TASK 5: ENQUIRIES TABLE FOR DIRECT FRONTEND SUBMISSIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  property_address TEXT,
  request_type TEXT,
  source TEXT DEFAULT 'Website Form',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone (public visitors) to submit an enquiry
CREATE POLICY "Allow public inserts for enquiries"
ON public.enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated admins/landlords to read
CREATE POLICY "Allow authenticated to view enquiries"
ON public.enquiries
FOR SELECT
TO authenticated
USING (true);
