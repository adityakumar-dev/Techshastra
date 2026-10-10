# 18 — Authentication

## What It Is

Two-part authentication system:

1. **Auth Page** (`/auth`): Login/signup form using Supabase Auth.
2. **Protected Route** (`ProtectedRoute.tsx`): A wrapper component that redirects unauthenticated users to `/auth`.

## Why It Was Built — The Story

The Admin panel manages club content — it must be restricted to authorised team members. Supabase Auth was chosen because:

- Already integrated as the project's backend
- Provides email/password auth with session management
- Client-side token handling via `@supabase/supabase-js`

## How It Works

### Files
| File | Purpose |
|------|---------|
| `src/pages/Auth.tsx` | Login/signup page |
| `src/components/ProtectedRoute.tsx` | Route guard component |
| `src/integrations/supabase/client.ts` | Supabase client instance |

### Technical Details

1. **Supabase client**: Configured in `src/integrations/supabase/client.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
2. **Session detection**: `supabase.auth.getSession()` checks for existing sessions.
3. **Protected routes**: `<ProtectedRoute>` wraps the Admin route in `App.tsx`. If no session exists, it redirects to `/auth`.
4. **Login flow**: Supabase's `signInWithPassword()` or `signUp()` methods handle credential-based auth.
