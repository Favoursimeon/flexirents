# Backend Architecture Guide

## Backend Overview

This project uses **Lovable Cloud** as its backend infrastructure, which provides:
- PostgreSQL database
- Authentication system
- File storage
- Serverless edge functions (TypeScript/Deno runtime)
- Real-time subscriptions

**Language**: TypeScript/JavaScript (Deno runtime for edge functions)
**Note**: This is NOT a traditional Node.js Express server. It's a serverless architecture.

## Backend Structure

```
Backend Architecture
│
├── Database (PostgreSQL)
│   ├── Tables (see DOCUMENTATION.md)
│   ├── Views (approved_service_providers, approved_vendors, public_profiles)
│   ├── Functions (PL/pgSQL)
│   ├── Triggers
│   └── Row Level Security (RLS) Policies
│
├── Authentication
│   ├── Email/Password
│   ├── Auto-confirm emails (enabled)
│   ├── Session management
│   └── User metadata
│
├── Storage Buckets
│   ├── avatars (public)
│   ├── property-images (public)
│   ├── service-provider-profiles (public)
│   ├── vendor-profiles (public)
│   ├── vendor-products (public)
│   ├── portfolio-images (public)
│   └── verification-documents (private)
│
├── Edge Functions (Serverless)
│   └── supabase/functions/
│       └── [function-name]/
│           └── index.ts
│
└── Real-time Subscriptions
    ├── properties (INSERT events)
    └── messages (ALL events)
```

## Backend Language & Runtime

### Edge Functions (TypeScript - Deno Runtime)

Edge functions use **TypeScript** running on **Deno** (not Node.js).

**Key Differences from Node.js:**
- Uses Deno instead of Node.js runtime
- No `package.json` or `node_modules`
- Import from URLs (e.g., `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`)
- Built-in TypeScript support
- Secure by default (explicit permissions)
- Standard library via URLs

**Example Edge Function:**
```typescript
// supabase/functions/hello-world/index.ts

import { ser
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          provider_response: string | null
          requested_date: string
          requested_hours: number
          requested_time: string
          service_type: string
          status: string
          updated_at: string
         ve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    
    const data = {
      message: `Hello ${name}!`,
    }

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      },
    )
  }
})
```

## Creating Edge Functions

### Step 1: Create Function Directory
```
supabase/functions/
  └── my-function/
      └── index.ts
```

### Step 2: Write Function Code

**Template:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get request body
    const { data } = await req.json()

    // Your logic here
    // ...

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      },
    )
  }
})
```

### Step 3: Update config.toml

```toml
# supabase/config.toml

project_id = "pwkgxiasbferdinngbid"

[functions.my-function]
verify_jwt = true  # Set to false for public functions
```

### Step 4: Deploy (Automatic)
Edge functions deploy automatically when code is pushed. No manual deployment needed.

## Calling Edge Functions from Frontend

### Using Supabase Client (Recommended)

```typescript
import { supabase } from "@/integrations/supabase/client"

const { data, error } = await supabase.functions.invoke('my-function', {
  body: { 
    key: 'value' 
  },
})

if (error) {
  console.error('Function error:', error)
  return
}

console.log('Function response:', data)
```

### Using Fetch (Alternative)
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/my-function`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: 'value' }),
  }
)

const data = await response.json()
```

## Database Functions (PL/pgSQL)

Database functions are written in **PL/pgSQL** (PostgreSQL procedural language).

**Example: Generate Payment Schedule**
```sql
CREATE OR REPLACE FUNCTION public.generate_payment_schedule(
  p_lease_id UUID,
  p_tenant_id UUID,
  p_landlord_id UUID,
  p_lease_start_date DATE,
  p_lease_duration_months INTEGER,
  p_monthly_rent NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_first_payment_months INTEGER;
  v_first_payment_amount NUMERIC;
  v_remaining_months INTEGER;
  v_installment_start_month INTEGER;
  v_current_due_date DATE;
  v_installment_num INTEGER;
BEGIN
  -- Logic to create payment schedule
  -- (see actual function in database)
END;
$$;
```

**Calling from Frontend:**
```typescript
import { supabase } from "@/integrations/supabase/client"

const { data, error } = await supabase.rpc('generate_payment_schedule', {
  p_lease_id: leaseId,
  p_tenant_id: tenantId,
  p_landlord_id: landlordId,
  p_lease_start_date: startDate,
  p_lease_duration_months: duration,
  p_monthly_rent: rent,
})
```

## Row Level Security (RLS)

RLS policies control data access at the database level.

**Example Policy:**
```sql
-- Users can only view their own profiles
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profiles
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
```

**Important**: All tables have RLS enabled with specific policies. Check policies before making changes.

## Authentication Flow (Backend Perspective)

### Sign Up
1. User submits email/password/full_name to `supabase.auth.signUp()`
2. Auto-confirm enabled (no email verification required)
3. User record created in `auth.users` (managed by backend)
4. Trigger `handle_new_user()` fires:
   - Creates profile in `public.profiles`
   - Extracts full_name from metadata
5. Trigger `handle_new_user_role()` fires:
   - Creates default "user" role in `public.user_roles`
6. User logged in automatically

### Sign In
1. User submits email/password to `supabase.auth.signInWithPassword()`
2. Backend validates credentials
3. Session created with JWT token
4. Frontend stores session in localStorage

### Session Management
- JWT token auto-refreshes
- Session persists across page reloads
- Sign out clears session from backend and frontend

## Storage

### Uploading Files
```typescript
import { supabase } from "@/integrations/supabase/client"

// Upload avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true,
  })

// Get public URL
const { data: publicData } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)

console.log('Public URL:', publicData.publicUrl)
```

### Property Image Upload Example
```typescript
// Multiple property images upload
const imageUrls: string[] = [];
for (const image of selectedImages) {
  const fileExt = image.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(fileName, image);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(fileName);
  
  imageUrls.push(publicUrl);
}

// Save property with image URLs
await supabase.from('properties').insert({
  title: 'Property Title',
  images: imageUrls, // Array of image URLs
  status: 'pending', // Requires admin approval
  // ... other fields
});
```

### Storage Policies
```sql
-- Public read access for avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Real-time Subscriptions

### Enable Real-time on Table
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
```

### Subscribe to Changes (Frontend)
```typescript
import { supabase } from "@/integrations/supabase/client"

const channel = supabase
  .channel('properties')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'properties',
    },
    (payload) => {
      console.log('New property:', payload.new)
      // Handle new property notification
    }
  )
  .subscribe()

// Clean up
return () => {
  channel.unsubscribe()
}
```

## Environment Variables (Backend)

Backend functions have access to:
- `SUPABASE_URL`: Backend API URL
- `SUPABASE_ANON_KEY`: Public API key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin API key (use with caution)
- Custom secrets: Add via secrets management

### Using Secrets in Edge Functions
```typescript
const apiKey = Deno.env.get('MY_API_KEY')

if (!apiKey) {
  throw new Error('MY_API_KEY not configured')
}

// Use apiKey for external API calls
```

## Database Migrations

Create database changes using migrations:

```sql
-- Create new table
CREATE TABLE public.my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
ON public.my_table
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
ON public.my_table
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Debugging Backend

### Edge Function Logs
Check edge function logs in Lovable:
- View Backend → Functions → Select function → Logs

### Database Query Logs
Check database logs in Lovable:
- View Backend → Database → Logs

### Common Backend Errors

1. **RLS Policy Denial**
   - Error: `new row violates row-level security policy`
   - Fix: Check RLS policies for the table

2. **Foreign Key Violation**
   - Error: `violates foreign key constraint`
   - Fix: Ensure referenced record exists

3. **Auth Error**
   - Error: `JWT expired` or `Invalid JWT`
   - Fix: Refresh session or re-authenticate

4. **Function Not Found**
   - Error: `function does not exist`
   - Fix: Check function name and ensure it's deployed

## Best Practices

1. **Always use CORS headers** in edge functions
2. **Validate input** in edge functions and database functions
3. **Use RLS policies** for data access control
4. **Handle errors gracefully** with try-catch
5. **Log important events** for debugging
6. **Use database functions** for complex queries
7. **Keep edge functions focused** - one responsibility per function
8. **Test functions** before deploying
9. **Use transactions** for multiple related database operations
10. **Secure sensitive operations** with service role key

## API Limits

- Edge function timeout: 60 seconds
- Database query timeout: 10 seconds (adjustable)
- Storage upload size: 50MB per file (adjustable)
- Real-time connections: Based on plan

## Cost Optimization

1. **Minimize database queries** - use joins instead of multiple queries
2. **Cache frequently accessed data** in edge functions
3. **Use indexes** on frequently queried columns
4. **Batch operations** when possible
5. **Clean up old data** periodically
6. **Optimize images** before uploading
7. **Use database functions** instead of multiple client-side queries

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] RLS policies properly configured
- [ ] Sensitive data encrypted in database
- [ ] API keys stored as secrets (not in code)
- [ ] Input validation in edge functions
- [ ] CORS properly configured
- [ ] Service role key never exposed to frontend
- [ ] User authentication required for protected operations
- [ ] File upload size limits enforced
- [ ] Rate limiting on public endpoints

## Next Steps

1. **View Backend**: Click button below to access backend dashboard
2. **Create Edge Functions**: Implement payment webhooks, email sending, etc.
3. **Optimize Queries**: Add database indexes for performance
4. **Set Up Monitoring**: Track function errors and database performance
5. **Implement Cron Jobs**: Automate recurring tasks (lease expiry, etc.)

---

Last Updated: 2025-11-23
