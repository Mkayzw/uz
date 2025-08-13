export interface Bed {
  id: string
  bed_number: number
  room_id: string
  is_occupied: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent' | 'admin'
  phone_number?: string | null
  agent_status: 'not_applicable' | 'pending_payment' | 'pending_verification' | 'active'
  is_verified_agent: boolean
  ecocash_number?: string | null
  registration_number?: string | null
  national_id?: string | null
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string;
  title: string;
  description?: string | null;
  address?: string | null; // From database schema
  location?: string | null; // For backward compatibility
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  price?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  image_url?: string | null;
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
  owner_id?: string | null; // From database schema
  created_by?: string | null;
  owner?: UserProfile; // Agent details from owner_id
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
  bed_id: string;
  tenant_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string | null;
  transaction_code?: string | null;
  payment_verified?: boolean;
  created_at: string;
  updated_at: string;
  property?: Property;
  tenant?: {
    id?: string;
    full_name?: string | null
    ecocash_number?: string | null
    registration_number?: string | null
    national_id?: string | null
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  }
  bed?: {
    id?: string;
    bed_number?: number | null
    room?: {
      id?: string;
      name?: string | null
      room_type?: 'single' | 'double' | 'triple' | 'quad'
      price_per_bed?: number
      property?: Property
    } | null
  } | null
}

export interface SavedProperty {
  id: string;
  bed_id: string;
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
  allImages?: string[];
  initialIndex?: number;
}

export interface ApplicationModal {
  isOpen: boolean;
  bedId: string | null;
  propertyTitle?: string | null;
  roomName?: string | null;
  bedNumber?: number | null;
  pricePerBed?: number | null;
}

export type DashboardTab = 'overview' | 'browse' | 'properties' | 'applications' | 'saved' | 'account' | 'commission' | 'receipts' | 'messages';

export interface RoleInfo {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  actions: string[];
}
