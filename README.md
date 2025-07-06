# uzoca - UZ Student Housing Platform

A modern Next.js application for University of Zimbabwe students to find off-campus accommodation, built with Supabase and Tailwind CSS.

## 🚀 Features

### Phase 1 - Foundation & Authentication ✅
- **Clean Next.js Setup**: Modern React 18+ with App Router
- **Tailwind CSS**: Responsive design with dark mode support
- **Supabase Integration**: Complete backend with authentication
- **Role-Based Authentication**: Support for Tenants, Landlords, and Agents
- **Database Schema**: Tables for users, profiles, properties, and bookings
- **Row Level Security**: Secure data access policies

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with dark mode
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm
- Supabase account

## 🔧 Installation

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

## 🗄 Database Schema

The application uses these main tables:

- **profiles** - User profile data with roles (tenant, landlord, agent)
- **pads** - Property listings with amenities
- **rooms** - Individual bookable units within properties  
- **bookings** - Booking requests from tenants

## 👥 User Roles

- **Tenant**: Browse properties, apply for rooms, track applications
- **Landlord**: List properties, manage applications, view statistics
- **Agent**: Manage client properties, track commissions (requires payment)

## 🔐 Authentication

1. Sign up with role selection
2. Automatic profile creation via database trigger
3. Role-specific dashboard access
4. Row Level Security for data protection

## 🎨 Dark Mode

Full dark mode support across all pages and components using Tailwind CSS dark mode classes.

## 📝 Environment Variables

Required for `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔄 Next Steps (Phase 2)

- Property search and filtering
- Image upload for listings
- Payment processing
- Real-time messaging
- Email notifications

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
