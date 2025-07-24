import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardContent from './DashboardContent'

// Mock all the hooks and dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('@/hooks/useDashboardAuth', () => ({
  useDashboardAuth: jest.fn(),
}))

jest.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(),
}))

jest.mock('@/hooks/useRealTimeSubscriptions', () => ({
  useRealTimeSubscriptions: jest.fn(),
}))

jest.mock('@/hooks/useNavigationState', () => ({
  useNavigationState: jest.fn(),
  restoreNavigationState: jest.fn(),
}))

jest.mock('@/hooks/useSupabaseClient', () => ({
  useSupabaseClient: jest.fn(),
}))

jest.mock('@/app/dashboard/actions', () => ({
  updateApplicationStatus: jest.fn(),
  verifyPayment: jest.fn(),
  cancelApplication: jest.fn(),
  submitApplication: jest.fn(),
}))

// Mock all the components
jest.mock('@/components/ConfirmationModal', () => {
  return function MockConfirmationModal({ isOpen, title, onConfirm, onClose, type, confirmText, icon }: any) {
    return isOpen ? (
      <div data-testid="confirmation-modal">
        <h3>{title}</h3>
        <span data-testid="modal-type">{type}</span>
        <span data-testid="modal-icon">{icon}</span>
        <button onClick={onConfirm} data-testid="confirm-button">{confirmText || 'Confirm'}</button>
        <button onClick={onClose} data-testid="close-button">Close</button>
      </div>
    ) : null
  }
})

jest.mock('@/components/NotificationModal', () => {
  return function MockNotificationModal({ isOpen, title, message, type, icon, onClose }: any) {
    return isOpen ? (
      <div data-testid="notification-modal">
        <h3>{title}</h3>
        <p>{message}</p>
        <span data-testid="notification-type">{type}</span>
        <span data-testid="notification-icon">{icon}</span>
        <button onClick={onClose} data-testid="close-notification">Close</button>
      </div>
    ) : null
  }
})

jest.mock('@/components/ImageModal', () => {
  return function MockImageModal({ isOpen, src, alt, onClose }: any) {
    return isOpen ? (
      <div data-testid="image-modal">
        <img src={src} alt={alt} data-testid="modal-image" />
        <button onClick={onClose} data-testid="close-image">Close</button>
      </div>
    ) : null
  }
})

jest.mock('@/components/ApplicationModal', () => {
  return function MockApplicationModal({ isOpen, beds, onSubmit, onClose }: any) {
    return isOpen ? (
      <div data-testid="application-modal">
        <div data-testid="available-beds">{beds?.length} beds available</div>
        <button 
          onClick={() => onSubmit({ 
            bed_id: 'bed-1', 
            registration_number: 'REG123', 
            national_id: 'ID123',
            gender: 'male'
          })} 
          data-testid="submit-application"
        >
          Submit
        </button>
        <button 
          onClick={() => onSubmit({})} 
          data-testid="submit-invalid-application"
        >
          Submit Invalid
        </button>
        <button onClick={onClose} data-testid="close-application">Close</button>
      </div>
    ) : null
  }
})

jest.mock('@/components/dashboard/DashboardHeader', () => {
  return function MockDashboardHeader({ onSignOut }: any) {
    return (
      <header data-testid="dashboard-header">
        <button onClick={onSignOut} data-testid="sign-out">Sign Out</button>
      </header>
    )
  }
})

jest.mock('@/components/dashboard/DashboardTabs', () => {
  return function MockDashboardTabs({ activeTab, setActiveTab, profile }: any) {
    return (
      <div data-testid="dashboard-tabs">
        <span data-testid="active-tab">{activeTab}</span>
        <button onClick={() => setActiveTab('overview')} data-testid="tab-overview">Overview</button>
        <button onClick={() => setActiveTab('browse')} data-testid="tab-browse">Browse</button>
        <button onClick={() => setActiveTab('applications')} data-testid="tab-applications">Applications</button>
        {profile?.role === 'tenant' && (
          <button onClick={() => setActiveTab('saved')} data-testid="tab-saved">Saved</button>
        )}
        {profile?.role === 'agent' && profile?.agent_status === 'active' && (
          <>
            <button onClick={() => setActiveTab('properties')} data-testid="tab-properties">Properties</button>
            <button onClick={() => setActiveTab('commission')} data-testid="tab-commission">Commission</button>
          </>
        )}
        <button onClick={() => setActiveTab('account')} data-testid="tab-account">Account</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/DashboardOverview', () => {
  return function MockDashboardOverview({ onBrowseProperties, profile, properties, agentApplications }: any) {
    return (
      <div data-testid="dashboard-overview">
        <div data-testid="profile-role">{profile?.role}</div>
        <div data-testid="properties-count">{properties?.length || 0}</div>
        <div data-testid="applications-count">{agentApplications?.length || 0}</div>
        <button onClick={onBrowseProperties} data-testid="browse-properties">Browse Properties</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/PropertiesBrowser', () => {
  return function MockPropertiesBrowser({ 
    allProperties,
    applications,
    savedProperties,
    profile,
    onApplyToProperty, 
    onSaveProperty, 
    onUnsaveProperty, 
    onCancelApplication,
    onImageClick 
  }: any) {
    return (
      <div data-testid="properties-browser">
        <div data-testid="all-properties-count">{allProperties?.length || 0}</div>
        <div data-testid="user-applications-count">{applications?.length || 0}</div>
        <div data-testid="saved-properties-count">{savedProperties?.length || 0}</div>
        <button onClick={() => onApplyToProperty('prop-1')} data-testid="apply-property">Apply</button>
        <button onClick={() => onSaveProperty('prop-1')} data-testid="save-property">Save</button>
        <button onClick={() => onUnsaveProperty('prop-1')} data-testid="unsave-property">Unsave</button>
        <button onClick={() => onCancelApplication('app-1')} data-testid="cancel-application">Cancel</button>
        <button onClick={() => onImageClick('image.jpg', 'Test image')} data-testid="open-image">View Image</button>
        <button onClick={() => onImageClick(null, 'No image')} data-testid="open-null-image">View Null Image</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/AgentProperties', () => {
  return function MockAgentProperties({ properties, onImageClick }: any) {
    return (
      <div data-testid="agent-properties">
        <div data-testid="agent-properties-count">{properties?.length || 0}</div>
        <button onClick={() => onImageClick('agent-image.jpg', 'Agent property')} data-testid="agent-image">View Image</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/DashboardApplications', () => {
  return function MockDashboardApplications({ 
    profile,
    applications,
    agentApplications,
    onApproveApplication, 
    onRejectApplication, 
    onVerifyPayment 
  }: any) {
    return (
      <div data-testid="dashboard-applications">
        <div data-testid="profile-role">{profile?.role}</div>
        <div data-testid="tenant-applications-count">{applications?.length || 0}</div>
        <div data-testid="agent-applications-count">{agentApplications?.length || 0}</div>
        <button onClick={() => onApproveApplication('app-1')} data-testid="approve-application">Approve</button>
        <button onClick={() => onRejectApplication('app-1')} data-testid="reject-application">Reject</button>
        <button onClick={() => onVerifyPayment('app-1')} data-testid="verify-payment">Verify Payment</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/SavedProperties', () => {
  return function MockSavedProperties({ 
    savedProperties,
    applications,
    onApplyToProperty, 
    onUnsaveProperty, 
    onCancelApplication,
    onImageClick,
    setActiveTab 
  }: any) {
    return (
      <div data-testid="saved-properties">
        <div data-testid="saved-count">{savedProperties?.length || 0}</div>
        <button onClick={() => onApplyToProperty('saved-prop-1')} data-testid="apply-saved-property">Apply</button>
        <button onClick={() => onUnsaveProperty('saved-prop-1')} data-testid="unsave-saved-property">Unsave</button>
        <button onClick={() => onCancelApplication('saved-app-1')} data-testid="cancel-saved-application">Cancel</button>
        <button onClick={() => onImageClick('saved-image.jpg', 'Saved property')} data-testid="saved-image">View Image</button>
        <button onClick={() => setActiveTab('browse')} data-testid="browse-from-saved">Browse</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/DashboardAccount', () => {
  return function MockDashboardAccount({ user, profile, onSignOut, onUpdateEcocash }: any) {
    return (
      <div data-testid="dashboard-account">
        <div data-testid="user-id">{user?.id}</div>
        <div data-testid="profile-id">{profile?.id}</div>
        <button onClick={onSignOut} data-testid="account-sign-out">Sign Out</button>
        <button onClick={() => onUpdateEcocash('0771234567')} data-testid="update-ecocash">Update EcoCash</button>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/CommissionTracking', () => {
  return function MockCommissionTracking({ agentApplications }: any) {
    return (
      <div data-testid="commission-tracking">
        <div data-testid="commission-applications-count">{agentApplications?.length || 0}</div>
        Commission Tracking
      </div>
    )
  }
})

jest.mock('@/components/ToastManager', () => {
  return function MockToastManager() {
    return <div data-testid="toast-manager">Toast Manager</div>
  }
})

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockSearchParams = {
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
}

// Import the mocked hooks
const { useDashboardAuth } = require('@/hooks/useDashboardAuth')
const { useDashboardData } = require('@/hooks/useDashboardData')
const { useRealTimeSubscriptions } = require('@/hooks/useRealTimeSubscriptions')
const { useNavigationState } = require('@/hooks/useNavigationState')
const { useSupabaseClient } = require('@/hooks/useSupabaseClient')
const { 
  updateApplicationStatus, 
  verifyPayment, 
  cancelApplication, 
  submitApplication 
} = require('@/app/dashboard/actions')

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: { id: 'saved-1' }, error: null }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        in: jest.fn(() => Promise.resolve({ data: [{ id: 'bed-1', bed_number: 1, room_id: 'room-1' }], error: null }))
      })),
      in: jest.fn(() => Promise.resolve({ data: [{ id: 'room-1' }], error: null }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

describe('DashboardContent Component', () => {
  const defaultAuthState = {
    user: { id: 'user-1', email: 'test@example.com' },
    profile: { id: 'profile-1', role: 'tenant', agent_status: null },
    loading: false,
    error: null,
    displayName: 'Test User',
    handleSignOut: jest.fn(),
  }

  const defaultDataState = {
    properties: [{ id: 'prop-1', title: 'Agent Property 1' }],
    allProperties: [
      { id: 'prop-1', title: 'Test Property 1' },
      { id: 'prop-2', title: 'Test Property 2' }
    ],
    applications: [{ id: 'app-1', bed_id: 'bed-1', property: { title: 'Applied Property' } }],
    agentApplications: [{ id: 'agent-app-1', status: 'pending' }],
    savedProperties: [{ id: 'saved-1', property: { id: 'prop-1', title: 'Saved Property' } }],
    loading: false,
    error: null,
    refreshData: jest.fn(),
    setProperties: jest.fn(),
    setAllProperties: jest.fn(),
    setApplications: jest.fn(),
    setAgentApplications: jest.fn(),
    setSavedProperties: jest.fn(),
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default mock implementations
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    
    useDashboardAuth.mockReturnValue(defaultAuthState)
    useDashboardData.mockReturnValue(defaultDataState)
    useRealTimeSubscriptions.mockReturnValue({})
    useNavigationState.mockReturnValue({
      navigateWithHistory: jest.fn(),
      isBackNavigation: false,
    })
    useSupabaseClient.mockReturnValue(mockSupabase)
    
    mockSearchParams.get.mockReturnValue(null)
    
    // Mock window properties
    Object.defineProperty(window, 'location', {
      value: { 
        href: 'http://localhost:3000/dashboard', 
        origin: 'http://localhost:3000',
        reload: jest.fn()
      },
      writable: true,
    })
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
    
    Object.defineProperty(window, 'history', {
      value: { replaceState: jest.fn() },
      writable: true,
    })
  })

  describe('Loading States', () => {
    it('renders loading state when authentication is loading', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        loading: true,
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('renders loading state when data is loading', () => {
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        loading: true,
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()
    })

    it('prioritizes auth loading over data loading', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        loading: true,
      })
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        loading: false,
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('renders error state when authentication fails', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Authentication failed',
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('renders error state when data loading fails', () => {
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        error: 'Failed to load data',
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })

    it('prioritizes auth error over data error', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Auth error',
      })
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        error: 'Data error',
      })

      render(<DashboardContent />)
      
      expect(screen.getByText('Auth error')).toBeInTheDocument()
      expect(screen.queryByText('Data error')).not.toBeInTheDocument()
    })

    it('allows retry when error occurs', () => {
      const reloadSpy = jest.fn()
      Object.defineProperty(window.location, 'reload', { value: reloadSpy })
      
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        error: 'Authentication failed',
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
      expect(reloadSpy).toHaveBeenCalled()
    })
  })

  describe('Main Dashboard Rendering', () => {
    it('renders dashboard header and welcome message', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
      expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
      expect(screen.getByText("Here's your personalized dashboard for UniStay.")).toBeInTheDocument()
    })

    it('renders dashboard tabs with correct profile data', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument()
      expect(screen.getByTestId('active-tab')).toHaveTextContent('overview')
    })

    it('renders overview tab by default', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      expect(screen.getByTestId('profile-role')).toHaveTextContent('tenant')
    })

    it('renders toast manager', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('toast-manager')).toBeInTheDocument()
    })

    it('passes correct data to components', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('properties-count')).toHaveTextContent('1')
      expect(screen.getByTestId('applications-count')).toHaveTextContent('1')
    })
  })

  describe('Tab Navigation and URL State Management', () => {
    it('initializes active tab from URL search params', () => {
      mockSearchParams.get.mockReturnValue('browse')
      
      render(<DashboardContent />)
      
      expect(screen.getByTestId('active-tab')).toHaveTextContent('browse')
      expect(screen.getByTestId('properties-browser')).toBeInTheDocument()
    })

    it('updates tab when URL search params change', () => {
      mockSearchParams.get.mockReturnValue(null)
      
      const { rerender } = render(<DashboardContent />)
      
      expect(screen.getByTestId('active-tab')).toHaveTextContent('overview')
      
      mockSearchParams.get.mockReturnValue('applications')
      rerender(<DashboardContent />)
      
      expect(screen.getByTestId('active-tab')).toHaveTextContent('applications')
    })

    it('switches tabs when tab navigation is clicked', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await waitFor(() => {
        expect(screen.getByTestId('properties-browser')).toBeInTheDocument()
        expect(screen.getByTestId('all-properties-count')).toHaveTextContent('2')
      })
    })

    it('shows tenant-specific tabs for tenant users', () => {
      render(<DashboardContent />)
      
      expect(screen.getByTestId('tab-saved')).toBeInTheDocument()
      expect(screen.queryByTestId('tab-properties')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tab-commission')).not.toBeInTheDocument()
    })

    it('shows agent-specific tabs for active agents', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: { id: 'profile-1', role: 'agent', agent_status: 'active' },
      })

      render(<DashboardContent />)
      
      expect(screen.getByTestId('tab-properties')).toBeInTheDocument()
      expect(screen.getByTestId('tab-commission')).toBeInTheDocument()
      expect(screen.queryByTestId('tab-saved')).not.toBeInTheDocument()
    })

    it('does not show agent tabs for inactive agents', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: { id: 'profile-1', role: 'agent', agent_status: 'pending' },
      })

      render(<DashboardContent />)
      
      expect(screen.queryByTestId('tab-properties')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tab-commission')).not.toBeInTheDocument()
    })

    it('handles browse properties action from overview', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('browse-properties'))
      
      await waitFor(() => {
        expect(screen.getByTestId('properties-browser')).toBeInTheDocument()
      })
    })
  })

  describe('Property Management Actions', () => {
    it('handles save property successfully', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('save-property'))
      })
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('saved_properties')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Property Saved')).toBeInTheDocument()
        expect(screen.getByTestId('notification-type')).toHaveTextContent('success')
        expect(screen.getByTestId('notification-icon')).toHaveTextContent('💾')
      })
    })

    it('handles save property error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Save failed' } }))
          }))
        }))
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('save-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Save Failed')).toBeInTheDocument()
        expect(screen.getByTestId('notification-type')).toHaveTextContent('error')
      })
    })

    it('handles unsave property with confirmation flow', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('unsave-property'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        expect(screen.getByText('Remove from Saved')).toBeInTheDocument()
        expect(screen.getByTestId('modal-type')).toHaveTextContent('warning')
        expect(screen.getByTestId('modal-icon')).toHaveTextContent('🗑️')
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('saved_properties')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Property Removed')).toBeInTheDocument()
      })
    })

    it('handles unsave property error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: { message: 'Delete failed' } }))
          }))
        }))
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('unsave-property'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Remove Failed')).toBeInTheDocument()
      })
    })

    it('handles apply to property flow', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
        expect(screen.getByTestId('available-beds')).toHaveTextContent('1 beds available')
      })
    })

    it('prevents duplicate application from local state', async () => {
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        applications: [{ id: 'app-1', bed_id: 'prop-1' }],
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Already Applied')).toBeInTheDocument()
        expect(screen.getByTestId('notification-type')).toHaveTextContent('warning')
        expect(screen.getByTestId('notification-icon')).toHaveTextContent('⚠️')
      })
    })

    it('prevents duplicate application from database check', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: { id: 'existing-app' }, error: null }))
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Already Applied')).toBeInTheDocument()
      })
    })

    it('handles bed fetching error during application', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'applications') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn(() => Promise.resolve({ data: null, error: null }))
                }))
              }))
            }))
          }
        }
        if (table === 'beds') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Beds fetch failed' } }))
              }))
            }))
          }
        }
        if (table === 'rooms') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [{ id: 'room-1' }], error: null }))
            }))
          }
        }
        return mockSupabase.from()
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Could not fetch available beds.')).toBeInTheDocument()
      })
    })

    it('skips application without user', async () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        user: null,
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('apply-property'))
      
      // Should not proceed with application flow
      expect(screen.queryByTestId('application-modal')).not.toBeInTheDocument()
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('Application Management Actions', () => {
    it('handles application approval with success', async () => {
      updateApplicationStatus.mockResolvedValue({ error: null })
      const mockRefreshData = jest.fn()
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        refreshData: mockRefreshData,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-applications'))
      fireEvent.click(screen.getByTestId('approve-application'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        expect(screen.getByText('Approve Application')).toBeInTheDocument()
        expect(screen.getByTestId('modal-type')).toHaveTextContent('success')
        expect(screen.getByTestId('modal-icon')).toHaveTextContent('✅')
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'approved')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Application Approved! 🎉')).toBeInTheDocument()
        expect(mockRefreshData).toHaveBeenCalled()
      })
    })

    it('handles application approval with error', async () => {
      updateApplicationStatus.mockResolvedValue({ error: 'Approval failed' })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-applications'))
      fireEvent.click(screen.getByTestId('approve-application'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Approval failed')).toBeInTheDocument()
      })
    })

    it('handles application rejection', async () => {
      updateApplicationStatus.mockResolvedValue({ error: null })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-applications'))  
      fireEvent.click(screen.getByTestId('reject-application'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        expect(screen.getByText('Reject Application')).toBeInTheDocument()
        expect(screen.getByTestId('modal-type')).toHaveTextContent('danger')
        expect(screen.getByTestId('modal-icon')).toHaveTextContent('🚫')
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'rejected')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Success')).toBeInTheDocument()
      })
    })

    it('handles payment verification with delayed refresh', async () => {
      verifyPayment.mockResolvedValue({ error: null })
      const mockRefreshData = jest.fn()
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        refreshData: mockRefreshData,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-applications'))
      fireEvent.click(screen.getByTestId('verify-payment'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        expect(screen.getByText('Verify Payment')).toBeInTheDocument()
        expect(screen.getByTestId('modal-icon')).toHaveTextContent('💰')
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(verifyPayment).toHaveBeenCalledWith('app-1')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Payment Verified')).toBeInTheDocument()
      })
      
      // Wait for the timeout to trigger refresh
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      expect(mockRefreshData).toHaveBeenCalled()
    })

    it('handles application cancellation', async () => {
      cancelApplication.mockResolvedValue({ error: null })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('cancel-application'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        expect(screen.getByText('Cancel Application')).toBeInTheDocument()
        expect(screen.getByTestId('modal-type')).toHaveTextContent('danger')
        expect(screen.getByTestId('modal-icon')).toHaveTextContent('🚫')
      })
      
      fireEvent.click(screen.getByTestId('confirm-button'))
      
      await waitFor(() => {
        expect(cancelApplication).toHaveBeenCalledWith('app-1')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Success')).toBeInTheDocument()
      })
    })

    it('handles application submission successfully', async () => {
      submitApplication.mockResolvedValue({ error: null })
      const mockRefreshData = jest.fn()
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        refreshData: mockRefreshData,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('submit-application'))
      
      await waitFor(() => {
        expect(submitApplication).toHaveBeenCalledWith('bed-1', 'REG123', 'ID123', 'male')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Success')).toBeInTheDocument()
        expect(mockRefreshData).toHaveBeenCalled()
      })
      
      // Should close modal after successful submission
      expect(screen.queryByTestId('application-modal')).not.toBeInTheDocument()
    })

    it('handles application submission error', async () => {
      submitApplication.mockResolvedValue({ error: 'Submission failed' })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('submit-application'))
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Submission failed')).toBeInTheDocument()
      })
    })

    it('skips application submission without bed_id', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })
      
      // Click the invalid submission button (no bed_id)
      fireEvent.click(screen.getByTestId('submit-invalid-application'))
      
      // Should not call submitApplication
      expect(submitApplication).not.toHaveBeenCalled()
    })
  })

  describe('Modal Management', () => {
    it('opens and closes image modal correctly', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('open-image'))
      
      await waitFor(() => {
        expect(screen.getByTestId('image-modal')).toBeInTheDocument()
        expect(screen.getByTestId('modal-image')).toHaveAttribute('src', 'image.jpg')
        expect(screen.getByTestId('modal-image')).toHaveAttribute('alt', 'Test image')
      })
      
      fireEvent.click(screen.getByTestId('close-image'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument()
      })
    })

    it('does not open image modal with null src', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('open-null-image'))
      
      // Should not open modal for null src
      await waitFor(() => {
        expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument()
      })
    })

    it('closes notification modal', async () => {
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        applications: [{ id: 'app-1', bed_id: 'prop-1' }],
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('close-notification'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('notification-modal')).not.toBeInTheDocument()
      })
    })

    it('closes confirmation modal', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('unsave-property'))
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('close-button'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument()
      })
    })

    it('closes application modal', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      await act(async () => {
        fireEvent.click(screen.getByTestId('apply-property'))
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('close-application'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('application-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Account Management', () => {
    it('handles sign out from header', () => {
      const mockHandleSignOut = jest.fn()
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        handleSignOut: mockHandleSignOut,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('sign-out'))
      
      expect(mockHandleSignOut).toHaveBeenCalled()
    })

    it('handles sign out from account tab', async () => {
      const mockHandleSignOut = jest.fn()
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        handleSignOut: mockHandleSignOut,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-account'))
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-account')).toBeInTheDocument()
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-1')
        expect(screen.getByTestId('profile-id')).toHaveTextContent('profile-1')
      })
      
      fireEvent.click(screen.getByTestId('account-sign-out'))
      
      expect(mockHandleSignOut).toHaveBeenCalled()
    })

    it('handles EcoCash number update successfully', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-account'))
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-account')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('update-ecocash'))
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Success!')).toBeInTheDocument()
      })
    })

    it('handles EcoCash update error', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: { message: 'Update failed' } }))
        }))
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-account'))
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-account')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('update-ecocash'))
      
      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
        expect(screen.getByText('Failed to update your EcoCash number. Please try again.')).toBeInTheDocument()
      })
    })

    it('skips EcoCash update without user or profile', async () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        user: null,
        profile: null,
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-account'))
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-account')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('update-ecocash'))
      
      // Should not make supabase call
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('URL Parameter Handling and Auto-Application', () => {
    it('handles apply parameter for tenant users', async () => {
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'apply') return 'prop-1'
        return null
      })
      
      render(<DashboardContent />)
      
      // Wait for the timeout in useEffect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('applications')
      })
    })

    it('handles apply parameter from stored redirect', async () => {
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>
      mockLocalStorage.getItem.mockReturnValue('http://localhost:3000/dashboard?apply=prop-2')
      
      render(<DashboardContent />)
      
      // Wait for the timeout in useEffect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('redirect_after_auth')
    })

    it('ignores apply parameter for non-tenant users', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: { id: 'profile-1', role: 'agent', agent_status: 'active' },
      })
      
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'apply') return 'prop-1'
        return null
      })
      
      render(<DashboardContent />)
      
      // Should not trigger application flow for agents
      expect(screen.queryByTestId('application-modal')).not.toBeInTheDocument()
    })

    it('clears apply parameter from URL after processing', async () => {
      const mockReplaceState = jest.fn()
      Object.defineProperty(window, 'history', {
        value: { replaceState: mockReplaceState },
        writable: true,
      })
      
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'apply') return 'prop-1'
        return null
      })
      
      render(<DashboardContent />)
      
      // Wait for the timeout in useEffect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      expect(mockReplaceState).toHaveBeenCalled()
    })

    it('handles missing user or profile during auto-application', async () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        user: null,
        profile: null,
      })
      
      mockSearchParams.get.mockImplementation((param) => {
        if (param === 'apply') return 'prop-1'
        return null
      })
      
      render(<DashboardContent />)
      
      // Wait for the timeout in useEffect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      // Should not proceed with auto-application
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('handles server-side rendering gracefully', () => {
      // Mock window as undefined to simulate SSR
      const originalWindow = global.window
      delete (global as any).window
      
      expect(() => render(<DashboardContent />)).not.toThrow()
      
      // Restore window
      global.window = originalWindow
    })
  })

  describe('Role-based Component Rendering', () => {
    it('renders agent properties tab for active agents', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: { id: 'profile-1', role: 'agent', agent_status: 'active' },
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-properties'))
      
      expect(screen.getByTestId('agent-properties')).toBeInTheDocument()
      expect(screen.getByTestId('agent-properties-count')).toHaveTextContent('1')
    })

    it('renders commission tracking for active agents', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: { id: 'profile-1', role: 'agent', agent_status: 'active' },
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-commission'))
      
      expect(screen.getByTestId('commission-tracking')).toBeInTheDocument()
      expect(screen.getByTestId('commission-applications-count')).toHaveTextContent('1')
    })

    it('renders saved properties for tenants', () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-saved'))
      
      expect(screen.getByTestId('saved-properties')).toBeInTheDocument()
      expect(screen.getByTestId('saved-count')).toHaveTextContent('1')
    })

    it('renders applications tab with correct data for each role', () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-applications'))
      
      expect(screen.getByTestId('dashboard-applications')).toBeInTheDocument()
      expect(screen.getByTestId('profile-role')).toHaveTextContent('tenant')
      expect(screen.getByTestId('tenant-applications-count')).toHaveTextContent('1')
      expect(screen.getByTestId('agent-applications-count')).toHaveTextContent('1')
    })

    it('passes correct data to each component', () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      expect(screen.getByTestId('all-properties-count')).toHaveTextContent('2')
      expect(screen.getByTestId('user-applications-count')).toHaveTextContent('1')
      expect(screen.getByTestId('saved-properties-count')).toHaveTextContent('1')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles missing user gracefully in property actions', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        user: null,
      })

      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      fireEvent.click(screen.getByTestId('save-property'))
      
      // Should not make any supabase calls without user
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('handles missing profile gracefully', () => {
      useDashboardAuth.mockReturnValue({
        ...defaultAuthState,
        profile: null,
      })

      render(<DashboardContent />)
      
      // Should still render basic dashboard
      expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument()
    })

    it('handles empty data arrays gracefully', () => {
      useDashboardData.mockReturnValue({
        ...defaultDataState,
        properties: [],
        allProperties: [],
        applications: [],
        agentApplications: [],
        savedProperties: [],
      })

      render(<DashboardContent />)
      
      expect(screen.getByTestId('properties-count')).toHaveTextContent('0')
      expect(screen.getByTestId('applications-count')).toHaveTextContent('0')
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      expect(screen.getByTestId('all-properties-count')).toHaveTextContent('0')
    })

    it('handles network errors during data operations', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error')
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-browse'))
      
      // Should handle the error gracefully without crashing
      expect(() => fireEvent.click(screen.getByTestId('save-property'))).not.toThrow()
    })

    it('handles component interactions from saved properties tab', async () => {
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-saved'))
      
      await waitFor(() => {
        expect(screen.getByTestId('saved-properties')).toBeInTheDocument()
      })
      
      // Test navigation back to browse from saved
      fireEvent.click(screen.getByTestId('browse-from-saved'))
      
      await waitFor(() => {
        expect(screen.getByTestId('properties-browser')).toBeInTheDocument()
      })
    })

    it('maintains state consistency across tab switches', async () => {
      render(<DashboardContent />)
      
      // Start in overview
      expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      
      // Switch to browse
      fireEvent.click(screen.getByTestId('tab-browse'))
      await waitFor(() => {
        expect(screen.getByTestId('properties-browser')).toBeInTheDocument()
      })
      
      // Switch to applications
      fireEvent.click(screen.getByTestId('tab-applications'))
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-applications')).toBeInTheDocument()
      })
      
      // Switch back to overview
      fireEvent.click(screen.getByTestId('tab-overview'))
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-overview')).toBeInTheDocument()
      })
    })

    it('handles console.error calls during EcoCash update errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => {
            throw new Error('Database error')
          })
        }))
      })
      
      render(<DashboardContent />)
      
      fireEvent.click(screen.getByTestId('tab-account'))
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-account')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('update-ecocash'))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating EcoCash number:', expect.any(Error))
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Error')).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Real-time Subscriptions Integration', () => {
    it('sets up real-time subscriptions with correct parameters', () => {
      render(<DashboardContent />)
      
      expect(useRealTimeSubscriptions).toHaveBeenCalledWith({
        user: defaultAuthState.user,
        profile: defaultAuthState.profile,
        setProfile: expect.any(Function),
        setProperties: defaultDataState.setProperties,
        setAllProperties: defaultDataState.setAllProperties,
        setApplications: defaultDataState.setApplications,
        setAgentApplications: defaultDataState.setAgentApplications,
        setSavedProperties: defaultDataState.setSavedProperties,
      })
    })

    it('provides empty setProfile function for real-time subscriptions', () => {
      render(<DashboardContent />)
      
      const callArgs = (useRealTimeSubscriptions as jest.Mock).mock.calls[0][0]
      
      // Should not throw when called
      expect(() => callArgs.setProfile()).not.toThrow()
    })
  })
})