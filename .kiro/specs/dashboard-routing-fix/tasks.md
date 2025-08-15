# Implementation Plan

- [x] 1. Fix profile loading to ensure it works reliably






  - Update the `getProfile` function in `src/lib/utils/dashboard.ts` to create profiles for new users properly
  - Ensure the function returns valid profile data or throws clear errors
  - _Requirements: 6.1, 6.2_

- [x] 2. Create simple role-based dashboard routing





  - Create `src/components/DashboardRouter.tsx` that checks user role and shows appropriate dashboard
  - Route 'tenant' users to existing DashboardContent
  - Route 'agent' users to existing DashboardContent  
  - Route 'admin' users to redirect to /admin page
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 3. Update main dashboard page to use role-based routing









  - Modify `src/app/dashboard/page.tsx` to use DashboardRouter instead of DashboardWrapper
  - Ensure the router properly loads user profile and routes based on role
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 4. Ensure middleware doesn't interfere with dashboard routing






  - Verify `src/middleware.ts` allows proper access to dashboard routes
  - Make sure session handling works correctly for dashboard access
  - _Requirements: 5.4_