'use client'

import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ThemeToggle'
import PropertyImage from '@/components/PropertyImage'
import DashboardWrapper from '@/components/DashboardWrapper'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
}

interface Property {
  id: string;
  title: string;
  location: string | null;
  image_url: string | null;
  view_count: number;
  created_at: string;
  description?: string | null;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  image_urls?: string[] | null;
  active?: boolean;
  property_type?: string | null;
  has_internet?: boolean;
  has_parking?: boolean;
  has_air_conditioning?: boolean;
  is_furnished?: boolean;
}

interface Application {
  id: string;
  bed_id: string;
  tenant_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  property?: Property;
}

interface SavedProperty {
  id: string;
  bed_id: string;
  user_id: string;
  created_at: string;
  property?: Property;
}

export default function DashboardPage() {
  return <DashboardWrapper />
}
