# Auth & Dashboard — Implementation Plan

## What Gets Built

Full user authentication (email/password + Google OAuth) via Better Auth,
transactional emails via Resend (verify email, password reset), and a personal
dashboard that unlocks job history and API key management.
Conversion tools remain fully public — no login required to use them.

---

## Required Environment Variables

> [!IMPORTANT]
> Have these ready before starting:
> - `BETTER_AUTH_SECRET` — run `openssl rand -hex 32`
> - `BETTER_AUTH_URL` — e.g. `http://localhost:3000`
> - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
>   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
> - `RESEND_API_KEY` — from resend.com
> - `RESEND_FROM_EMAIL` — your verified sender e.g. `noreply@convertit.app`

> [!WARNING]
> The current `prisma/schema.prisma` `User` model is **incompatible** with Better Auth.
> A migration will add `Session`, `Account`, `Verification` tables and update `User`
> with `emailVerified`, `image`, `updatedAt`. Existing rows are unaffected.

---

## Proposed Changes

---

### Package Installation

```bash
bun add resend
```

---

### Database Schema

#### [MODIFY] [schema.prisma](file:///home/shivam/Desktop/convert-it/prisma/schema.prisma)
- Add to `User`: `emailVerified Bool`, `image String?`, `updatedAt DateTime`
- **[NEW]** `Session` model — Better Auth session store
- **[NEW]** `Account` model — Google OAuth provider link
- **[NEW]** `Verification` model — email verify + password reset tokens
- Keep `Job`, `File`, `Conversion`, `ApiKey`, `JobStatus` intact

```bash
bunx prisma migrate dev --name add-better-auth-tables
```

---

### Backend — Auth Engine

#### [MODIFY] [auth.ts](file:///home/shivam/Desktop/convert-it/app/lib/auth.ts)
Complete Better Auth server config:
- `emailAndPassword` plugin — sign up, sign in, email verification, password reset
- `socialProviders` — Google OAuth only
- Resend email adapter for verify/reset emails
- Prisma adapter wired to the Neon connection

#### [NEW] `app/lib/auth-client.ts`
Client-side Better Auth instance:
- `useSession()` hook — `data.user`, `data.session`, `isPending`
- `signIn.email()`, `signIn.social({ provider: "google" })`, `signOut()`, `signUp.email()`

#### [NEW] `app/api/auth/[...all]/route.ts`
Better Auth catch-all handler (GET + POST). ~5 lines.

#### [NEW] `app/lib/resend.ts`
Resend client singleton.

---

### Routing Middleware

#### [NEW] `middleware.ts` (project root)
- `/dashboard/*` → redirect to `/sign-in` if unauthenticated
- `/sign-in`, `/sign-up` → redirect to `/dashboard` if already authed
- All other routes → pass through (tools stay public)

---

### Auth Pages — `app/(auth)/`

#### [NEW] `app/(auth)/layout.tsx`
Centered card layout, no navbar/footer.

#### [NEW] `app/(auth)/sign-in/page.tsx`
- Email + password form (react-hook-form + Zod)
- "Continue with Google" OAuth button
- "Forgot password?" link → `/forgot-password`
- Link to `/sign-up`

#### [NEW] `app/(auth)/sign-up/page.tsx`
- Name + Email + Password + Confirm Password form
- "Continue with Google" OAuth button
- Triggers Better Auth email verification on submit
- Link to `/sign-in`

#### [NEW] `app/(auth)/verify-email/page.tsx`
- Reads `?token=` from URL → calls Better Auth verify endpoint
- Shows success / error state with redirect

#### [NEW] `app/(auth)/forgot-password/page.tsx`
- Email input → triggers Resend password reset email via Better Auth

#### [NEW] `app/(auth)/reset-password/page.tsx`
- Reads `?token=` from URL → new password + confirm form

---

### Dashboard — `app/(dashboard)/`

#### [NEW] `app/(dashboard)/layout.tsx`
- Sidebar: Dashboard, History, API Keys, Settings
- Top bar: user avatar + name + Sign Out
- Session guard

#### [NEW] `app/(dashboard)/page.tsx` — Stats Overview
- Cards: Total Conversions, PDFs, Images, Media Converted
- Recent Activity: last 5 jobs
- Empty state CTA: "Start converting →"

#### [NEW] `app/(dashboard)/history/page.tsx` — Job History
- Paginated table of `Job` records for the current user
- Columns: Date, Source, Target, Engine, Status, Duration
- Filter: All / Completed / Failed

#### [NEW] `app/(dashboard)/api-keys/page.tsx` — API Keys
- List `ApiKey` records with created date
- Generate New Key button (shown once after creation)
- Revoke button + copy-to-clipboard

#### [NEW] `app/(dashboard)/settings/page.tsx` — Account Settings
- Update display name
- Change password
- Danger zone: Delete account

---

### Navbar Updates

#### [MODIFY] Navbar component
- Unauthenticated → "Sign In" button
- Authenticated → user avatar + "Dashboard" link + "Sign Out"
- Uses `useSession()` client-side — no flash/SSR mismatch

---

## Build Order

```
1. bun add resend
2. Update prisma/schema.prisma → run migration
3. app/lib/auth.ts + app/lib/auth-client.ts + app/lib/resend.ts
4. app/api/auth/[...all]/route.ts
5. middleware.ts
6. app/(auth)/ pages: sign-in → sign-up → verify-email → forgot-password → reset-password
7. app/(dashboard)/: layout → page → history → api-keys → settings
8. Navbar session-aware updates
```

---

## Verification Plan

### Automated
- `bun run tsc --noEmit` — 0 errors
- `bun run test --run` — all 68 tests pass

### Manual
- Sign up → receive verification email → verify → dashboard loads ✓
- Sign in with Google → dashboard loads ✓
- Forgot password → receive email → reset → sign in with new password ✓
- Visit `/dashboard` unauthenticated → redirected to `/sign-in` ✓
- Run a PDF conversion → job appears in history ✓
- Generate API key → copy → revoke ✓
