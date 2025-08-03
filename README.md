# OffCampus - Student Housing Platform

A modern Next.js application for students to find off-campus accommodation, built with Supabase and Tailwind CSS.

## Features

### ✅ Completed Features
- **Clean Next.js Setup**: Modern React 18+ with App Router
- **Tailwind CSS**: Responsive design with dark mode support
- **Supabase Integration**: Complete backend with authentication
- **Role-Based Authentication**: Support for Tenants and Agents
- **Database Schema**: Comprehensive tables for users, profiles, properties, rooms, beds, and bookings
- **Row Level Security**: Secure data access policies with comprehensive RLS
- **Property Management**: Full CRUD operations for property listings
- **Room & Bed Management**: Individual bookable units with bed-level tracking
- **Image Upload**: Property images with Supabase Storage integration
- **Advanced Search & Filtering**: Property search with multiple filters
- **Application System**: End-to-end application workflow
- **Payment Processing**: Integrated payment verification system
- **Real-time Notifications**: Status updates for applications
- **Dashboard Views**: Separate dashboards for tenants and agents
- **Email Notifications**: Automated email receipts and notifications
- **Occupancy Tracking**: Real-time room and bed occupancy status
- **Amenities Management**: Comprehensive property amenities system

### 🎯 Advanced Features Implemented
- **Multi-level Property Structure**: Properties → Rooms → Beds hierarchy
- **Dynamic Pricing**: Per-room and per-bed pricing
- **Availability Calendar**: Real-time availability tracking
- **Application Status Tracking**: Complete workflow from pending to approved/rejected
- **Payment Verification**: Transaction code verification system
- **Agent Commission Tracking**: Commission calculation and tracking
- **Tenant Profile Management**: Detailed tenant information and preferences
- **Saved Properties**: Bookmark favorite properties
- **Advanced Search**: Filter by price, location, amenities, availability
- **Responsive Design**: Mobile-first design with full dark mode support

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time subscriptions)
- **Database**: PostgreSQL with comprehensive schema and RLS policies
- **Storage**: Supabase Storage for property images
- **Package Manager**: pnpm
- **Email**: Integrated email notifications

## Prerequisites

- Node.js 18+ 
- pnpm
- Supabase account

## Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses a comprehensive schema with these main tables:

- **profiles** - User profile data with roles (tenant, agent)
- **pads** - Property listings with full details and amenities
- **rooms** - Individual rooms within properties
- **beds** - Individual beds within rooms for granular booking
- **applications** - Booking applications with full workflow
- **saved_properties** - User bookmarked properties
- **amenities** - Property amenities and features

### Key Database Features
- **Comprehensive RLS Policies**: Row-level security for all user types
- **Database Functions**: Advanced SQL functions for occupancy tracking
- **Triggers & Constraints**: Automated data integrity and business logic
- **Views**: Optimized queries for dashboard and reporting

## User Roles

- **Tenant**: Browse properties, apply for rooms/beds, track applications, make payments, save favorites
- **Agent**: Manage client properties, track applications, verify payments, view commissions

## Authentication

1. Sign up with role selection (tenant/agent)
2. Automatic profile creation via database triggers
3. Role-specific dashboard access
4. Comprehensive Row Level Security for data protection
5. Secure session management with Supabase Auth

## Payment System

- **Payment Integration**: Transaction-based payment verification
- **Payment Tracking**: Real-time payment status updates
- **Automated Receipts**: Email notifications for successful payments
- **Commission Tracking**: Automatic agent commission calculations

## Dark Mode

Full dark mode support across all pages and components using Tailwind CSS dark mode classes with system preference detection.

## Environment Variables

Required for `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

The application is ready for production deployment. The easiest way to deploy is using Vercel:

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables
4. Deploy!

## Project Status

🎉 **Production Ready** - All planned features have been successfully implemented and tested. The platform is ready for off-campus student housing management with comprehensive property management, booking system, and payment processing.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - backend services and database
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - styling and responsive design

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
