# FlexiSpace - Complete Documentation

## Project Overview
FlexiSpace is a comprehensive real estate platform for property rentals, sales, service provider bookings, and vendor marketplace in Ghana.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API (Auth, Wishlist, Currency)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives via shadcn/ui

### Backend (Lovable Cloud)
- **Database**: PostgreSQL (Lovable Cloud)
- **Authentication**: Email/Password authentication
- **File Storage**: Cloud Storage buckets
- **Backend Functions**: TypeScript Edge Functions (Deno runtime)
- **Real-time**: Real-time subscriptions for live updates

## Project Structure

```
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── admin/           # Admin-specific components
│   │   ├── ui/              # Base UI components (shadcn)
│   │   └── [feature].tsx    # Feature-specific components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── CurrencyContext.tsx
│   │   └── WishlistContext.tsx
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Backend client & types
│   │   └── supabase/
│   ├── pages/               # Route pages
│   │   ├── admin/          # Admin dashboard pages
│   │   └── [feature].tsx   # Feature pages
│   ├── data/               # Static data (Ghana locations)
│   ├── lib/                # Utility functions
│   └── main.tsx            # App entry point
├── supabase/               # Backend configuration
│   ├── functions/          # Edge functions (serverless)
│   ├── migrations/         # Database migrations
│   └── config.toml         # Backend config
└── public/                 # Static assets
```

## Backend Structure

### Database Tables

#### User Management
- **profiles**: User profile information (avatar, name, phone)
- **user_roles**: Role-based access control (user, admin, service_provider, vendor, moderator)
- **user_verification**: Identity verification documents and status
- **user_preferences**: Property notification preferences
- **account_deletion_requests**: Account deletion workflow

#### Currency Management
- **currency_rates**: Admin-managed exchange rates for multi-currency support

#### Property Management
- **properties**: Property listings (rentals/sales)
- **rental_leases**: Active rental agreements
- **rental_payments**: Payment tracking and history
- **wishlist**: User saved properties

#### Service Provider System
- **service_provider_registrations**: Service provider applications
- **bookings**: Confirmed service bookings
- **booking_requests**: Custom booking requests
- **provider_availability**: Available time slots
- **portfolio_images**: Portfolio gallery

#### Vendor System
- **vendor_registrations**: Vendor applications
- **vendor_products**: Marketplace products

#### Reviews & Ratings
- **reviews**: Reviews for properties/services/vendors
- **review_votes**: Helpful/unhelpful votes on reviews

#### Communication
- **messages**: In-app messaging for bookings
- **newsletter_subscriptions**: Email newsletter signups

### Storage Buckets
1. **avatars** (public): User profile pictures
2. **property-images** (public): Property photos
3. **service-provider-profiles** (public): Provider profile images
4. **vendor-profiles** (public): Vendor profile images
5. **vendor-products** (public): Product images
6. **portfolio-images** (public): Service provider portfolios
7. **verification-documents** (private): Identity documents

### Database Functions
- `generate_payment_schedule`: Creates installment payment schedules
- `get_average_rating`: Calculates average rating for entities
- `get_review_count`: Counts reviews for entities
- `has_role`: Checks user role permissions
- `update_expired_leases`: Cron job for lease expiration
- `handle_new_user`: Creates profile on signup
- `calculate_rent_expiration`: Computes lease end dates

### Backend Functions (Edge Functions)
Location: `supabase/functions/`
- Written in TypeScript (Deno runtime)
- Serverless architecture
- Auto-deployed on code changes
- Access to environment secrets

**Note**: Currently no edge functions implemented. Create functions in `supabase/functions/[function-name]/index.ts`

## Application Routes

### Public Routes
- `/` - Home page with property carousel
- `/auth` - Login/Signup page
- `/rentals` - Browse rental properties
- `/sales` - Browse properties for sale
- `/marketplace` - Vendor products marketplace
- `/flexi-assist` - AI chatbot assistant
- `/career` - Career opportunities
- `/refer` - Referral program
- `/property/:id` - Property details
- `/service-provider/:id` - Provider profile
- `/vendor/:id` - Vendor profile

### Protected Routes (Requires Authentication)
- `/wishlist` - Saved properties
- `/my-bookings` - User bookings
- `/client-profile` - User dashboard & settings
- `/list-property` - Create property listing
- `/checkout` - Payment processing

### Service Provider Routes
- `/service-provider-registration` - Provider signup
- `/service-provider-dashboard` - Provider dashboard
- `/service-provider-profile` - Provider management

### Vendor Routes
- `/vendor-registration` - Vendor signup
- `/vendor-dashboard` - Vendor dashboard
- `/vendor-profile` - Vendor management

### Admin Routes (Admin/Moderator Only)
- `/admin` - Admin dashboard overview
- `/admin/users` - User management
- `/admin/properties` - Property moderation
- `/admin/service-providers` - Provider approvals
- `/admin/vendors` - Vendor approvals
- `/admin/bookings` - Booking management
- `/admin/reviews` - Review moderation
- `/admin/verification` - Verification approvals
- `/admin/analytics` - Analytics & reports
- `/admin/currency-rates` - Currency exchange rate management

## Key Features

### 1. Multi-Currency System
Supported currencies: USD, GHS, EUR, GBP, NGN
- Currency selector in navbar
- All prices display in selected currency
- **Exchange rates managed by admins** via `/admin/currency-rates`
- Real-time rate updates throughout the application
- Hover tooltip on property cards shows prices in all supported currencies simultaneously

### 2. Property Notifications
- Users set property preferences (type, location, price range, bedrooms/bathrooms)
- Real-time notifications when matching properties are listed
- Can pause/resume notifications
- Stored in `user_preferences` table

### 3. User Verification System
Identity verification with:
- ID upload (Ghana Card/Passport/Driver's License - front & back)
- Personal information (place of birth)
- Personal picture upload
- Employment verification (status, employer, proof of work)
- Admin approval workflow

### 4. Rental Payment System
Flexible installment payments:
- First payment covers initial period (6 or 12 months)
- Remaining months paid as monthly installments
- Installments start after initial period
- Sequential payment links (next unlocks after current payment)
- Due dates on 1st of each month

### 5. Badge/Tier System
User badges based on:
- **Service Providers/Landlords/Vendors**: Customer satisfaction (reviews)
- **Regular Users/Tenants**: Activity metrics (bookings, views)
- Tiers: Bronze, Silver, Gold, Platinum

### 6. Theme System
Three theme modes:
- **Light**: Manual light mode
- **Dark**: Manual dark mode
- **System**: Auto-detect based on device/time settings
- Theme toggle in navbar (right of profile)

### 7. Admin Dashboard
Role-based access control:
- User management (view/edit roles)
- Property moderation
- Service provider & vendor approvals
- Booking oversight
- Review moderation
- **Currency exchange rate management**
- Analytics with charts (revenue, bookings, user growth)
- Export reports (PDF, CSV)

### 8. Billing History
For tenants:
- View payment transaction history
- Track installment due dates
- Download receipts
- Verify payment status
- "Pay Now" links to pre-filled checkout

### 9. Client Dashboard
Role-specific metrics:
- **Regular Users**: Verification status, alerts, wishlist, leases, payments, bookings
- **Service Providers**: Verification, alerts, rating, bookings, pending requests
- **Vendors**: Verification, alerts, rating, products, bookings

### 10. Messaging System
In-app messaging for bookings:
- Real-time message updates
- Message read status
- Booking-specific conversations

## Authentication Flow

1. User signs up with email/password + full name
2. Email auto-confirmed (enabled in auth config)
3. Profile automatically created in `profiles` table
4. Default "user" role assigned in `user_roles` table
5. User can access protected routes

### Role Permissions
- **user**: Browse, wishlist, book services, rent properties
- **service_provider**: Manage bookings, availability, portfolio
- **vendor**: Manage products, orders
- **admin**: Full system access, user management
- **moderator**: Content moderation, approvals

## Real-time Features

### Property Notifications
- Real-time subscription on `properties` table
- Listens for INSERT events
- Matches against user preferences
- Toast notifications for matches

### Messaging
- Real-time subscription on `messages` table
- Live message updates in booking conversations
- Unread message badges

## Security & RLS Policies

Row Level Security (RLS) enabled on all tables with policies for:
- Users can only view/edit their own data
- Service providers can manage their listings/bookings
- Vendors can manage their products
- Admins can access all data
- Public read access for approved listings

## Environment Variables

Automatically configured (DO NOT EDIT):
- `VITE_SUPABASE_URL`: Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Public API key
- `VITE_SUPABASE_PROJECT_ID`: Project identifier

## Design System

### Colors (HSL)
Defined in `src/index.css`:
- Primary: Main brand color (blue)
- Secondary: Supporting color
- Accent: Highlight color
- Background/Foreground: Surface colors
- Muted: Subdued elements
- Destructive: Error/danger states
- Border: Component borders

### Components
All UI components use semantic tokens from design system.
Custom Tailwind classes extend base configuration in `tailwind.config.ts`.

## Data Flow

### Property Listing Flow
1. User navigates to `/list-property`
2. Fills property form (title, location, price, images, etc.)
3. Submits to `properties` table
4. Status set to "available" (or pending if admin approval required)
5. Real-time listeners notify users with matching preferences

### Booking Flow
1. User browses service providers
2. Clicks "Book Now" or requests custom time
3. Booking created in `bookings` or `booking_requests` table
4. Provider receives notification
5. Provider accepts/rejects
6. User receives confirmation
7. Messaging enabled for coordination

### Payment Flow
1. User initiates payment (rental or service)
2. Redirected to `/checkout` with payment details
3. Payment processed (external payment gateway integration needed)
4. Payment record created in `rental_payments` table
5. Receipt generated
6. Lease status updated if rental payment

## API Integration Points

### External APIs (To Be Implemented)
1. **Payment Gateway**: For processing transactions
2. **SMS Notifications**: For booking confirmations
3. **Email Service**: For notifications (requires RESEND_API_KEY)
4. **Maps API**: For property location visualization
5. **AI Service**: For FlexiBot chatbot (Lovable AI available)

### Internal Backend Functions
Create edge functions in `supabase/functions/` for:
- Payment processing webhooks
- Email notifications
- SMS sending
- Advanced data processing
- Third-party API integrations

## Deployment

### Frontend
Click "Publish" button (top right) → "Update" to deploy frontend changes.

### Backend
Backend changes deploy automatically:
- Database migrations: Auto-deployed on approval
- Edge functions: Auto-deployed on code push
- Storage policies: Auto-applied

### Custom Domain
Navigate to Settings → Domains → Connect Domain (requires paid plan)

## Testing & Debugging

### Available Tools
- Console logs (accessible in Lovable)
- Network requests monitor
- Backend function logs
- Database query logs

### Common Issues
1. **Auth errors**: Check if email auto-confirm is enabled
2. **RLS errors**: Verify user has correct role and policies
3. **Upload errors**: Check storage bucket policies
4. **Real-time not working**: Verify table has realtime enabled

## Performance Optimization

1. **Image Optimization**: All images stored in cloud storage
2. **Lazy Loading**: Components loaded on demand
3. **Database Indexing**: Critical fields indexed
4. **Edge Caching**: Static assets cached at edge
5. **Query Optimization**: Use `.select()` to fetch only needed fields

## Maintenance

### Regular Tasks
1. Monitor expired leases (automated via `update_expired_leases`)
2. Review user verification requests
3. Moderate property listings
4. Check payment reconciliation
5. Respond to user inquiries

### Database Cleanup
- Archive old messages
- Clean up expired verification documents
- Remove stale booking requests

## Future Enhancements

Potential features to add:
1. Video property tours
2. Virtual staging
3. Mortgage calculator
4. Property comparison tool
5. Advanced search filters
6. Saved searches
7. Property alerts via SMS/email
8. Integrated payment gateway
9. Tenant screening
10. Maintenance request system

## Support & Resources

- Lovable Documentation: https://docs.lovable.dev/
- Lovable Community: Discord channel
- Project Settings: Access via project menu (top left)
- Backend Dashboard: Use "View Backend" action below

## Version Control

This project uses Git for version control. Changes are automatically committed to the connected repository.

### Making Backend Changes
1. Database: Use migration tool (automatically approved by user)
2. Edge Functions: Create in `supabase/functions/[name]/index.ts`
3. Storage: Define buckets and policies via migrations

## Contributing

For team collaboration:
- Invite members via Settings → People
- Assign appropriate roles (viewer, editor, admin)
- Use workspaces for organization-wide projects
- Enable code editing in Account Settings → Labs (if needed)

---

Last Updated: 2025-11-23
Version: 1.0
