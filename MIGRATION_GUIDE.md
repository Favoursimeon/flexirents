# FlexiAssist Migration Guide

This document details everything needed to rebuild FlexiAssist as a standalone project, including all removed files, shared dependencies, database tables, RLS policies, storage buckets, and database functions.

---

## 1. Removed Pages

| File | Purpose |
|------|---------|
| `src/pages/FlexiAssist.tsx` | Main service listing & search page |
| `src/pages/ServiceProviderProfile.tsx` | Public profile page for a service provider |
| `src/pages/ServiceProviderRegistration.tsx` | Registration form for new service providers |
| `src/pages/ServiceProviderDashboard.tsx` | Dashboard for managing bookings, profile, portfolio |
| `src/pages/MyBookings.tsx` | Client-facing list of their bookings |

## 2. Removed Components

| File | Purpose |
|------|---------|
| `src/components/FlexiBot.tsx` | Floating chatbot assistant for property/service queries |
| `src/components/BookingModal.tsx` | Modal dialog for creating a booking with a provider |
| `src/components/BookingRequestsList.tsx` | List of incoming booking requests for providers |
| `src/components/ServiceCard.tsx` | Card component displaying a service provider summary |
| `src/components/ProviderAvailabilityCalendar.tsx` | Calendar + time slot picker for provider availability |
| `src/components/PortfolioGallery.tsx` | Public gallery of provider portfolio images |
| `src/components/PortfolioManagement.tsx` | CRUD interface for providers to manage portfolio images |
| `src/components/CustomTimeRequestModal.tsx` | Modal for requesting a custom time outside available slots |

## 3. Removed Admin Pages

| File | Purpose |
|------|---------|
| `src/pages/admin/ServiceProvidersManagement.tsx` | Admin page to approve/reject service provider registrations |

## 4. Shared Components (NOT removed — copy these)

These components are used by both FlexiAssist and the main FlexiRents app. You will need to **copy** them into the new project:

| File | Used By (in FlexiRents) |
|------|------------------------|
| `src/components/RatingStars.tsx` | PropertyDetails, VendorProfile |
| `src/components/ReviewCard.tsx` | PropertyDetails, VendorProfile |
| `src/components/ReviewForm.tsx` | PropertyDetails, VendorProfile, ServiceProviderDashboard |
| `src/components/MessagingDialog.tsx` | ServiceProviderDashboard |
| `src/components/ProfilePictureUpload.tsx` | ServiceProviderDashboard, ClientProfile |

## 5. Shared Contexts & Hooks (copy these)

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/contexts/CurrencyContext.tsx` | Multi-currency formatting |
| `src/hooks/useUserRole.tsx` | Checks user roles (service_provider, vendor, user) |
| `src/hooks/useAdminRole.tsx` | Checks if user is admin |

## 6. Shared UI Components

The project uses **shadcn/ui** components from `src/components/ui/`. You will need the full shadcn setup in the new project, including at minimum:
- `button`, `input`, `card`, `dialog`, `badge`, `tabs`, `select`, `textarea`, `calendar`, `scroll-area`, `separator`, `avatar`, `form`, `label`, `toast`, `toaster`, `sonner`, `skeleton`, `table`, `popover`

## 7. Key Dependencies (npm)

```
@supabase/supabase-js
@tanstack/react-query
react-router-dom
date-fns
lucide-react
zod
react-hook-form
@hookform/resolvers
recharts (if adding analytics)
react-easy-crop (for profile picture cropping)
sonner
```

---

## 8. Database Tables

### 8.1 `service_provider_registrations`

Core table for service provider profiles.

```sql
CREATE TABLE public.service_provider_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  hourly_rate TEXT NOT NULL,
  years_experience INTEGER NOT NULL,
  certifications TEXT,
  availability TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_provider_registrations ENABLE ROW LEVEL SECURITY;

-- View: only approved providers are public
CREATE POLICY "Public can view approved providers"
  ON public.service_provider_registrations FOR SELECT
  USING (status = 'approved');

-- Anyone can submit a registration
CREATE POLICY "Anyone can submit service provider registration"
  ON public.service_provider_registrations FOR INSERT
  WITH CHECK (true);

-- Providers can update their own record (matched by email)
CREATE POLICY "Service providers can update their own details"
  ON public.service_provider_registrations FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_user_email(email))
  WITH CHECK (auth.uid() IS NOT NULL AND is_user_email(email));

-- Admins have full access
CREATE POLICY "Admins can manage service provider registrations"
  ON public.service_provider_registrations FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

### 8.2 `approved_service_providers` (View)

```sql
CREATE VIEW public.approved_service_providers AS
SELECT id, provider_name, service_category, description, hourly_rate,
       years_experience, availability, location, region, created_at
FROM public.service_provider_registrations
WHERE status = 'approved';
```

### 8.3 `provider_availability`

```sql
CREATE TABLE public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can view availability
CREATE POLICY "Anyone can view availability"
  ON public.provider_availability FOR SELECT
  USING (true);

-- Providers manage their own availability
CREATE POLICY "Service providers can manage their availability"
  ON public.provider_availability FOR ALL
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = provider_availability.provider_id
        AND is_user_email(email)
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = provider_availability.provider_id
        AND is_user_email(email)
    )
  );
```

### 8.4 `booking_requests`

```sql
CREATE TABLE public.booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id),
  service_type TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  requested_hours INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  provider_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Users can create booking requests
CREATE POLICY "Users can create booking requests"
  ON public.booking_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Users can view their own booking requests
CREATE POLICY "Users can view their own booking requests"
  ON public.booking_requests FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Providers can view booking requests sent to them
CREATE POLICY "Service providers can view their booking requests"
  ON public.booking_requests FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = booking_requests.provider_id AND is_user_email(email)
    )) OR has_role(auth.uid(), 'admin')
  );

-- Providers can update (accept/reject) booking requests
CREATE POLICY "Service providers can update their booking requests"
  ON public.booking_requests FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = booking_requests.provider_id AND is_user_email(email)
    )) OR has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = booking_requests.provider_id AND is_user_email(email)
    )) OR has_role(auth.uid(), 'admin')
  );

-- Admins can view and update all
CREATE POLICY "Admins can view all booking requests"
  ON public.booking_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all booking requests"
  ON public.booking_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### 8.5 `bookings`

```sql
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id),
  service_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  total_hours INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can create bookings
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service providers can view and update bookings for their services
CREATE POLICY "Service providers can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = bookings.service_provider_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Service providers can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = bookings.service_provider_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = bookings.service_provider_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

### 8.6 `messages`

```sql
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for bookings they are part of
CREATE POLICY "Users can view messages for their bookings"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (SELECT 1 FROM bookings WHERE id = messages.booking_id AND user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM bookings
        JOIN service_provider_registrations ON bookings.service_provider_id = service_provider_registrations.id
        WHERE bookings.id = messages.booking_id
          AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Users can create messages for their bookings
CREATE POLICY "Users can create messages for their bookings"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM bookings WHERE id = messages.booking_id AND user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM bookings
        JOIN service_provider_registrations ON bookings.service_provider_id = service_provider_registrations.id
        WHERE bookings.id = messages.booking_id
          AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Users can update read status
CREATE POLICY "Users can update message read status"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (SELECT 1 FROM bookings WHERE id = messages.booking_id AND user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM bookings
        JOIN service_provider_registrations ON bookings.service_provider_id = service_provider_registrations.id
        WHERE bookings.id = messages.booking_id
          AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );
```

### 8.7 `portfolio_images`

```sql
CREATE TABLE public.portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio images of approved providers
CREATE POLICY "Anyone can view portfolio images"
  ON public.portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = portfolio_images.provider_id AND status = 'approved'
    )
  );

-- Providers can manage their own portfolio
CREATE POLICY "Service providers can manage their portfolio"
  ON public.portfolio_images FOR ALL
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = portfolio_images.provider_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE id = portfolio_images.provider_id
        AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
```

### 8.8 `reviews` (shared table)

The `reviews` table is shared with the main FlexiRents app. In FlexiAssist, reviews have `target_type = 'service_provider'`. You can either share this table or create a dedicated one.

### 8.9 `review_votes` (shared table)

Same as reviews — shared. Copy the table structure and RLS policies from the main project.

---

## 9. Required Database Functions

```sql
-- Check if the current user's email matches a given email
CREATE OR REPLACE FUNCTION public.is_user_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = _email
  )
$$;

-- Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Average rating helper
CREATE OR REPLACE FUNCTION public.get_average_rating(p_target_type text, p_target_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM public.reviews
  WHERE target_type = p_target_type AND target_id = p_target_id;
$$;

-- Review count helper
CREATE OR REPLACE FUNCTION public.get_review_count(p_target_type text, p_target_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reviews
  WHERE target_type = p_target_type AND target_id = p_target_id;
$$;
```

## 10. Required Enum

```sql
CREATE TYPE public.app_role AS ENUM ('user', 'service_provider', 'vendor', 'admin', 'moderator');
```

## 11. Supporting Tables

### `user_roles`

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### `profiles`

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
```

---

## 12. Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `service-provider-profiles` | Yes | Profile images for service providers |
| `portfolio-images` | Yes | Portfolio/work sample images |

---

## 13. Routes to Implement

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing page | Service categories, search, featured providers |
| `/service-provider/:id` | ServiceProviderProfile | Public provider profile with reviews, portfolio, booking |
| `/service-provider-registration` | ServiceProviderRegistration | Registration form |
| `/service-provider-dashboard` | ServiceProviderDashboard | Provider management panel |
| `/my-bookings` | MyBookings | Client booking history |
| `/admin/service-providers` | ServiceProvidersManagement | Admin approval panel |
| `/admin/bookings` | BookingsManagement | Admin booking overview |

---

## 14. Environment Variables

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

---

## 15. Checklist

- [ ] Create new Supabase project (or use Lovable Cloud)
- [ ] Run all SQL migrations (tables, views, functions, enums, RLS)
- [ ] Create storage buckets (`service-provider-profiles`, `portfolio-images`)
- [ ] Set up authentication (email + optional Google OAuth)
- [ ] Copy shared components (ReviewCard, ReviewForm, RatingStars, etc.)
- [ ] Copy contexts (AuthContext, CurrencyContext) and hooks
- [ ] Install all npm dependencies
- [ ] Set up shadcn/ui components
- [ ] Implement all pages and routes
- [ ] Configure auto-confirm email or email verification as needed
- [ ] Test end-to-end: registration → approval → booking → messaging → reviews
