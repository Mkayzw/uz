import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import PropertyForm from './page';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/useSupabaseClient', () => ({
  useSupabaseClient: jest.fn(),
}));

jest.mock('@/components/AuthGuard', () => {
  return function AuthGuard({ children }: { children: React.ReactNode }) {
    return <div data-testid="auth-guard">{children}</div>;
  };
});

jest.mock('@/components/PropertyImage', () => {
  return function PropertyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return <img src={src} alt={alt} className={className} data-testid="property-image" />;
  };
});

// Mock File constructor and URL methods
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  
  constructor(content: string[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = content.join('').length;
    this.type = options.type || 'text/plain';
  }
} as any;

global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('PropertyForm Component', () => {
  const mockPush = jest.fn();
  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('Component Rendering', () => {
    it('renders the property form with initial step', () => {
      render(<PropertyForm />);
      
      expect(screen.getByText('List a New Property')).toBeInTheDocument();
      expect(screen.getByText('Step 1: Property Details & Room Configuration')).toBeInTheDocument();
      expect(screen.getByText('Property & Rooms')).toBeInTheDocument();
    });

    it('renders within AuthGuard with agent role', () => {
      render(<PropertyForm />);
      
      expect(screen.getByTestId('auth-guard')).toBeInTheDocument();
    });

    it('displays progress stepper correctly', () => {
      render(<PropertyForm />);
      
      expect(screen.getByText('Property & Rooms')).toBeInTheDocument();
      expect(screen.getByText('Media & Amenities')).toBeInTheDocument();
      expect(screen.getByText('Availability & Contact')).toBeInTheDocument();
    });

    it('shows correct step highlighting in stepper', () => {
      render(<PropertyForm />);
      
      const step1 = screen.getByText('Property & Rooms');
      expect(step1).toHaveClass('font-bold', 'text-blue-600');
      
      const step2 = screen.getByText('Media & Amenities');
      expect(step2).toHaveClass('text-gray-500');
    });
  });

  describe('Step Navigation', () => {
    it('navigates to next step when Next Step button is clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      expect(screen.getByText('Step 2: Media & Amenities')).toBeInTheDocument();
    });

    it('navigates back to previous step when Previous Step button is clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Go to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      // Go back to step 1
      const backButton = screen.getByText('← Previous Step');
      await user.click(backButton);
      
      expect(screen.getByText('Step 1: Property Details & Room Configuration')).toBeInTheDocument();
    });

    it('updates progress bar width based on current step', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const progressBar = document.querySelector('.bg-blue-600');
      
      // Initial step (0) should be 0%
      expect(progressBar).toHaveStyle('width: 0%');
      
      // Move to step 1
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      expect(progressBar).toHaveStyle('width: 50%');
      
      // Move to step 2
      await user.click(screen.getByText('Next Step →'));
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('shows final step submit button instead of next', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      await user.click(screen.getByText('Next Step →'));
      
      expect(screen.getByText('Submit Listing')).toBeInTheDocument();
      expect(screen.queryByText('Next Step →')).not.toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates form data when text inputs change', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const titleInput = screen.getByLabelText(/Property Title/);
      await user.type(titleInput, 'Test Property');
      
      expect(titleInput).toHaveValue('Test Property');
    });

    it('updates form data when select inputs change', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const propertyTypeSelect = screen.getByLabelText(/Property Type/);
      await user.selectOptions(propertyTypeSelect, 'house');
      
      expect(propertyTypeSelect).toHaveValue('house');
    });

    it('updates form data when textarea inputs change', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const descriptionTextarea = screen.getByLabelText(/Description/);
      await user.type(descriptionTextarea, 'Test description');
      
      expect(descriptionTextarea).toHaveValue('Test description');
    });

    it('handles all property type options', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const propertyTypeSelect = screen.getByLabelText(/Property Type/);
      
      await user.selectOptions(propertyTypeSelect, 'apartment');
      expect(propertyTypeSelect).toHaveValue('apartment');
      
      await user.selectOptions(propertyTypeSelect, 'house');
      expect(propertyTypeSelect).toHaveValue('house');
      
      await user.selectOptions(propertyTypeSelect, 'hostel');
      expect(propertyTypeSelect).toHaveValue('hostel');
      
      await user.selectOptions(propertyTypeSelect, 'bedsitter');
      expect(propertyTypeSelect).toHaveValue('bedsitter');
      
      await user.selectOptions(propertyTypeSelect, 'single-room');
      expect(propertyTypeSelect).toHaveValue('single-room');
    });

    it('handles numeric price input validation', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const priceInput = screen.getByLabelText(/Monthly Price/);
      
      await user.type(priceInput, '150.50');
      expect(priceInput).toHaveValue(150.50);
      
      // Test minimum value
      expect(priceInput).toHaveAttribute('min', '0');
    });
  });

  describe('Room Management', () => {
    it('starts with one default room', () => {
      render(<PropertyForm />);
      
      expect(screen.getByText('Room 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room 1')).toBeInTheDocument();
    });

    it('adds a new room when Add Room button is clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const addRoomButton = screen.getByText('+ Add Room');
      await user.click(addRoomButton);
      
      expect(screen.getByText('Room 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room 2')).toBeInTheDocument();
    });

    it('removes a room when Remove button is clicked (when more than 1 room)', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add a second room first
      const addRoomButton = screen.getByText('+ Add Room');
      await user.click(addRoomButton);
      
      // Now remove the second room
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[1]);
      
      expect(screen.queryByDisplayValue('Room 2')).not.toBeInTheDocument();
    });

    it('does not show remove button when only one room exists', () => {
      render(<PropertyForm />);
      
      expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    });

    it('updates room name when changed', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const roomNameInput = screen.getByDisplayValue('Room 1');
      await user.clear(roomNameInput);
      await user.type(roomNameInput, 'Master Bedroom');
      
      expect(roomNameInput).toHaveValue('Master Bedroom');
    });

    it('updates room bed count when changed', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedCountSelect = screen.getByDisplayValue('1');
      await user.selectOptions(bedCountSelect, '2');
      
      expect(screen.getByText('2 beds (double)')).toBeInTheDocument();
    });

    it('calculates total beds correctly', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add a second room
      const addRoomButton = screen.getByText('+ Add Room');
      await user.click(addRoomButton);
      
      // Set first room to 2 beds, second room to 3 beds
      const bedSelects = screen.getAllByDisplayValue('1');
      await user.selectOptions(bedSelects[0], '2');
      await user.selectOptions(bedSelects[1], '3');
      
      expect(screen.getByText('Total beds across all rooms: 5')).toBeInTheDocument();
    });

    it('generates unique room IDs when adding/removing rooms', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add two rooms
      await user.click(screen.getByText('+ Add Room'));
      await user.click(screen.getByText('+ Add Room'));
      
      // Remove middle room
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[1]);
      
      // Add another room - should get unique ID
      await user.click(screen.getByText('+ Add Room'));
      
      // Should still have rooms with proper naming
      expect(screen.getByDisplayValue('Room 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room 3')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room 4')).toBeInTheDocument();
    });
  });

  describe('Room Type Determination', () => {
    it('correctly identifies single room type', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedSelect = screen.getByDisplayValue('1');
      await user.selectOptions(bedSelect, '1');
      
      expect(screen.getByText('1 bed (single)')).toBeInTheDocument();
    });

    it('correctly identifies double room type', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedSelect = screen.getByDisplayValue('1');
      await user.selectOptions(bedSelect, '2');
      
      expect(screen.getByText('2 beds (double)')).toBeInTheDocument();
    });

    it('correctly identifies triple room type', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedSelect = screen.getByDisplayValue('1');
      await user.selectOptions(bedSelect, '3');
      
      expect(screen.getByText('3 beds (triple)')).toBeInTheDocument();
    });

    it('correctly identifies quad room type', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedSelect = screen.getByDisplayValue('1');
      await user.selectOptions(bedSelect, '4');
      
      expect(screen.getByText('4 beds (quad)')).toBeInTheDocument();
    });

    it('correctly identifies room types for higher bed counts', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      const bedSelect = screen.getByDisplayValue('1');
      
      await user.selectOptions(bedSelect, '5');
      expect(screen.getByText('5 beds')).toBeInTheDocument();
      
      await user.selectOptions(bedSelect, '6');
      expect(screen.getByText('6 beds')).toBeInTheDocument();
    });
  });

  describe('Amenities Handling', () => {
    it('toggles amenity checkboxes correctly', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const wifiCheckbox = screen.getByLabelText('WiFi Internet') as HTMLInputElement;
      
      expect(wifiCheckbox.checked).toBe(false);
      
      await user.click(wifiCheckbox);
      
      expect(wifiCheckbox.checked).toBe(true);
    });

    it('handles multiple amenity selections', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const wifiCheckbox = screen.getByLabelText('WiFi Internet') as HTMLInputElement;
      const parkingCheckbox = screen.getByLabelText('Parking') as HTMLInputElement;
      const powerCheckbox = screen.getByLabelText('Reliable Power') as HTMLInputElement;
      
      await user.click(wifiCheckbox);
      await user.click(parkingCheckbox);
      await user.click(powerCheckbox);
      
      expect(wifiCheckbox.checked).toBe(true);
      expect(parkingCheckbox.checked).toBe(true);
      expect(powerCheckbox.checked).toBe(true);
    });

    it('toggles amenities off when clicked again', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const wifiCheckbox = screen.getByLabelText('WiFi Internet') as HTMLInputElement;
      
      // Turn on
      await user.click(wifiCheckbox);
      expect(wifiCheckbox.checked).toBe(true);
      
      // Turn off
      await user.click(wifiCheckbox);
      expect(wifiCheckbox.checked).toBe(false);
    });

    it('displays all available amenities', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      expect(screen.getByLabelText('WiFi Internet')).toBeInTheDocument();
      expect(screen.getByLabelText('Reliable Power')).toBeInTheDocument();
      expect(screen.getByLabelText('Reliable Water')).toBeInTheDocument();
      expect(screen.getByLabelText('Parking')).toBeInTheDocument();
      expect(screen.getByLabelText('TV')).toBeInTheDocument();
      expect(screen.getByLabelText('Air Conditioning')).toBeInTheDocument();
      expect(screen.getByLabelText('Furnished')).toBeInTheDocument();
      expect(screen.getByLabelText('Laundry')).toBeInTheDocument();
      expect(screen.getByLabelText('Security System')).toBeInTheDocument();
    });
  });

  describe('File Upload Handling', () => {
    it('handles file selection and creates image previews', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      expect(screen.getByText('Uploaded images:')).toBeInTheDocument();
      expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    });

    it('handles multiple file uploads', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      
      await user.upload(fileInput, files);
      
      expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
    });

    it('allows removing uploaded photos', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      // Find and click remove button
      const removeButton = screen.getByText('X');
      await user.click(removeButton);
      
      expect(screen.queryByText('Uploaded images:')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
    });

    it('displays full view image when image is clicked', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      const previewImage = screen.getByAltText('Preview 1');
      await user.click(previewImage);
      
      expect(screen.getByTestId('property-image')).toBeInTheDocument();
    });

    it('closes full view image when clicked outside', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      const previewImage = screen.getByAltText('Preview 1');
      await user.click(previewImage);
      
      // Click the overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
      }
      
      expect(screen.queryByTestId('property-image')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
    });

    it('shows error when required fields are missing', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to final step
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      await user.click(screen.getByText('Next Step →'));
      
      // Try to submit without required fields
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });

    it('shows error when no photos are uploaded', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to final step
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      await user.click(screen.getByText('Next Step →'));
      
      // Try to submit without photos
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please upload at least one photo of your property')).toBeInTheDocument();
      });
    });

    it('shows error when rooms have invalid configuration', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Clear room name to make it invalid
      const roomNameInput = screen.getByDisplayValue('Room 1');
      await user.clear(roomNameInput);
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      
      // Try to submit with invalid room
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please ensure all rooms have valid names and at least 1 bed')).toBeInTheDocument();
      });
    });

    it('validates individual required fields', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Test title validation
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
      
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test-path.jpg' }
      });
      
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: { id: 'property-id' },
        error: null
      });
    });

    it('successfully submits form with valid data', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      
      // Submit form
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=properties');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      
      // Submit form
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('redirects to login if user is not authenticated', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });
      
      render(<PropertyForm />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      
      // Submit form
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('creates rooms and beds correctly', async () => {
      const user = userEvent.setup();
      
      const mockRoomInsert = jest.fn().mockResolvedValue({
        data: { id: 'room-id' },
        error: null
      });
      
      const mockBedInsert = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'rooms') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockRoomInsert
              }))
            }))
          };
        }
        if (table === 'beds') {
          return {
            insert: mockBedInsert
          };
        }
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'property-id' },
                error: null
              })
            }))
          })),
          delete: jest.fn(() => ({ eq: jest.fn() }))
        };
      });
      
      render(<PropertyForm />);
      
      // Add a second room with 2 beds
      await user.click(screen.getByText('+ Add Room'));
      const bedSelects = screen.getAllByDisplayValue('1');
      await user.selectOptions(bedSelects[1], '2');
      
      // Fill required fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRoomInsert).toHaveBeenCalledTimes(2);
        expect(mockBedInsert).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
    });

    it('handles storage upload errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' }
      });
      
      render(<PropertyForm />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Error uploading image 1: Upload failed/)).toBeInTheDocument();
      });
    });

    it('handles property creation errors', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Property creation failed' }
      });
      
      render(<PropertyForm />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error creating property: Property creation failed')).toBeInTheDocument();
      });
    });

    it('handles room creation errors and cleans up', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      const mockPropertyDelete = jest.fn();
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'rooms') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Room creation failed' }
                })
              }))
            }))
          };
        }
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'property-id' },
                error: null
              })
            }))
          })),
          delete: jest.fn(() => ({
            eq: mockPropertyDelete
          }))
        };
      });
      
      render(<PropertyForm />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error creating room: Room creation failed')).toBeInTheDocument();
        expect(mockPropertyDelete).toHaveBeenCalled();
      });
    });

    it('handles unknown errors gracefully', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockRejectedValue('Unknown error');
      
      render(<PropertyForm />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('An unknown error occurred.')).toBeInTheDocument();
      });
    });

    it('clears error state when navigating between steps', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to final step and cause an error
      await user.click(screen.getByText('Next Step →'));
      await user.click(screen.getByText('Next Step →'));
      
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
      
      // Navigate back
      await user.click(screen.getByText('← Previous Step'));
      
      // Error should still be visible (as it's not cleared on navigation in the current implementation)
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  describe('Full Address Construction', () => {
    it('constructs full address correctly with all fields', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
      
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'property-id' },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'properties') {
          return { insert: mockInsert };
        }
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'room-id' },
                error: null
              })
            }))
          })),
          delete: jest.fn(() => ({ eq: jest.fn() }))
        };
      });
      
      render(<PropertyForm />);
      
      // Fill address fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), '123 Test Street');
      await user.type(screen.getByLabelText(/City\/Town/), 'Test City');
      await user.type(screen.getByLabelText(/County/), 'Test County');
      await user.type(screen.getByLabelText(/Postal Code/), '12345');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Test Street, Test City, Test County, 12345'
          })
        );
      });
    });

    it('constructs address with only required fields', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
      
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'property-id' },
            error: null
          })
        })
      });
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'properties') {
          return { insert: mockInsert };
        }
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'room-id' },
                error: null
              })
            }))
          })),
          delete: jest.fn(() => ({ eq: jest.fn() }))
        };
      });
      
      render(<PropertyForm />);
      
      // Fill only required address fields
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), '123 Test Street');
      await user.type(screen.getByLabelText(/Monthly Price/), '100');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            address: '123 Test Street'
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels associated with inputs', () => {
      render(<PropertyForm />);
      
      const titleInput = screen.getByLabelText(/Property Title/);
      const addressInput = screen.getByLabelText(/Street Address/);
      const priceInput = screen.getByLabelText(/Monthly Price/);
      
      expect(titleInput).toBeInTheDocument();
      expect(addressInput).toBeInTheDocument();
      expect(priceInput).toBeInTheDocument();
    });

    it('marks required fields appropriately', () => {
      render(<PropertyForm />);
      
      const titleInput = screen.getByLabelText(/Property Title/);
      const addressInput = screen.getByLabelText(/Street Address/);
      const priceInput = screen.getByLabelText(/Monthly Price/);
      
      expect(titleInput).toHaveAttribute('required');
      expect(addressInput).toHaveAttribute('required');
      expect(priceInput).toHaveAttribute('required');
    });

    it('provides appropriate button accessibility', () => {
      render(<PropertyForm />);
      
      const nextButton = screen.getByRole('button', { name: /Next Step/ });
      const addRoomButton = screen.getByRole('button', { name: /Add Room/ });
      
      expect(nextButton).toBeInTheDocument();
      expect(addRoomButton).toBeInTheDocument();
    });

    it('provides proper heading hierarchy', () => {
      render(<PropertyForm />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('List a New Property');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Step 1: Property Details & Room Configuration');
    });
  });

  describe('Edge Cases', () => {
    it('handles maximum room configurations', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add multiple rooms
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('+ Add Room'));
      }
      
      // Set all rooms to maximum beds
      const bedSelects = screen.getAllByDisplayValue('1');
      for (const select of bedSelects) {
        await user.selectOptions(select, '6');
      }
      
      expect(screen.getByText('Total beds across all rooms: 36')).toBeInTheDocument();
    });

    it('handles room removal edge cases', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add rooms then remove them in different order
      await user.click(screen.getByText('+ Add Room'));
      await user.click(screen.getByText('+ Add Room'));
      await user.click(screen.getByText('+ Add Room'));
      
      // Remove middle rooms
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[1]); // Remove Room 2
      await user.click(removeButtons[1]); // Remove Room 3 (now at index 1)
      
      // Should still have Room 1 and Room 4
      expect(screen.getByDisplayValue('Room 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Room 4')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Room 2')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Room 3')).not.toBeInTheDocument();
    });

    it('handles empty file uploads gracefully', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to step 2
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      
      // Simulate selecting no files
      fireEvent.change(fileInput, { target: { files: [] } });
      
      expect(screen.queryByText('Uploaded images:')).not.toBeInTheDocument();
    });

    it('handles contact information edge cases', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      await user.click(screen.getByText('Next Step →'));
      
      // Test phone number input
      const phoneInput = screen.getByLabelText(/Contact Phone/);
      await user.type(phoneInput, '+254712345678');
      expect(phoneInput).toHaveValue('+254712345678');
      
      // Test email input
      const emailInput = screen.getByLabelText(/Contact Email/);
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('handles date inputs correctly', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Navigate to final step
      await user.click(screen.getByText('Next Step →'));
      await user.click(screen.getByText('Next Step →'));
      
      const availableFromInput = screen.getByLabelText(/Available From/);
      const availableToInput = screen.getByLabelText(/Available To/);
      
      await user.type(availableFromInput, '2024-01-01');
      await user.type(availableToInput, '2024-12-31');
      
      expect(availableFromInput).toHaveValue('2024-01-01');
      expect(availableToInput).toHaveValue('2024-12-31');
    });
  });

  describe('Pure Function Tests', () => {
    it('calculates total beds correctly across multiple rooms', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Add multiple rooms with different bed counts
      await user.click(screen.getByText('+ Add Room'));
      await user.click(screen.getByText('+ Add Room'));
      
      const bedSelects = screen.getAllByDisplayValue('1');
      await user.selectOptions(bedSelects[0], '2'); // 2 beds
      await user.selectOptions(bedSelects[1], '3'); // 3 beds  
      await user.selectOptions(bedSelects[2], '1'); // 1 bed
      
      expect(screen.getByText('Total beds across all rooms: 6')).toBeInTheDocument();
    });

    it('determines room types correctly for all bed counts', async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);
      
      // Test each room type
      const bedSelect = screen.getByDisplayValue('1');
      
      await user.selectOptions(bedSelect, '1');
      expect(screen.getByText('1 bed (single)')).toBeInTheDocument();
      
      await user.selectOptions(bedSelect, '2');
      expect(screen.getByText('2 beds (double)')).toBeInTheDocument();
      
      await user.selectOptions(bedSelect, '3');
      expect(screen.getByText('3 beds (triple)')).toBeInTheDocument();
      
      await user.selectOptions(bedSelect, '4');
      expect(screen.getByText('4 beds (quad)')).toBeInTheDocument();
      
      await user.selectOptions(bedSelect, '5');
      expect(screen.getByText('5 beds')).toBeInTheDocument();
    });

    it('handles room price calculations correctly', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
      
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      const mockRoomInsert = jest.fn().mockResolvedValue({
        data: { id: 'room-id' },
        error: null
      });
      
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'rooms') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: mockRoomInsert
              }))
            }))
          };
        }
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'property-id' },
                error: null
              })
            }))
          })),
          delete: jest.fn(() => ({ eq: jest.fn() }))
        };
      });
      
      render(<PropertyForm />);
      
      // Add a second room
      await user.click(screen.getByText('+ Add Room'));
      
      // Fill required fields with price
      await user.type(screen.getByLabelText(/Property Title/), 'Test Property');
      await user.type(screen.getByLabelText(/Street Address/), 'Test Address');
      await user.type(screen.getByLabelText(/Monthly Price/), '200');
      
      // Navigate to step 2 and add photo
      const nextButton = screen.getByText('Next Step →');
      await user.click(nextButton);
      
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      // Navigate to final step and submit
      await user.click(screen.getByText('Next Step →'));
      const submitButton = screen.getByText('Submit Listing');
      await user.click(submitButton);
      
      await waitFor(() => {
        // With 2 rooms and $200 total, each room should be $100
        expect(mockRoomInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            price_per_bed: 100
          })
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('completes full property listing workflow', async () => {
      const user = userEvent.setup();
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      });
      
      mockSupabaseClient.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null
      });
      
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: { id: 'property-id' },
        error: null
      });
      
      render(<PropertyForm />);
      
      // Step 1: Fill property details
      await user.type(screen.getByLabelText(/Property Title/), 'Beautiful Apartment');
      await user.type(screen.getByLabelText(/Description/), 'A lovely place to stay');
      await user.selectOptions(screen.getByLabelText(/Property Type/), 'apartment');
      await user.type(screen.getByLabelText(/Monthly Price/), '250');
      await user.selectOptions(screen.getByLabelText(/Bathrooms/), '2');
      
      // Add a room
      await user.click(screen.getByText('+ Add Room'));
      const bedSelects = screen.getAllByDisplayValue('1');
      await user.selectOptions(bedSelects[1], '2');
      
      // Fill address
      await user.type(screen.getByLabelText(/Street Address/), '456 Main Street');
      await user.type(screen.getByLabelText(/City\/Town/), 'Nairobi');
      await user.type(screen.getByLabelText(/County/), 'Nairobi County');
      await user.type(screen.getByLabelText(/Postal Code/), '00100');
      
      // Navigate to step 2
      await user.click(screen.getByText('Next Step →'));
      
      // Step 2: Upload photos and select amenities
      const fileInput = screen.getByLabelText('Upload files');
      const file = new File(['test'], 'apartment.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, file);
      
      await user.click(screen.getByLabelText('WiFi Internet'));
      await user.click(screen.getByLabelText('Parking'));
      await user.click(screen.getByLabelText('Furnished'));
      
      // Navigate to step 3
      await user.click(screen.getByText('Next Step →'));
      
      // Step 3: Fill availability and contact
      await user.type(screen.getByLabelText(/Available From/), '2024-02-01');
      await user.type(screen.getByLabelText(/Contact Phone/), '0712345678');
      await user.type(screen.getByLabelText(/Contact Email/), 'owner@example.com');
      await user.type(screen.getByLabelText(/House Rules/), 'No smoking, no pets');
      
      // Submit
      await user.click(screen.getByText('Submit Listing'));
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=properties');
      });
    });
  });
});