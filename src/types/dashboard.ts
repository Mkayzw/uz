export interface Bed {
  id: string
  bed_number: number
  room_id: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent'
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
  ecocash_number?: string | null
  registration_number?: string | null
  national_id?: string | null
}

export interface Property {
  id: string;
  title: string;
  description?: string | null;
  location: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  image_url: string | null;
  image_urls?: string[] | null;
  has_internet?: boolean;
  has_parking?: boolean;
  has_air_conditioning?: boolean;
  is_furnished?: boolean;
  has_pool?: boolean;
  has_power?: boolean;
  has_water?: boolean;
  has_tv?: boolean;
  has_laundry?: boolean;
  has_security_system?: boolean;
  view_count: number;
  created_at: string;
  active?: boolean;
  // Room status fields
  total_rooms?: number;
  full_rooms?: number;
  available_rooms?: number;
  total_beds?: number;
  available_beds?: number;
  occupancy_rate?: number;
}

export interface Application {
  id: string;
  property_id: string;
  tenant_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  transaction_code?: string | null;
  payment_verified?: boolean;
  property?: Property;
  tenant?: {
    full_name?: string | null
    ecocash_number?: string | null
  }
  bed?: {
    bed_number?: number | null
    room?: {
      name?: string | null
    } | null
  } | null
}

export interface SavedProperty {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  property?: Property;
}

export interface NotificationModal {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
}

export interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  icon?: string;
}

export interface ImageModal {
  isOpen: boolean;
  src: string;
  alt: string;
}

export interface ApplicationModal {
  isOpen: boolean;
  propertyId: string | null;
  beds: Bed[];
}

export type DashboardTab = 'overview' | 'browse' | 'properties' | 'applications' | 'saved' | 'account' | 'commission';

export interface RoleInfo {
  icon: string;
  color: string;
  title: string;
  description: string;
  actions: string[];
}
