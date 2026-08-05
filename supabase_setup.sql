-- =========================================================================
-- MASTER SUPABASE BACKEND WORKSPACE SETUP SCRIPT
-- Project: HOE Property Management
-- Description: Configures complete database schemas, automatic user profile
--              synchronization, Row Level Security (RLS) policies, and performance functions.
-- Location: Paste this script directly into the Supabase SQL Editor.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. USER PROFILES DATABASE & AUTO-SYNC ENGINE
-- -------------------------------------------------------------------------

-- Create the profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  bio TEXT,
  contact_number TEXT,
  is_public_contact BOOLEAN DEFAULT FALSE,
  show_phone_number BOOLEAN DEFAULT FALSE,
  show_email BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'tenant'::text CHECK (role IN ('tenant', 'landlord', 'both', 'agent')),
  is_phone_verified BOOLEAN DEFAULT FALSE,
  address TEXT,
  search_radius TEXT DEFAULT '15',
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  managed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- RLS: Allow public reading of profile roles/contact details
CREATE POLICY "Allow public read access for profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- RLS: Allow logged in users to modify only their own profile
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create profile sync function to handle automatic inserts & updates from auth.users metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    photo_url,
    bio,
    contact_number,
    is_public_contact,
    show_phone_number,
    show_email,
    role,
    is_phone_verified,
    address,
    search_radius,
    email_notifications,
    sms_notifications,
    push_notifications,
    managed_by
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'displayName', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'photoURL', ''),
    COALESCE(new.raw_user_meta_data->>'bio', ''),
    COALESCE(new.raw_user_meta_data->>'contactNumber', ''),
    COALESCE((new.raw_user_meta_data->>'isPublicContact')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'showPhoneNumber')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'showEmail')::boolean, false),
    COALESCE(new.raw_user_meta_data->>'role', 'tenant'),
    COALESCE((new.raw_user_meta_data->>'isPhoneVerified')::boolean, false),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(new.raw_user_meta_data->>'searchRadius', '15'),
    COALESCE((new.raw_user_meta_data->>'emailNotifications')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'smsNotifications')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'pushNotifications')::boolean, true),
    NULLIF(new.raw_user_meta_data->>'managed_by', '')::uuid
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    photo_url = EXCLUDED.photo_url,
    bio = EXCLUDED.bio,
    contact_number = EXCLUDED.contact_number,
    is_public_contact = EXCLUDED.is_public_contact,
    show_phone_number = EXCLUDED.show_phone_number,
    show_email = EXCLUDED.show_email,
    role = EXCLUDED.role,
    is_phone_verified = EXCLUDED.is_phone_verified,
    address = EXCLUDED.address,
    search_radius = EXCLUDED.search_radius,
    email_notifications = EXCLUDED.email_notifications,
    sms_notifications = EXCLUDED.sms_notifications,
    push_notifications = EXCLUDED.push_notifications,
    managed_by = EXCLUDED.managed_by,
    updated_at = now();
  RETURN new;
END;
$$;

-- Create dynamic sync triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_changes();


-- -------------------------------------------------------------------------
-- 2. PROPERTIES SCHEMA & SECURITY POLICIES
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('House', 'Flat', 'Detached', 'Terrace')),
  listing_type TEXT DEFAULT 'Let'::text CHECK (listing_type IN ('Let', 'Buy')),
  status TEXT DEFAULT 'Draft'::text CHECK (status IN ('Live', 'Draft', 'Paused', 'Archived')),
  image_urls JSONB DEFAULT '[]'::jsonb NOT NULL,
  views INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access for Live properties" ON public.properties;
DROP POLICY IF EXISTS "Allow landlords full control over their own properties" ON public.properties;

-- RLS: Public seekers should only see 'Live' properties
CREATE POLICY "Allow public read access for Live properties" 
ON public.properties
FOR SELECT
TO anon, authenticated
USING (status = 'Live');

-- RLS: Landlords can create, view, modify, and delete their own properties
CREATE POLICY "Allow landlords full control over their own properties"
ON public.properties
FOR ALL
TO authenticated
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);


-- -------------------------------------------------------------------------
-- 3. ENQUIRIES SCHEMA & SECURITY POLICIES
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public inserts for enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow authenticated to view enquiries" ON public.enquiries;

-- RLS: Allow any visitor to submit an enquiry
CREATE POLICY "Allow public inserts for enquiries"
ON public.enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- RLS: Allow authenticated landlords/agents to view enquiries
CREATE POLICY "Allow authenticated to view enquiries"
ON public.enquiries
FOR SELECT
TO authenticated
USING (true);


-- -------------------------------------------------------------------------
-- 4. UTILITIES & HELPER FUNCTIONS
-- -------------------------------------------------------------------------

-- Create the secure RPC function to safely increment property views
CREATE OR REPLACE FUNCTION public.increment_property_views(property_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET views = COALESCE(views, 0) + 1
  WHERE id = property_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO authenticated;
