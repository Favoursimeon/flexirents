# FlexiSpace - Site Map

## Visual Site Structure

```
FlexiSpace Platform
│
├── 🏠 HOME (/)
│   ├── Hero Carousel (Properties)
│   ├── Quick Actions
│   ├── Featured Properties
│   ├── Service Providers
│   └── Vendors
│
├── 🔐 AUTHENTICATION (/auth)
│   ├── Login
│   ├── Sign Up
│   └── Password Recovery
│
├── 🏘️ PROPERTIES
│   ├── Rentals (/rentals)
│   │   ├── Browse Rentals
│   │   ├── Filter (Region, Price, Bedrooms, Bathrooms)
│   │   └── Property Details (/property/:id)
│   │       ├── Image Gallery
│   │       ├── Details & Features
│   │       ├── Location Map
│   │       ├── Contact Owner
│   │       └── Add to Wishlist
│   │
│   ├── Sales (/sales)
│   │   ├── Browse Properties for Sale
│   │   ├── Filter (Region, Price, Property Type)
│   │   └── Property Details (/property/:id)
│   │
│   └── List Property (/list-property) 🔒
│       ├── Property Information
│       ├── Upload Images
│       ├── Set Price
│       ├── Add Features
│       └── Submit for Approval
│
├── 🛠️ SERVICES
│   ├── Browse Service Providers
│   ├── Filter by Category
│   ├── Provider Profile (/service-provider/:id)
│   │   ├── Portfolio Gallery
│   │   ├── Hourly Rate
│   │   ├── Availability Calendar
│   │   ├── Reviews & Rating
│   │   └── Book Now
│   │
│   ├── Service Provider Registration (/service-provider-registration)
│   │   ├── Business Information
│   │   ├── Service Categories
│   │   ├── Pricing & Experience
│   │   ├── Certifications
│   │   └── Submit Application
│   │
│   └── Service Provider Dashboard (/service-provider-dashboard) 🔒
│       ├── Overview Stats
│       ├── Bookings
│       ├── Booking Requests
│       ├── Availability Calendar
│       ├── Portfolio Management
│       ├── Reviews
│       └── Profile Settings
│
├── 🏪 MARKETPLACE (/marketplace)
│   ├── Browse Products
│   ├── Filter by Category
│   ├── Vendor Profile (/vendor/:id)
│   │   ├── Products
│   │   ├── About Business
│   │   ├── Reviews
│   │   └── Contact
│   │
│   ├── Vendor Registration (/vendor-registration)
│   │   ├── Business Details
│   │   ├── Category Selection
│   │   ├── Location & Contact
│   │   └── Submit Application
│   │
│   └── Vendor Dashboard (/vendor-dashboard) 🔒
│       ├── Overview Stats
│       ├── Product Management
│       ├── Add New Product
│       ├── Orders
│       ├── Reviews
│       └── Profile Settings
│
├── 👤 USER ACCOUNT 🔒
│   ├── Client Profile (/client-profile)
│   │   ├── Dashboard
│   │   │   ├── Verification Status
│   │   │   ├── Property Alerts
│   │   │   ├── Wishlist Items
│   │   │   ├── Active Leases
│   │   │   ├── Pending Payments
│   │   │   └── Activity Score
│   │   │
│   │   ├── Active Leases
│   │   │   ├── Lease Details
│   │   │   └── Lease Documents
│   │   │
│   │   ├── Billing History
│   │   │   ├── Payment Summary Cards
│   │   │   ├── Next Due Payment
│   │   │   ├── Payment History Table
│   │   │   └── Download Receipts
│   │   │
│   │   ├── Property Preferences
│   │   │   ├── Property Types
│   │   │   ├── Listing Types
│   │   │   ├── Regions
│   │   │   ├── Price Range
│   │   │   ├── Bedrooms/Bathrooms
│   │   │   └── Enable/Disable Notifications
│   │   │
│   │   └── Settings
│   │       ├── Profile (Name, Phone, Address)
│   │       ├── Notifications (Email, Booking, Alerts)
│   │       ├── Security (Password, Verification)
│   │       └── Privacy (Visibility, Data Download, Delete Account)
│   │
│   ├── Wishlist (/wishlist) 🔒
│   │   ├── Saved Properties
│   │   ├── Saved Services
│   │   └── Saved Products
│   │
│   ├── My Bookings (/my-bookings) 🔒
│   │   ├── Upcoming Bookings
│   │   ├── Past Bookings
│   │   ├── Pending Requests
│   │   ├── Booking Details
│   │   ├── Messaging
│   │   └── Leave Review
│   │
│   └── Verification
│       ├── ID Verification (Front/Back Upload)
│       ├── Personal Information (Birth Place)
│       ├── Personal Picture Upload
│       └── Employment Verification
│
├── 💳 PAYMENTS
│   └── Checkout (/checkout) 🔒
│       ├── Payment Details
│       ├── Amount & Currency
│       ├── Payment Method
│       └── Confirm Payment
│
├── 🤖 FLEXI ASSIST (/flexi-assist)
│   ├── AI Chatbot Interface
│   ├── Property Search Help
│   ├── Booking Assistance
│   └── General Inquiries
│
├── 💼 CAREER (/career)
│   ├── Available Positions
│   ├── Company Culture
│   ├── Benefits
│   └── Application Form
│
├── 🎁 REFER (/refer)
│   ├── Referral Program Details
│   ├── Share Referral Link
│   ├── Track Referrals
│   └── Rewards
│
└── 👨‍💼 ADMIN PANEL 🔒 (Admin/Moderator Only)
    ├── Dashboard (/admin)
    │   ├── Key Metrics
    │   ├── Recent Activity
    │   ├── Quick Actions
    │   └── System Health
    │
    ├── Users Management (/admin/users)
    │   ├── User List
    │   ├── View User Details
    │   ├── Edit Roles
    │   ├── User Activity
    │   └── Account Deletion Requests
    │
    ├── Properties Management (/admin/properties)
    │   ├── All Properties
    │   ├── Pending Approval
    │   ├── Active Listings
    │   ├── Approve/Reject
    │   └── Edit Property Details
    │
    ├── Service Providers Management (/admin/service-providers)
    │   ├── Registration Requests
    │   ├── Active Providers
    │   ├── Review Applications
    │   ├── Approve/Reject
    │   └── Manage Provider Status
    │
    ├── Vendors Management (/admin/vendors)
    │   ├── Registration Requests
    │   ├── Active Vendors
    │   ├── Review Applications
    │   ├── Approve/Reject
    │   └── Manage Vendor Status
    │
    ├── Bookings Management (/admin/bookings)
    │   ├── All Bookings
    │   ├── Pending Bookings
    │   ├── Completed Bookings
    │   ├── Cancelled Bookings
    │   └── Booking Details & Messages
    │
    ├── Reviews Management (/admin/reviews)
    │   ├── All Reviews
    │   ├── Flagged Reviews
    │   ├── Review Details
    │   ├── Approve/Remove
    │   └── Manage Review Votes
    │
    ├── Verification Management (/admin/verification)
    │   ├── Pending Verifications
    │   ├── Approved Verifications
    │   ├── Rejected Verifications
    │   ├── Review Documents
    │   └── Approve/Reject with Reason
    │
    ├── Analytics (/admin/analytics)
    │   ├── Revenue Trends Chart
    │   ├── Booking Patterns Chart
    │   ├── User Growth Chart
    │   ├── Category Distribution Chart
    │   ├── Regional Analysis
    │   ├── Export to PDF
    │   └── Export to CSV
    │
    └── Currency Management (/admin/currency-rates)
        ├── View All Exchange Rates
        ├── Edit Exchange Rates
        ├── Real-time Updates
        └── Rate History

```

## Page Component Mapping

| Route | Component | Protection | Role Required |
|-------|-----------|------------|---------------|
| `/` | `Index.tsx` | Public | None |
| `/auth` | `Auth.tsx` | Public | None |
| `/rentals` | `Rentals.tsx` | Public | None |
| `/sales` | `Sales.tsx` | Public | None |
| `/marketplace` | `Marketplace.tsx` | Public | None |
| `/property/:id` | `PropertyDetails.tsx` | Public | None |
| `/service-provider/:id` | `ServiceProviderProfile.tsx` | Public | None |
| `/vendor/:id` | `VendorProfile.tsx` | Public | None |
| `/flexi-assist` | `FlexiAssist.tsx` | Public | None |
| `/career` | `Career.tsx` | Public | None |
| `/refer` | `Refer.tsx` | Public | None |
| `/wishlist` | `Wishlist.tsx` | Protected | Any authenticated |
| `/my-bookings` | `MyBookings.tsx` | Protected | Any authenticated |
| `/client-profile` | `ClientProfile.tsx` | Protected | Any authenticated |
| `/list-property` | `ListProperty.tsx` | Protected | Any authenticated |
| `/checkout` | `Checkout.tsx` | Protected | Any authenticated |
| `/service-provider-registration` | `ServiceProviderRegistration.tsx` | Public | None |
| `/service-provider-dashboard` | `ServiceProviderDashboard.tsx` | Protected | service_provider |
| `/service-provider-profile` | `ServiceProviderProfile.tsx` | Protected | service_provider |
| `/vendor-registration` | `VendorRegistration.tsx` | Public | None |
| `/vendor-dashboard` | `VendorDashboard.tsx` | Protected | vendor |
| `/vendor-profile` | `VendorProfile.tsx` | Protected | vendor |
| `/admin` | `admin/AdminDashboard.tsx` | Protected | admin, moderator |
| `/admin/users` | `admin/UsersManagement.tsx` | Protected | admin, moderator |
| `/admin/properties` | `admin/PropertiesManagement.tsx` | Protected | admin, moderator |
| `/admin/service-providers` | `admin/ServiceProvidersManagement.tsx` | Protected | admin, moderator |
| `/admin/vendors` | `admin/VendorsManagement.tsx` | Protected | admin, moderator |
| `/admin/bookings` | `admin/BookingsManagement.tsx` | Protected | admin, moderator |
| `/admin/reviews` | `admin/ReviewsManagement.tsx` | Protected | admin, moderator |
| `/admin/verification` | `admin/VerificationManagement.tsx` | Protected | admin, moderator |
| `/admin/analytics` | `admin/AnalyticsPage.tsx` | Protected | admin, moderator |
| `/admin/currency-rates` | `admin/CurrencyManagement.tsx` | Protected | admin, moderator |

## Navigation Structure

### Main Navbar (All Users)
- Logo → Home
- Rentals → `/rentals`
- Sales → `/sales`
- Services → Browse service providers
- Marketplace → `/marketplace`
- FlexiAssist → `/flexi-assist`
- Career → `/career`
- Refer → `/refer`
- Currency Selector → Switch currency
- Wishlist → `/wishlist` 🔒
- Notifications → Notification panel 🔒
- Profile → `/client-profile` 🔒
- Theme Toggle → Switch Light/Dark/System
- Login/Signup → `/auth` (if not logged in)

### Client Profile Sidebar (Authenticated Users)
- Dashboard
- Active Leases
- Billing History
- Property Preferences
- Settings
- Sign Out

### Service Provider Dashboard Sidebar
- Dashboard
- My Bookings
- Booking Requests
- Availability
- Portfolio
- Reviews
- Profile Settings
- Sign Out

### Vendor Dashboard Sidebar
- Dashboard
- Products
- Add Product
- Orders
- Reviews
- Profile Settings
- Sign Out

### Admin Sidebar
- Dashboard
- Users
- Properties
- Service Providers
- Vendors
- Bookings
- Reviews
- Verification
- Analytics
- Currency Rates
- Home
- Sign Out

## User Journey Flows

### New User Registration & Property Search
1. Land on Home `/`
2. Click "Sign Up" → `/auth`
3. Register with email/password
4. Redirected to Home (logged in)
5. Browse Rentals → `/rentals`
6. Filter properties
7. Click property → `/property/:id`
8. Add to Wishlist → Saved to `/wishlist`
9. Set property preferences → `/client-profile` → Property Preferences

### Service Booking Flow
1. Browse service providers (Home or dedicated section)
2. Click provider → `/service-provider/:id`
3. View portfolio, rates, availability
4. Click "Book Now"
5. Select date/time
6. Confirm booking → Added to `/my-bookings`
7. Messaging enabled
8. Service completed
9. Leave review

### Property Listing Flow (Landlord)
1. Login → `/auth`
2. Navigate to `/list-property`
3. Fill property form (title, location, price, images, features)
4. Submit listing
5. Property added to database (status: available)
6. Users with matching preferences notified
7. Manage listings via `/client-profile`

### Rental Payment Flow (Tenant)
1. View active lease → `/client-profile` → Active Leases
2. Check billing history → Billing History tab
3. See "Next Due" payment
4. Click "Pay Now" → Redirected to `/checkout`
5. Checkout pre-filled with payment details
6. Process payment
7. Receipt generated
8. Next installment unlocked

### Service Provider Registration Flow
1. Navigate to `/service-provider-registration`
2. Fill business information (name, contact, category)
3. Set hourly rate, years of experience
4. Add certifications
5. Submit application
6. Admin reviews → `/admin/service-providers`
7. Admin approves/rejects
8. If approved: Provider can access `/service-provider-dashboard`
9. Set up availability, portfolio
10. Start receiving bookings

### Vendor Registration Flow
1. Navigate to `/vendor-registration`
2. Fill business details (name, category, location)
3. Submit application
4. Admin reviews → `/admin/vendors`
5. Admin approves/rejects
6. If approved: Vendor can access `/vendor-dashboard`
7. Add products with images
8. Manage orders
9. Respond to reviews

### Admin Approval Workflow
1. Login as admin → `/auth`
2. Navigate to `/admin`
3. View pending approvals (providers, vendors, verifications)
4. Click on pending item
5. Review details/documents
6. Approve or reject with reason
7. User notified of decision

### User Verification Flow
1. Login → `/auth`
2. Navigate to `/client-profile` → Settings → Security
3. Click "Start Verification"
4. Upload ID (front & back)
5. Fill personal information
6. Upload personal picture
7. Fill employment details
8. Upload proof of work
9. Submit verification
10. Admin reviews → `/admin/verification`
11. Admin approves/rejects
12. User sees verification status in dashboard

## Backend API Endpoints (Edge Functions)

### Currently None Implemented
To create backend functions:
```
supabase/functions/
  └── [function-name]/
      └── index.ts  (TypeScript - Deno runtime)
```

### Suggested Functions to Implement
1. **payment-webhook**: Handle payment gateway webhooks
2. **send-email**: Email notifications (requires email service secret)
3. **send-sms**: SMS notifications (requires SMS service secret)
4. **generate-receipt**: PDF receipt generation
5. **property-search**: Advanced property search with AI
6. **chatbot**: FlexiBot AI responses (use Lovable AI)
7. **analytics**: Complex analytics calculations
8. **cron-lease-expiry**: Automated lease expiration checks

## Database Entity Relationships

```
users (auth.users)
  ├── profiles (1:1)
  ├── user_roles (1:many)
  ├── user_verification (1:1)
  ├── user_preferences (1:1)
  ├── properties (1:many) [as owner]
  ├── wishlist (1:many)
  ├── bookings (1:many)
  ├── booking_requests (1:many)
  ├── messages (1:many)
  ├── reviews (1:many) [as reviewer]
  ├── review_votes (1:many)
  ├── rental_leases (1:many) [as tenant or landlord]
  ├── rental_payments (1:many) [as tenant or landlord]
  ├── account_deletion_requests (1:many)
  └── currency_rates (1:many) [as admin updater]

properties
  ├── owner_id → profiles
  ├── rental_leases (1:many)
  └── wishlist (1:many)

service_provider_registrations
  ├── bookings (1:many)
  ├── booking_requests (1:many)
  ├── provider_availability (1:many)
  ├── portfolio_images (1:many)
  └── reviews (1:many) [as target]

vendor_registrations
  ├── vendor_products (1:many)
  └── reviews (1:many) [as target]

bookings
  ├── messages (1:many)
  └── reviews (1:1)

rental_leases
  └── rental_payments (1:many)

reviews
  └── review_votes (1:many)
```

## Key Contexts & State

### AuthContext
- Current user
- Session
- Sign up/in/out methods
- Loading state

### CurrencyContext
- Selected currency
- Exchange rates (fetched from database)
- Real-time rate updates
- Currency switch handler

### WishlistContext
- Wishlist items
- Add/remove item methods
- Check if item in wishlist
- Loading state

## Legend
- 🔒 = Requires Authentication
- 👨‍💼 = Requires Admin/Moderator Role
- 🏠 = Home
- 🔐 = Authentication
- 🏘️ = Properties
- 🛠️ = Services
- 🏪 = Marketplace
- 👤 = User Account
- 💳 = Payments
- 🤖 = AI Assistant
- 💼 = Career
- 🎁 = Referral

---

Last Updated: 2025-11-23
