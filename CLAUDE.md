@AGENTS.md

# Aurelia Admin + Server — Project Source of Truth

> Single source of truth for architecture, implemented features, database schema, API
> endpoints, integrations, and history for the **backend/admin** repo (`admin-and-server-aurelia`).
> **Read this before starting any task; update it after completing any task.** Treat it as the
> project's persistent memory. The mobile client (`aurelia-app`) keeps its own CLAUDE.md.

**Status legend:** ✅ Completed · 🚧 In Progress · ⚠️ Known Issue · ⏳ Pending · ❌ Not Started

Last updated: **2026-07-21** (dashboard device-access analytics)

---

## 1. Project Architecture

**`admin-and-server-aurelia`** — Next.js app that is **both** the staff admin dashboard **and** the
mobile app's backend API. Serves the offline-first walking-tour platform whose consumer client is
`aurelia-app` (separate working dir, Expo/React Native).

- **Framework:** Next.js **16.2.10** (App Router, RSC), React **19.2.4**. ⚠️ This is a newer Next.js
  than training data — read `node_modules/next/dist/docs/` before writing framework code (per AGENTS.md).
- **Language/build:** TypeScript 5, `pnpm` (workspace), ESLint 9 (`eslint-config-next`).
- **DB:** Prisma **7.8** with **`@prisma/adapter-pg` (`PrismaPg`)** → **Neon serverless Postgres**.
  Generated client output is committed at [src/generated/prisma/](src/generated/prisma/) (import from
  `@/generated/prisma/client`, **not** `@prisma/client`). Prisma client singleton:
  [src/lib/prisma.ts](src/lib/prisma.ts).
- **Styling/UI:** Tailwind CSS v4, shadcn (`base-nova` style, neutral base, CSS variables), Radix/
  `@base-ui/react`, lucide icons. UI primitives in [src/components/ui/](src/components/ui/).
- **Client state/data:** TanStack Query v5 + Zustand v5; forms via React Hook Form + Zod resolvers;
  rich text via Quill v2.
- **Two surfaces, one codebase:**
  - **Admin dashboard** — route group `src/app/(dashboard)/*` + `(auth)/*`, guarded by Neon Auth.
  - **Mobile API** — `/api/v1/app/*` (public, API-key + device-session gated) and `/api/v1/*`
    (staff-only admin API).

---

## 2. Backend Layering / Module Pattern

The domain layer lives in [src/modules/](src/modules/), one folder per bounded context, each following
a consistent slice: `*.controller.ts` (HTTP glue), `*.service.ts` (business logic), `*.repository.ts`
(Prisma access, many extend [base.repository.ts](src/lib/repository/base.repository.ts)), `*.schema.ts`
(Zod), `*.mapper.ts` (entity → DTO), `*.types.ts`, and `index.ts` barrel.

- **Route handlers** (`src/app/api/**/route.ts`) are thin: wrap the controller with
  `withErrorHandler` ([src/lib/api/handler.ts](src/lib/api/handler.ts)), which maps `AppError`
  subclasses ([src/lib/api/errors.ts](src/lib/api/errors.ts)), Prisma errors (`P2002`→409, `P2025`→404,
  `P1001`→503), and **transient Neon errors → 503** (see §8).
- **Admin modules:** `tour`, `spot`, `floor`, `tour-route`, `tour-bundle`, `tour-access`, `media`, `faq`,
  `faq-category`, `knowledge-article`, `ai-knowledge`, `app-asset`, `app-ui-string`, `audit-log`,
  `device-pricing-tier`, `subscription-plan`, `subscription-purchase`, `staff-profile`, `user`,
  `host`, `host-directions`.
- **Mobile modules:** `mobile-auth`, `mobile-catalog`, `mobile-download`, `mobile-entitlements`,
  `mobile-knowledge`, `mobile-app-content`, `mobile-release-config`, `mobile-versions`, `mobile-host`.
- **Client-side services** ([src/services/](src/services/)) are axios wrappers the admin UI calls via
  TanStack Query hooks in [src/hooks/queries/](src/hooks/queries/) and
  [src/hooks/mutations/](src/hooks/mutations/). Query keys centralized in
  [src/lib/query/keys.ts](src/lib/query/keys.ts). Form Zod schemas in [src/schemas/](src/schemas/).

---

## 3. Implemented Features / Modules (✅)

**Tours & content authoring**
- ✅ **Tours** — CRUD, slug, place/cover media, per-`(language, audience)` translations, publish
  lifecycle (`DRAFT→REVIEW→PUBLISHED→ARCHIVED`), independent content version counters
  (`tourBundleVersion`, `mediaVersion`, `aiKnowledgeVersion`, `routeVersion`). Lifecycle panel + publish
  logic in [tour.publish.ts](src/modules/tour/tour.publish.ts).
- ✅ **Floors** — multi-floor support: each tour can have multiple indoor floors, each with its own
  spots, route, cover image, and translated names. `Floor` model stores floorNo, tourId, optional
  coverMediaId. Enables indoor/multi-level tours (e.g., Colosseum 4 floors). Each floor has
  independent navigation and route; the mobile map uses OpenFreeMap for outdoor GPS (per-floor
  custom indoor tiles are intentionally not wired yet).
- ✅ **Spots** — per-floor points (or per-tour when single-floor tour) with optional lat/lng (Decimal 10,7),
  sort order, quick-tour inclusion, thumbnail, translations (title/short/quill/description/interesting-facts),
  spot FAQs, media. Spot now belongs to Floor (not directly to Tour).
- ✅ **Tour route** — `TourRoute` + ordered `RouteEdge`s (from/to spot). Edge CRUD, **route generation**
  and **footprint generation** endpoints; walking geometry via **OSRM** ([src/lib/routing/osrm.ts](src/lib/routing/osrm.ts)),
  `footprintGeo` JSON stored per edge.
- ✅ **Tour bundles** — signed, versioned offline bundles built from tour+spots+route+media+ai-knowledge.
  Builder [tour-bundle.builder.ts](src/modules/tour-bundle/tour-bundle.builder.ts); canonical-JSON
  checksum + RSA/HMAC signature ([src/lib/bundle/](src/lib/bundle/)). Build / latest / download endpoints.
- ✅ **AI knowledge** — per-tour (optionally per-spot) knowledge entries with translations
  (title/content/keywords), consumed by the mobile assistant knowledge pack.
- ✅ **Media** — upload/list/delete backed by **Cloudflare R2** ([src/lib/storage/](src/lib/storage/),
  `@aws-sdk/client-s3`); `Media` rows referenced across models; `TourMedia` join with type/language/
  audience/thumbnail.

**Hosts (on-site staff)**
- ✅ **Hosts** — per-tour on-site staff a visitor can find: name, role, photo, lat/lng, opening hours
  (`availableFrom`/`availableTo` as bare `"HH:mm"`), `isActive`, sortOrder, translated bios.
  Admin CRUD at `/tours/[tourId]/hosts`; mobile reads a published tour's hosts via
  `/api/v1/app/tours/[tourId]/hosts`. **Inactive hosts are still returned** — the app shows the card
  with an Offline chip and blocks Map/Directions behind a "not active" modal (a deliberate product
  decision, not an oversight).
- ✅ **Host directions** — walking route from the visitor to a host via OSRM
  ([host-directions.service.ts](src/modules/host-directions/host-directions.service.ts)); OSRM failure
  surfaces as **502 ROUTING_UNAVAILABLE**, never a 500.
- ✅ **Availability is venue-local** — `isAvailableNow` is computed against
  `AppReleaseConfig.venueTimezone`, never the server clock (see §8). The mobile app re-derives it on
  device, so the field is a fallback rather than the source of truth.

**Support content**
- ✅ **FAQs** — categories (translated) + FAQs (translated question/answer text+html), answer rendering
  helper [faq.answer.ts](src/modules/faq/faq.answer.ts).
- ✅ **Knowledge articles** — `KNOWLEDGE | INFO_PAGE | LEGAL`, keyed, lifecycle-gated, optional inclusion
  in assistant, translated body html/text.
- ✅ **App content (remote)** — `AppUiString` (translated UI strings) + `AppAsset` (keyed media, optional
  time-of-day) + **`AppReleaseConfig`** singleton (feature flags, versions, maintenance mode, and the
  **tour-reminder cadence** — `reminderOffsetDays` / `reminderHour` / `reminderNudgeEnabled`, pushed to
  the app via remote config). Admin panel
  [app-release-config-panel.tsx](src/app/(dashboard)/app-content/app-release-config-panel.tsx).

**Access, subscriptions & payments**
- ✅ **Tour access** — admin grants access by email to one/more tours, with expiry, ticket count,
  `allowSubscriptionFeatures`, source (`ADMIN | SELF_SERVICE`); revoke; device sessions per grant.
- ✅ **Subscription payments (self-service)** — `SubscriptionPlan` + `DevicePricingTier` +
  `SubscriptionPricingSettings` (singleton) drive pricing; `SubscriptionPurchase` (+ tour join) records
  Stripe checkout. Pricing math [subscription-purchase.pricing.ts](src/modules/subscription-purchase/subscription-purchase.pricing.ts).
  **Stripe** integration ([src/lib/stripe/](src/lib/stripe/)) with webhook at
  [/api/v1/webhooks/stripe](src/app/api/v1/webhooks/stripe/route.ts).
- ✅ **Dashboard device-access analytics** — bar chart + 4 summary cards on `/dashboard` (ADMIN-only,
  same gate as the existing access-grants card) showing `SUM(TourAccess.maxDevices)` bucketed by
  `createdAt`, with a Last 7 Days/30 Days/12 Months/Yearly filter. Pure aggregation over existing
  data, not a new activity-tracking system — see §11 for why "active users" isn't what this measures.
  [tour-access-analytics.util.ts](src/modules/tour-access/tour-access-analytics.util.ts),
  `GET /tour-access/analytics(/summary)`.
- ✅ **Users** — consumer `User` model (name/age/email/phone/password/language/role) + admin CRUD.
- ✅ **Audit log** — `AuditLog` records module/action/entity/prev+new value/ip; service
  [audit.service.ts](src/lib/audit/audit.service.ts); admin viewer.

**Auth & platform**
- ✅ **Staff auth** — **Neon Auth** (`@neondatabase/auth`), server client [auth/server.ts](src/lib/auth/server.ts);
  auth proxy route `/api/auth/[...path]`; login/register/verify-email/forgot/reset pages under `(auth)`;
  `requireStaffSession()` guard + RBAC.
- ✅ **RBAC** — roles `SUPERADMIN > ADMIN > MANAGER` (hierarchy in [auth/rbac.ts](src/lib/auth/rbac.ts));
  route-access rules (`/access` restricted to SUPERADMIN/ADMIN); `auth-gate` / `role-gate` components.
- ✅ **Tour activation (phone + PIN)** — the buyer's way in. Admin sets phone, 4-digit PIN, activation
  date, expiry date and device limit, and sends the phone + PIN by hand; the app posts them to
  `POST /api/v1/app/auth/unlock`, which registers the device and returns a hashed **device session
  token** (so the PIN is never needed again on that device). PIN is bcrypt-hashed; 5 wrong attempts
  lock the account for 15 minutes. Device removal is **admin-only**. Guard chain
  [require-mobile.ts](src/lib/mobile/require-mobile.ts): API key → API-version compat → device session
  → grant window (`activatedAt ≤ now ≤ expiresAt`, status ACTIVE).
- ✅ **Mobile auth (email OTP)** — *legacy*, kept only for grants that carry an email (self-service
  Stripe buyers). It can no longer provision a grant for an unknown email — a grant needs a phone and
  a PIN, which only the admin can set. The mobile app no longer calls it at all.
- ✅ **Mobile OTP email** — via **Resend** ([src/lib/email/](src/lib/email/)).
- ✅ **API versioning / force-update** — `requireCompatibleApiVersion` compares client `x-api-version`
  vs `AppReleaseConfig.apiVersion`; older → **426 UPGRADE_REQUIRED** ([api-version.ts](src/lib/mobile/api-version.ts)).
- ✅ **Neon cold-start resilience** — `withDbRetry` / `isTransientDbError` ([src/lib/prisma-retry.ts](src/lib/prisma-retry.ts))
  applied to `getConfig()`; transient DB failures surface as retryable **503** not 500 (see §8, §7).
- ✅ **Rate limiting** — mobile rate-limit helper [src/lib/mobile/rate-limit.ts](src/lib/mobile/rate-limit.ts).

---

## 4. Database Schema

Prisma schema: [prisma/schema.prisma](prisma/schema.prisma). Postgres via Neon. Migrations in
[prisma/migrations/](prisma/migrations/) (latest: `20260717120000_add_venue_timezone`). Seed:
[prisma/seed.ts](prisma/seed.ts) (`pnpm db:seed` — seeds subscription plans + device tiers).

**Models (grouped):**
- **Content:** `Tour`, `TourTranslation`, `Floor`, `Spot`, `SpotTranslation`, `SpotFaq`, `SpotFaqTranslation`,
  `TourRoute`, `RouteEdge`, `TourMedia`, `AiKnowledge`, `AiKnowledgeTranslation`, `TourBundle`,
  `Place`, `Category`, `Media`.
- **Support content:** `Faq`, `FaqTranslation`, `FaqCategory`, `FaqCategoryTranslation`,
  `KnowledgeArticle`, `KnowledgeArticleTranslation`, `AppUiString`, `AppUiStringTranslation`,
  `AppAsset`, `AppLanguage`, `AppReleaseConfig`.
- **Hosts:** `Host`, `HostTranslation`.
- **Access / auth:** `TourAccess`, `TourAccessTour`, `OtpChallenge`, `DeviceSession`,
  `DeviceRegistration`, `StaffProfile`, `User`.
- **Payments:** `Subscription`, `Plan`, `SubscriptionPlan`, `DevicePricingTier`,
  `SubscriptionPricingSettings`, `SubscriptionPurchase`, `SubscriptionPurchaseTour`.
- **Ops:** `AuditLog`.

**Key enums:** `Role`, `Language(en/es/fr)`, `AudienceType(CHILDREN/ADULTS/STUDENTS/PROFESSORS)`,
`PublishStatus`, `FeatureLifecycle`, `SubscriptionType/Status`, `PlanType`, `BillingCycle`,
`PurchaseStatus`, `TourAccessStatus/Source`, `OtpPurpose`, `Platform(ios/android)`, `TourMediaType`,
`KnowledgeCategory`, `AuditActionType`, `TimeOfDay`.

**Conventions:** cuid ids; most content is translatable per `(language, audience)` with `@@unique`
constraints; singleton rows use `@id @default("singleton")` (`AppReleaseConfig`,
`SubscriptionPricingSettings`); money as `Decimal`; coordinates as `Decimal(10,7)`.

### 4a. Floor Model Structure

**Goal:** Support multi-floor tours (e.g., Colosseum with 4 levels). Each floor has its own map, spots, and route.

```prisma
model Floor {
  id        String   @id @default(cuid())
  tourId    String
  tour      Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  floorNo   Int                      // 1, 2, 3, 4... floor number
  spots     Spot[]
  route     TourRoute?               // One route per floor (optional)
  createdAt DateTime @default(now())
  
  @@unique([tourId, floorNo])        // One floor per floorNo per tour
  @@index([tourId])
}

model Spot {
  id      String   @id @default(cuid())
  floorId String                     // Now references Floor, not Tour directly
  floor   Floor    @relation(fields: [floorId], references: [id], onDelete: Cascade)
  // ... rest of fields same (latitude, longitude, sortOrder, etc.)
  
  @@index([floorId, sortOrder])
}

model TourRoute {
  id        String   @id @default(cuid())
  floorId   String?                  // Now optional: references Floor if floor-specific route
  floor     Floor?   @relation(fields: [floorId], references: [id], onDelete: Cascade)
  edges     RouteEdge[]
  // ...
  
  @@unique([floorId])  // One route per floor max
}
```

**Impact on Subscription:** When user subscribes to a Tour (e.g., Colosseum), they get access to **all floors** automatically. Admin creates one `SubscriptionPurchaseTour` entry per tour; floor separation is transparent to subscription model.

**Mobile App:** When downloading Colosseum, receives all 4 floors' data. User can switch between floors on the map screen, each floor loads its own map, route, and spots.

---

## 5. API Endpoints

Base: `/api/v1`. Response envelope + errors via [src/lib/api/response.ts](src/lib/api/response.ts) /
[errors.ts](src/lib/api/errors.ts). All handlers wrapped in `withErrorHandler`.

**Admin API (staff-only, `requireStaffSession`)** — under `/api/v1`:
- `tours`, `tours/[tourId]`, `tours/[tourId]/lifecycle`
- `tours/[tourId]/floors`(+`[floorId]`) — list/create/update/delete floors for a tour
- `tours/[tourId]/floors/[floorId]/transition-points`(+`[pointId]`) — stairs/lift/ramp links between
  floors of the **same** tour (cross-tour targets are rejected)
- `tours/[tourId]/floors/[floorId]/route`, `.../route/edges`(+`[edgeId]`), `.../route/generate`,
  `.../route/generate-footprints` — **one route per floor**. (The old tour-level `tours/[tourId]/route*`
  endpoints are **gone**; a route has no meaning without a floor.)
- `tours/[tourId]/floors/[floorId]/spots`(+`[spotId]`), `.../spots/[spotId]/faqs`(+`[faqId]`), `.../spots/[spotId]/media`(+`[mediaId]`)
- `tours/[tourId]/route`, `.../route/edges`(+`[edgeId]`), `.../route/generate`, `.../route/generate-footprints`
- `tours/[tourId]/hosts`(+`[hostId]`) — on-site host CRUD
- `tours/[tourId]/ai-knowledge`(+`[knowledgeId]`)
- `tours/[tourId]/bundles/build`, `.../bundles/latest`, `.../bundles/latest/download`
- `media`(+`[id]`), `faqs`(+`[id]`), `faq-categories`(+`[id]`), `knowledge-articles`(+`[id]`)
- `app-assets`(+`[id]`), `app-ui-strings`(+`[id]`), `app-release-config`
- `tour-access`(+`[id]`, `/revoke`, `/sessions`(+`[sessionId]/revoke`), `/analytics`, `/analytics/summary`)
- `subscription-plans`(+`[id]`), `device-pricing-tiers`(+`[id]`), `subscription-pricing-settings`,
  `subscription-purchases`
- `users`(+`[id]`), `staff-profile/me`, `audit-logs`

**Mobile API (public; API key + device session)** — under `/api/v1/app`:
- **`auth/unlock`** — phone + 4-digit PIN → device session token (the buyer's only way in)
- `auth/otp/request`, `auth/otp/verify` (legacy, email-only grants), `auth/devices`
  — **no `auth/device/revoke`**: only the admin frees a device slot
- `catalog/tours`, `tours/[tourId]/download`, `knowledge-pack`, `app-content`, `release-config`, `versions`
- `tours/[tourId]/hosts` — published tour's hosts (inactive included by design)
- `tours/[tourId]/hosts/[hostId]/directions` — OSRM walking route from the visitor
- `me/entitlements`, `subscriptions/config`, `subscriptions/checkout`, `subscriptions/purchases/[id]`

**Webhooks:** `webhooks/stripe`. **Auth proxy:** `/api/auth/[...path]` (Neon Auth).

---

## 6. Integrations & Configuration

| Integration | Purpose | Code | Key env |
|---|---|---|---|
| **Neon Postgres** | Primary DB (serverless) | [prisma.ts](src/lib/prisma.ts) | `DATABASE_URL` |
| **Neon Auth** | Staff authentication | [auth/server.ts](src/lib/auth/server.ts) | `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` |
| **Cloudflare R2** | Media/object storage (S3 API) | [storage/](src/lib/storage/) | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_BUCKET_URL` |
| **Stripe** | Self-service subscription payments | [stripe/](src/lib/stripe/), `webhooks/stripe` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Mobile OTP + transactional email | [email/](src/lib/email/) | `RESEND_API_KEY`, `OTP_EMAIL_FROM` |
| **OSRM** | Walking route/footprint geometry | [routing/osrm.ts](src/lib/routing/osrm.ts) | `OSRM_BASE_URL` (optional) |
| **Mobile API auth** | API-key + session/OTP peppers | [mobile/](src/lib/mobile/) | `MOBILE_API_KEY`, `MOBILE_SESSION_PEPPER`, `MOBILE_OTP_PEPPER` |
| **Bundle signing** | Sign offline tour bundles | [bundle/sign.ts](src/lib/bundle/sign.ts) | `BUNDLE_SIGNING_PRIVATE_KEY` (RSA) **or** `BUNDLE_SIGNING_SECRET` (HMAC) |

Full list in [.env.example](.env.example). `MOBILE_API_KEY` **must match** `EXPO_PUBLIC_MOBILE_API_KEY`
in `aurelia-app`.

**Scripts** ([package.json](package.json)): `dev`, `build` (runs `prisma generate` → `check` → `next build`),
`check` (`typecheck` + `lint`), `db:migrate`, `db:push`, `db:studio`, `db:seed`, `db:generate`.

---

## 7. Known Issues & Limitations (⚠️)

**Open backlog from the 2026-07-20 review** (the four fixed items are in §11):

- ⏳ **Paid mobile content is gated by the shared API key only.** `knowledge-pack`, `tours/[id]/hosts`
  and host `directions` call `requireMobileRequest` (API key + version) rather than
  `requireMobileSession`, unlike `download`, which also checks the grant. The key ships inside the
  mobile binary and is extractable. `catalog`/`release-config`/`app-content` are reachable before
  unlock **by design** — do not change those. **Requires coordination with `aurelia-app`** before
  moving anything to `requireMobileSession`.
- ⚠️ **Rate limiting is per-instance and never evicts.** [rate-limit.ts](src/lib/mobile/rate-limit.ts)
  is a module-level `Map`: on serverless the effective limit is `limit × instances` and resets on
  cold start, and expired buckets are only overwritten if the same key returns, so attacker-chosen
  `deviceId`s grow it without bound. The DB-backed 5-attempt PIN lockout is the real brute-force
  defense — keep it. Needs Redis/Upstash to be meaningful.
- ✅ ~~Every mobile download rebuilds and re-signs the whole bundle.~~ **Fixed 2026-07-20** (§11) —
  artifacts now build after the cache check and the download path no longer forces.
- ⚠️ **`requestOtp` is an email-enumeration oracle** (`mobile-auth.service.ts:293-295`) — throws
  "No tour access found for this email." for unknown emails. Contradicts the deliberate
  same-message design in `unlock` (lines 89-93). Legacy path; `verifyOtp` gets it right.
- ⚠️ **Media MIME type is client-supplied and never sniffed** (`media.controller.ts:29`) — only
  string-matched against an allowlist. The extension no longer follows it (fixed §11), but
  magic-byte validation is still missing. Also, the request body is fully buffered
  (`arrayBuffer()`) *before* the size cap is applied, so concurrent large POSTs can OOM.
- ⏳ **No `error.tsx` / `loading.tsx` / `not-found.tsx` anywhere** (0 across 44 pages) — a render
  throw in any dashboard page hits the default Next error screen with no recovery.
- ✅ ~~No toast system and no `onError` on any mutation; 19 `window.confirm`.~~ **Fixed 2026-07-20**
  (§11) — `sonner` + global `MutationCache`, and a promise-based `useConfirm`.
  ⏳ Remaining: 18 forms still render an inline `submitError` alert *and* now also get a toast for
  the same failure. Decide whether forms keep the inline alert (and opt out of the toast) or move to
  toast-only.
- ⏳ **No structured logging, error reporting, or runtime env validation.** Errors reach stdout via
  `console.*` only; missing env vars fail at first request rather than at boot.
- ⚠️ **`noUncheckedIndexedAccess` is off** — `tsconfig` is otherwise strict. Real unsound spots:
  `tour-route.service.ts:149`, `tour-access.service.ts:83`.
- ⏳ **Dead code:** `role-gate.tsx` (now superseded by `requireStaffRole` + `access/layout.tsx`),
  `placeholder-page.tsx`, `ui/accordion.tsx`, `use-create-user.ts`, `isStaffUser`,
  `validateImageFileFromBuffer`.

- ⏳ **The phone+PIN migration has not been applied to production.** `20260715031500_switch_tour_access_to_phone_pin`
  **deletes every existing TourAccess** (and its device sessions). Rehearsed clean on a Neon branch;
  run `prisma migrate deploy` against production only when you are ready to re-enter buyers by hand.
- ⚠️ **Self-service Stripe checkout is effectively admin-gated now.** Two things changed under it:
  a grant can no longer be auto-provisioned from an unknown email (it needs a phone + PIN only the
  admin can set), and the **mobile app no longer collects an email at checkout** — so
  `POST /subscriptions/checkout` will reject a phone-only buyer with *"An email address is required to
  complete the purchase."* The server side is ready (`checkoutSchema` takes an optional `email`, and a
  paid purchase writes it back onto the grant); the **app's subscribe screen still needs an email
  field** before in-app purchase works for a phone-only buyer. Deliberate, per the "admin sells by
  hand" decision — revisit if self-service selling is wanted again.
- ⚠️ **A 4-digit PIN is weak by construction** — 10,000 combinations. It is defended by bcrypt at rest
  and a 5-attempt / 15-minute per-account lockout online, **not** by the PIN itself. Do not remove the
  lockout, and do not switch `pinHash` to a fast hash.

- ⚠️ **Rehearse schema migrations on a Neon branch, never straight on production.** Neon branches are
  instant copy-on-write clones of the real data:
  `npx neonctl branches create --project-id wild-rice-14250973 --parent production --name <name>`,
  then point `DATABASE_URL` at its connection string
  (`neonctl connection-string <name> --project-id wild-rice-14250973 --role-name neondb_owner --database-name neondb --pooled`),
  run `prisma migrate deploy`, and confirm `prisma migrate diff --from-config-datasource --to-schema
  prisma/schema.prisma` says **"No difference detected"** before touching production. A failed
  migration does **not** roll back cleanly here — the Floor migration half-applied on its first run.
  Delete the branch when done. (Neon project `aurelia` = `wild-rice-14250973`; Postgres 18, so local
  pg_dump 17 cannot dump it.)

- ⚠️ **Neon cold starts / suspension.** Compute scales to zero after idle; first request can fail with
  `XX000 "Control plane request failed"`. Now retried (`withDbRetry`) and surfaced as retryable **503**.
  **Frequent** 500/503s point to a **suspended Neon project (quota/billing)** — check the Neon dashboard,
  not app code.
- ⚠️ **`withDbRetry` coverage is narrow.** Currently applied to `appReleaseRepository.getConfig()`; other
  mobile read endpoints (catalog, tour-detail, download, knowledge-pack) are **not** yet wrapped.
  Note `getVenueTimezone()` goes through `getConfig()`, so the host endpoints inherit the retry.
- ⚠️ **`getConfig()` runs on *every* mobile request** (via `requireCompatibleApiVersion`), so any
  column added to `AppReleaseConfig` becomes a hard dependency of the **entire** mobile API — not just
  the feature that uses it. Adding `venueTimezone` to the schema while the DB lacked the column turned
  every `/api/v1/app/*` endpoint into a 500 (catalog, download, entitlements — all of it), because the
  generated client selects the column explicitly. **Always `migrate deploy` before shipping code that
  touches this model** (expand first, then deploy). Old clients are unaffected by the new column — they
  don't select it — so the migration is always safe to run ahead of the deploy.
- ⏳ **The host feature is not localized.** `HostCard`/`HostStatusChip`/the not-active modal ship
  hardcoded English ("Available now", "Offline", "Directions") while the rest of the app goes through
  `useStrings`. Pre-existing; worth folding into the i18n pass.
- ⚠️ **`Intl` timezone support is not guaranteed on Hermes.** The mobile availability mirror probes for
  it once (`supportsTimezoneFormatting`) and falls back to the server's `isAvailableNow` when missing —
  deliberately **not** to the device clock, which is the bug being fixed. If chips look wrong on device,
  check that probe first.
- ⏳ **API-version gate is permissive.** Clients without `x-api-version` are accepted (Phase-2 rollout);
  tighten once mobile clients all send the header.

---

## 8. Technical Decisions (and why)

- **Prisma client committed under `src/generated/prisma`** — `prisma generate` runs on `postinstall`/
  `prebuild`; import from `@/generated/prisma/client` (not `@prisma/client`). Uses the `PrismaPg` pg
  adapter because Neon serverless is the target.
- **Retry only idempotent DB ops** — `withDbRetry` wraps reads / id-keyed upserts; never non-idempotent
  writes (avoids double execution). Transient blips become **503 + Retry-After**, not 500.
- **Layered modules (controller/service/repository/schema/mapper)** — keeps route handlers thin and
  business logic testable/reusable across admin + mobile surfaces.
- **Canonical-JSON + signature for bundles** — deterministic checksum so the mobile client can verify
  integrity/authenticity offline; RSA preferred, HMAC fallback for dev.
- **Per-`(language, audience)` translations** — content is authored for 3 languages × 4 audiences; unique
  constraints enforce one row per combination.
- **Neon Auth for staff, custom OTP+device-session for mobile** — staff use cookie sessions; mobile uses
  API-key + hashed device-session tokens bound to a `TourAccess` grant.
- **Wall-clock times read against `AppReleaseConfig.venueTimezone`, never a machine clock** — host
  opening hours are bare `"HH:mm"` with no zone attached, so they are meaningless without one. The
  server runs in **UTC on Vercel** and a visitor's phone carries whatever zone they travelled from, so
  neither end may supply it: it has to be admin-editable config.
  [venue-timezone.ts](src/lib/app-release/venue-timezone.ts) owns the only fallback string
  (`DEFAULT_VENUE_TIMEZONE`, matching the DB column default) — do **not** hardcode a zone anywhere in
  business logic. Wall-clock formatting goes through `venueWallClock` (`Intl` + `formatToParts` +
  `hourCycle: "h23"`, so midnight is `"00"`, not `"24"`).
- **The tour list has its own shallow include** (`tourListInclude` + `TourListItemDto`, spot *count*
  only) separate from `tourIncludeRelations`. The deep include has 6 usages, is spread into
  `tourBundleInclude`, and `mapAuditTour`/`mapTourForReadiness` derive their types from `findById`'s
  shape — narrowing the shared one would ripple through all of them.
- **Existence checks use a narrow `select`, never `tourRepository.findById`** — `findById` pulls the
  full content graph (spots, translations, FAQs, media, route edges incl. `footprintGeo`,
  aiKnowledge). Use `tourRepository.existsById` / `findIdBySlug`; `tour-access`'s `assertTours` is
  the reference. (`ai-knowledge.service.ts` and `spot.service.ts` were fixed 2026-07-20.)
- **One include per read shape, added alongside — never narrow a shared one.** `tourIncludeRelations`
  (deep, for readiness/audit/bundle), `tourListInclude` (list rows), `tourDetailInclude`
  (`GET /tours/[id]`). Narrowing the deep one breaks `mapAuditTour`/`mapTourForReadiness`, which
  derive their types from `findById`'s shape, and the bundle builder, which spreads it. Adding a
  sibling costs nothing and keeps them independent.

---

## 9. Do Not Change Without Consideration

- **`@AGENTS.md` import on line 1** — injects the "This is a newer Next.js (16.2)" guardrail; read
  `node_modules/next/dist/docs/` before framework changes.
- **`withDbRetry` stays limited to idempotent operations** — do not wrap arbitrary route handlers or writes.
- **Import Prisma from `@/generated/prisma/*`** — not `@prisma/client`; the generated client is the source.
- **Bundle canonical-JSON / signing** — mobile verifies offline; changing serialization or signature algo
  breaks installed-bundle verification.
- **`MOBILE_API_KEY` ↔ `EXPO_PUBLIC_MOBILE_API_KEY`** must stay in sync across the two repos.
- **Floor model relationship chain** — `Tour → Floor → Spot` is the new structure. Do not bypass Floor
  when querying spots; always validate `spot.floor.tourId == expected tourId`. Breaking this causes
  data leakage across tours.
- **Each floor has its own route and cover** — spots/routes are per-floor; `Floor.coverMediaId` is
  optional and shipped in the v2 bundle as `coverUrl`. The mobile map today uses a shared OpenFreeMap
  style for outdoor GPS; reintroduce a dedicated indoor-tile field only when Colosseum-style floor
  plans are actually rendered.

---

## 10. Testing

Runner: **Vitest 4** (`pnpm test`, `pnpm test:watch`, `pnpm test:coverage`). Config
[vitest.config.ts](vitest.config.ts) — node environment, `src/**/*.test.ts`, v8 coverage scoped to
`src/lib`, `src/modules`, `src/schemas`. Tests are co-located next to source (`*.test.ts`).

**Status:** ✅ **232 tests / 29 files passing**; `pnpm check` clean (0 errors, 1 pre-existing
`exhaustive-deps` warning in `host-form-dialog.tsx`).

⚠️ **The entire HTTP layer is untested** — 71 route handlers, 30 controllers, 21 of 30 modules have
no tests, including `user`, `media`, and all 9 `mobile-*` modules. `vitest.config.ts` includes only
`src/**/*.test.ts`, so **no `.tsx` test can run** even if written. The coverage that exists is
well-chosen pure logic; the gap is precisely the I/O boundary — which is where the 2026-07-20
security bugs lived.
- **Pure logic:** `computePrice` (pricing), `toCanonicalJson`, bundle `sign`/`checksum` (HMAC/RSA/env
  selection), `isTransientDbError` + `withDbRetry` (fake timers), `hashSessionToken`, `slugify`,
  `AppError` subclasses, RBAC (`normalizeStaffRole`/`hasMinimumRole`/`canAccessRoute`), session mapping.
- **Validation:** Zod schemas for mobile-auth (OTP/verify/revoke), tour-access, subscription-purchase.

**Infra for later phases:** [src/test/prisma-mock.ts](src/test/prisma-mock.ts) — typed
`mockDeep<PrismaClient>()` seam (import first in a test to mock `@/lib/prisma`) for **Phase 2** service/
API-handler tests. **Phase 3** adds a `TEST_DATABASE_URL`-gated real-Postgres integration suite. UI/E2E
are **deferred** (Phases 4–5). Full plan: `~/.claude/plans/ask-what-is-use-shiny-cascade.md`.

---

## 11. Changelog

- **2026-07-21** — **Dashboard "Analytics": device-access-granted chart + summary cards.** The admin
  asked for a "daily active users" chart. There is no activity-tracking system anywhere in this
  codebase — no event log; the closest fields (`DeviceSession.lastVerifiedAt`,
  `DeviceRegistration.lastActiveAt`) are overwritten in place, not logged, and several of the
  most-called mobile endpoints (`app-content`, `catalog`, `knowledge-pack`, `release-config`) never
  touch them at all — so a true historical "how many people used the app on day X" cannot be
  computed retroactively. Told this, the admin gave a different, concrete definition instead:
  **for each day, sum `TourAccess.maxDevices` across every grant created that day** — total
  device-seats granted, not distinct usage (e.g. 3 buyers granted 1/10/5 devices same day → 16).
  This is exactly the data already shown per-row on `/access`'s `DeviceSeatMeter` — so this shipped
  as a **pure aggregation over existing data**, no new tracking/schema/migration.
  - **New pure util** [tour-access-analytics.util.ts](src/modules/tour-access/tour-access-analytics.util.ts) —
    UTC calendar-boundary window resolvers (`resolveFixedRangeWindow` for 7d/30d/12m,
    `resolveYearlyWindow` spanning the earliest grant's year through now) + `fillMissingBuckets`
    (zero-fills every day/month/year in range from sparse DB rows, `Intl.DateTimeFormat` pinned to
    `timeZone: "UTC"` so label formatting can't drift with the server's local TZ). Fully unit-tested,
    no Prisma import.
  - **First use of `$queryRaw` in this codebase** — `tourAccessRepository.sumMaxDevicesByBucket` uses
    `date_trunc(${granularity}, "createdAt")` grouped `SUM("maxDevices")::int`. The `::int` cast is
    load-bearing: an uncast `SUM` over an `Int` column comes back as Postgres `bigint` → JS `BigInt`,
    which `NextResponse.json()` throws on serializing the first time any bucket is non-zero. Bucketed
    by `createdAt` (immutable, set once at insert) — deliberately **not** `activatedAt` (admin-editable,
    can be future-dated) or `updatedAt` (touched by unrelated edits like PIN resets).
  - **Two endpoints, not one**: `GET /tour-access/analytics?range=7d|30d|12m|yearly` (chart series) and
    `GET /tour-access/analytics/summary` (today/last7Days/thisMonth/total, always-current). Split so
    flipping the range dropdown doesn't needlessly refetch the 4 summary cards, which don't depend on
    `range`. Both gated `requireStaffRole("ADMIN")`, matching the existing `/tour-access` list route.
  - **Frontend**: new `recharts@2.15.4` dependency — **pinned to v2, not v3**, since v3 pulls in
    `@reduxjs/toolkit`/`immer`/`react-redux` internally for one bar chart; v2 supports React 19 as a
    peer with a much lighter tree. (npm flags 2.x as deprecated upstream in favor of v3 — accepted
    trade-off, revisit if a second chart ever needs v3-only features.) Bar chart, not line — each
    bucket is an independent per-period sum, not a continuously flowing quantity. New
    [device-access-analytics.tsx](src/app/(dashboard)/dashboard/device-access-analytics.tsx) section
    (cards + chart, one shared fetch each via `useTourAccessAnalyticsSummary`/`Series`, not four
    separate fetches); `dashboard-ui.tsx` extracted from `page.tsx` (`STAT_CARD_SHELL`/`SectionHeading`
    were unexported locals, needed by the new section too). Card labels say "device access granted,"
    deliberately not "active users" — the metric doesn't measure usage, and calling it that would
    misstate what's shown.
  - Explicitly avoided repeating the existing `AccessGrantsStatCard` anti-pattern (fetches
    `limit:100` and does client-side `.filter().length`, silently wrong past 100 rows) — the new
    cards use real server-side `aggregate()` calls, correct at any scale.
  - New tests: `tour-access-analytics.util.test.ts` (window/zero-fill boundary cases, incl. a
    Dec→Jan rollover and an off-by-one guard at the exclusive end boundary) +
    `tourAccessAnalyticsQuerySchema` coverage in the existing schema test file. 217→**232 tests**.
    `pnpm check` clean.
  - ⏳ **Not verified in-browser** — confirmed via curl that both new routes correctly 401 without a
    session (auth gate wired correctly), but a full logged-in walkthrough needs a staff ADMIN login
    (Neon Auth) this session didn't have. Typecheck/lint/test are clean; visual verification (chart
    renders, filter switches granularity, tooltip shows exact counts) is still open.

- **2026-07-20** — **Query/payload optimization + admin feedback layer.** Two independent pieces
  of work, both from the same review; no schema changes, no bundle-format changes, no mobile-repo
  coordination needed.
  - **Every mobile download re-signed the bundle — and so did every cached call.** The known issue
    was `mobile-download.service.ts` passing `force: true`; the worse half was that
    `buildTourBundleArtifacts` ran at `tour-bundle.service.ts:54`, **above** the `bundleIsCurrent`
    check at `:56`. So an RSA-SHA256 signature plus three SHA-256 digests were computed on *every*
    call, and the cache only ever saved the DB write. Artifacts now build after the early return;
    `force` is dropped at the download site but **kept as an option** (documented) because it is the
    only way to re-sign after a signing-key rotation. New `tour-bundle.service.test.ts` asserts the
    builder is *not called* on a cache hit — verified by reverting the ordering, which fails that one
    test and passes the rest. Result per unchanged-tour download: 1 signature + 3 digests + 1 UPDATE
    + 1 audit row → **zero**.
  - **`GET /tours/[id]` returned the whole content graph.** Six pages use it; five read only
    `translations` for an `<h1>`, and the edit form reads `id/slug/coverMediaId/coverMedia/
    translations`. New **`tourDetailInclude`** + `findDetailById` + `toTourDetailDto`, mirroring the
    `tourListInclude` precedent. Measured against a copy of production: **143.4 KB → 3.7 KB, a 97.4%
    reduction (39×)**. `tourIncludeRelations` and `findById` are **untouched** — the readiness check,
    the audit snapshots and the bundle builder still need the depth, and the
    `Awaited<ReturnType<typeof findById>>` derivations at `tour.service.ts:20,64` therefore never
    move. ⚠️ **`toTourDto`/`TourDto` must stay as they are** — `tour-bundle.builder.ts:89,133` feeds
    them into the offline bundle, so narrowing them would strip every spot from it.
  - **Existence checks stopped loading the content graph.** `ai-knowledge.service.ts` and
    `spot.service.ts` called `findById` (deep include) to answer "does this row exist", and
    `findBySlug` did the same for `ensureUniqueSlug` on every create/slug-update. New
    `tourRepository.existsById` / `findIdBySlug` (`select: { id: true }`), following the `assertTours`
    precedent; `findBySlug` deleted. Closes the ⚠️ in §8.
  - **`coverMedia` is now `{ id, url }`** in the list and detail includes — the full Media row shipped
    nine columns including `key`, the R2 object key, to render a thumbnail. Client types split into
    `TourDetail` / `TourListItem` / `Tour` (`src/types/tour.ts`) so the hand-written client contract
    stops claiming `spots` on a detail response. **`tourIncludeRelations`'s `coverMedia` deliberately
    left alone** — it flows into checksummed bundle content (§9).
  - **`replaceTourRouteSchema.edges` capped at 200.** `replaceByFloor` validates edges in a
    sequential loop at four queries each (`spotRepository.findById` is itself two round trips whose
    deep include the caller discards). The endpoint has **no caller in this repo** — the "generate
    route" button uses `generateFromSpots`, a 3-query path — so the cap bounds it rather than
    rewriting untested, uncalled code. Comment at the loop records the batching fix if it ever gains
    a caller.
  - **Indexes deliberately NOT added** (`Tour.publishStatus`, `KnowledgeArticle.lifecycle`,
    `User.createdAt`). All `Tour` reads are `findUnique` on `id`/`slug`, already covered by the PK and
    `@unique`; `lifecycle` is a low-cardinality enum defaulting to `ACTIVE`, which a plain B-tree
    would not serve. With one tour in production this is speculative write overhead. Revisit against
    a real slow query.
  - **Admin feedback layer:** `sonner` + a global `MutationCache` (`lib/query/client.ts`) — errors
    toast the API's own message via `getApiErrorMessage`, successes toast `meta.successMessage`
    (added to all 59 mutations; `useUpdateAppReleaseConfig` opts out because that panel autosaves per
    field blur). Previously **0 of 17** mutation hooks had `onError`, so ~14 deletes failed silently
    as unhandled rejections. New `ConfirmDialog` + promise-based `useConfirm` replaced **19
    `window.confirm` and 1 `window.alert`**, and added confirmation to three destructive actions that
    had none (media delete, spot FAQ delete, transition-point delete). The hook is bound as
    `askConfirm`, never `confirm` — the latter shadows the global, so a missing hook call would
    silently fall through to `window.confirm`.
  - **Tests:** 205 → **217** (28 files). `pnpm check` clean apart from the pre-existing
    `exhaustive-deps` warning; `pnpm build` passes.

- **2026-07-20** — **Full-project review + four security fixes.** No new features; outcome of an
  end-to-end review of backend, admin frontend, and tooling. Findings and the remaining backlog are
  in §7; the report itself is not committed.
  - **`/api/v1/users` had no authentication at all.** `users/route.ts` and `users/[id]/route.ts` were
    wrapped only in `withErrorHandler` — no `requireStaffSessionFromRequest`, and there is no
    `middleware.ts` (only `src/proxy.ts`, which skips `/api/`). Verified live: `GET /api/v1/users`
    returned **200** with every consumer's name, age, email, countryCode and phone; `DELETE` removed
    records; `POST` accepted a `role`. **Not** privilege escalation — staff role comes from the Neon
    Auth session (`mapNeonUserToAuthUser`), not the `User` table — but a straight PII leak. Every
    method now guards at both the route and the controller; `delete` needs ADMIN, and assigning
    `role` needs SUPERADMIN. Now **401**. Note the admin UI has *no* users page — `usersService` and
    `useCreateUser` are unused, so this was a dead client with a live open endpoint. Consider
    removing the module if consumer-user admin is not a real feature.
  - **RBAC route rules were never enforced.** `ROUTE_ACCESS_RULES` restricts `/access` to
    SUPERADMIN/ADMIN, but `canAccessRoute` is only called from `proxy.ts:105` — inside
    `if (isProtectedRoute(pathname))`, and `PROTECTED_ROUTE_PREFIXES` is just `["/dashboard"]` — and
    from `role-gate.tsx`, which is **imported nowhere**. `(dashboard)/layout.tsx` and
    `requireStaffSessionFromRequest` both check *staff-ness only*, never role. So a **MANAGER could
    open `/access` by URL and call the tour-access API** — buyer phone numbers, grant creation,
    device-session revocation. `rbac.test.ts:45` asserts MANAGER is denied and passes; the function
    was correct, nothing called it. New **`requireStaffRole(minRole)`** in
    [require-staff.ts](src/lib/api/require-staff.ts) (reuses the previously-unused `hasMinimumRole`)
    now gates all five `/api/v1/tour-access*` routes at ADMIN, plus a server-side
    [access/layout.tsx](src/app/(dashboard)/access/layout.tsx) so the page redirects too. The API is
    the boundary; the layout only spares a MANAGER a page of failed requests.
  - **Mobile API-key check disabled itself off-production.** `requireMobileApiKey` returned early
    when `MOBILE_API_KEY` was unset and `NODE_ENV !== "production"`, so staging/preview/plain
    containers served the whole mobile API unauthenticated. The bypass is now explicit
    (`ALLOW_INSECURE_MOBILE_API=1`), never inferred from `NODE_ENV`. Key comparison moved to
    `timingSafeEqual` over SHA-256 digests — hashing first because `timingSafeEqual` throws on a
    length mismatch and would otherwise leak the configured length.
  - **Session/OTP peppers fell back to constants committed in this repo.** `session-token.ts` used
    `|| "aurelia-dev-pepper"` with no production guard, so a misconfigured deploy hashed every device
    session with a value an attacker can read here — enough to forge tokens from a DB dump. New
    [lib/mobile/pepper.ts](src/lib/mobile/pepper.ts) `requirePepper()` follows the `bundle/sign.ts`
    precedent: dev fallback off production, throw on it. ⚠️ **Confirm `MOBILE_SESSION_PEPPER` and
    `MOBILE_OTP_PEPPER` are set in the production environment before deploying this** — if they are
    unset today, the mobile API will start failing loudly (the safe failure), and *setting* a new
    pepper invalidates every existing device session while device removal is admin-only.
  - **Upload object keys took their extension from the uploaded filename.** `generateObjectKey`
    preferred `path.extname(originalName)` over the validated MIME type, so `payload.html` declared
    as `image/png` was stored as `.html` in a public bucket. Extension now derives from the MIME map
    only. (MIME itself is still client-supplied and unsniffed — magic-byte validation is open, §7.)
  - **Tests:** 183 → **205** (26 files) — `require-staff`, `api-key`, `pepper`, `r2.upload`
    (`generateObjectKey`). `pnpm check` clean apart from the pre-existing `exhaustive-deps` warning.

- **2026-07-17** — **Venue timezone (P0 bug fix) + two list/query perf fixes + host polish.** Outcome of
  a full-project review; no new features.
  - **Host availability was wrong in production.** `computeIsAvailableNow` read `now.getHours()` — the
    *server's* clock, which is UTC on Vercel — against opening hours that are the *venue's* wall clock.
    Proven: same instant, Rome host on 09:00–17:00, at 10:30 Rome the old code answered `false` under
    `TZ=UTC` and `true` under `TZ=Europe/Rome`, so hosts read as offline for the first ~2 summer hours
    of every shift. The old tests hid it by parsing `new Date("2025-01-15T12:00:00")` (**no `Z`**) as
    *local* time, agreeing with themselves in any zone. Fix: new
    **`AppReleaseConfig.venueTimezone`** (`String @default("Europe/Rome")`, in `REMOTE_CONFIG_FIELDS`
    so an edit bumps `remoteConfigVersion`), admin IANA field in the release-config panel (invalid
    zones are refused, not silently defaulted), shipped to mobile under `remote`. New
    [venue-timezone.ts](src/lib/app-release/venue-timezone.ts) owns `DEFAULT_VENUE_TIMEZONE`,
    `isValidTimezone`, `normalizeVenueTimezone`, `venueWallClock`. `computeIsAvailableNow` takes a
    timezone; `toHostDto`/`toHostDtoList` thread it from `appReleaseRepository.getVenueTimezone()`
    (all 9 call sites were already async, across 2 files). Tests rewritten with **absolute `Z`
    timestamps** + explicit zones, and now pass identically under `TZ=UTC`/`Asia/Dhaka`/
    `America/New_York`/`Pacific/Kiritimati` — because they're absolute, not because they're naive.
    Migration `20260717120000_add_venue_timezone` rehearsed on a Neon branch → **"No difference
    detected"** → branch deleted → **applied to production** (prod `migrate diff` also clean, status up
    to date; the singleton row picked up `Europe/Rome` from the column default).
    **Deployment-ordering lesson learned the hard way:** the schema change landed before the migration,
    and because `getConfig()` runs on every mobile request, *every* `/api/v1/app/*` endpoint 500'd
    against the un-migrated DB — not just hosts. Verified fixed end-to-end afterwards: `catalog/tours`
    500 → **200**, and the app's home screen renders its floor cards again. See §7.
  - **`assertTours` N+1 removed** — it looped `tourRepository.findById` (the full deep include: every
    spot, translation, FAQ, media join, route edge with `footprintGeo`, aiKnowledge) once per tour
    purely to check existence. Now one `findMany({ where: { id: { in } }, select: { id: true } })`.
  - **Tour list stopped over-fetching** — `tourService.list` used the same deep include to render a
    cover, title, status, slug and a spot *count*; the list mapper then discarded `route`,
    `transitionPoints` and `aiKnowledge` entirely. New **`tourListInclude`** + `TourListItemDto`
    (`spots: SpotDto[]` → `spotCount: number`, summed from per-floor `_count`), mirroring the pattern
    `mobile-catalog.service.ts` already used. Measured on a copy of production: **88 → 14 joined rows
    for one tour** (the multiplier is per tour per page — 4 spots carry 48 translations at 3 langs × 4
    audiences). `toTourDtoList` deleted (the list was its only caller). The deep include is untouched.
    Note: with **1 tour** in production today the absolute saving is small; this is about how it scales.
  - **Host `update` double-write removed** — it disconnected the photo in its own query and then again
    in the main update; a failure between the two detached the photo with no audit row.
  - **Docs** — `host`/`host-directions`/`mobile-host` were entirely undocumented despite being
    committed; test count was stale (88 → **183**).

- **2026-07-16** — **Reminder cadence is now admin-controlled (remote config).** Extends Reminder v1:
  instead of a hardcoded D-3/D-2/D-1 at 09:00, staff can tune *when* the mobile prep reminders fire.
  `AppReleaseConfig` gained three columns — **`reminderOffsetDays Json @default("[3,2,1]")`** (days
  before the visit each prep reminder fires; **`[]` disables prep reminders**), **`reminderHour Int
  @default(9)`** (local hour 0–23 for reminders + the daily nudge), and **`reminderNudgeEnabled Boolean
  @default(true)`** (the undated daily "set a date" nudge). Migration
  `20260716120000_add_reminder_cadence_config` is additive (three columns with defaults, no backfill);
  **applied to production** (`migrate status` = up to date).
  - **Normalization helper** [lib/app-release/reminder-cadence.ts](src/lib/app-release/reminder-cadence.ts)
    (`normalizeReminderOffsetDays` — dedupe/clamp 0–60/sort desc, empty-array preserved as "off";
    `normalizeReminderHour` clamp 0–23→9; `normalizeReminderNudgeEnabled`) guards the Prisma `Json`
    column so the admin panel and mapper never choke on garbage.
  - **Admin UI** — [app-release-config-panel.tsx](src/app/(dashboard)/app-content/app-release-config-panel.tsx)
    has a **Tour reminders** section: offsets as a comma list (`7, 3, 1`), reminder hour (0–23), and the
    nudge toggle. Zod validation in [app-release-config.schema.ts](src/schemas/app-release-config.schema.ts).
  - **Delivery** — the cadence rides the existing remote-config channel: mapper
    [mobile-release-config.mapper.ts](src/modules/mobile-release-config/mobile-release-config.mapper.ts)
    + types now emit `reminderOffsetDays` / `reminderHour` / `reminderNudgeEnabled`; the app reads them
    from `release-config` and reschedules on change (see mobile CLAUDE.md). `pnpm check` clean; tests green.

- **2026-07-16** — **Per-tour visit date on the access grant (backend foundation for Reminder v1).**
  Groundwork for the mobile "Smart Tour Reminder" feature: each entitled tour can now carry a
  planned visit date + optional start time. `TourAccessTour` gained **`tourDate DateTime?`** (stored
  as **UTC noon** of the calendar day so no timezone can roll it a day off) and **`startTime String?`**
  (`"HH:mm"`, copy-only). Migration `20260716000000_add_tour_access_tour_visit_date` is purely additive
  (two nullable columns, no backfill); **rehearsed on a throwaway Neon branch → `migrate diff` = "No
  difference detected" → applied to production** (prod diff also clean, schema up to date). New shared
  helper [lib/tour-date.ts](src/lib/tour-date.ts) (`tourDateToUtcNoon` / `utcNoonToTourDate` /
  `normalizeStartTime`) with 15 co-located tests. The admin grant API/form moved from a flat
  `tourIds: string[]` to a structured **`tours: [{tourId, tourDate?, startTime?}]`** end-to-end (Zod
  schemas, `tourAccessService` `assertTours`, mapper/DTO `TourAccessTourSummary`, client payload type,
  and [access-form.tsx](src/app/(dashboard)/access/access-form.tsx) — each checked tour reveals a
  **Visit date** + **Start time** input). Both mobile responses now emit `tourDate` (`YYYY-MM-DD`) +
  `startTime` per tour: `/me/entitlements`
  ([mobile-entitlements.service.ts](src/modules/mobile-entitlements/mobile-entitlements.service.ts))
  and `POST /auth/unlock` (+ legacy `verifyOtp`)
  ([mobile-auth.service.ts](src/modules/mobile-auth/mobile-auth.service.ts)). No new mobile write
  endpoint — user-edited dates stay device-local in v1. `pnpm typecheck`/lint clean; **163 tests**
  (155 + 8 new). ⏳ Mobile side (expo-notifications scheduler, set-date modal, visit-checklist screen)
  still to build — plan at `~/.claude/plans/tumi-mobile-app-er-foamy-penguin.md`.

- **2026-07-15** — **Dropped unused `Floor.mapTileUrl` (admin + mobile + DB).** The field was never
  wired into MapLibre (the app uses OpenFreeMap for outdoor GPS), so keeping it in the floor form
  only confused authors. Migration `20260715160000_drop_floor_map_tile_url` drops the nullable
  column; admin floor form/API/DTO/schemas no longer accept it; v2 bundle floors no longer emit it;
  mobile `BundleFloor` and `getMapTileUrlForFloor` are gone. Reintroduce a dedicated indoor-tile
  field only when Colosseum-style floor plans are actually rendered. Existing Floor
  `introduce_floor_model` migration history left intact (column still created there, then dropped).
  Applied to production (`migrate diff` = no drift). `pnpm check` clean; **140 tests**.

- **2026-07-15** — **Floors can carry a cover image (admin upload → bundle → app).** `Floor` gained a
  nullable **`coverMediaId`** (+ `Media.floors` back-relation); migration
  `20260715120000_add_floor_cover_media` is purely additive (nullable column + `ON DELETE SET NULL` FK),
  rehearsed on a Neon branch (no drift) and **applied to production**. The admin floor dialog now has a
  **Cover image** field reusing the FAQ-category pattern (`FormImageUpload` + `resolveMediaUpload`, R2
  upload on save); `FloorDto` returns `coverMediaId` + `coverMedia {id,url}` (never the pinHash-style
  internals). The v2 bundle floors now ship **`coverUrl`** and the **translated floor names** (the
  builder previously loaded translations but dropped them); `tourIncludeRelations.floors` now includes
  `coverMedia`. Shared `ImageUpload`/`FormImageUpload` `existingMedia` prop widened from `Media` to
  `{ url: string }` so a floor's `{id,url}` cover DTO works (full `Media` still assignable). Mobile: the
  `FloorSelector` shows each floor's cover thumbnail + name and is now **wired into the nav screen**
  (multi-floor only). 1 new bundle assertion; `pnpm check` clean, **141 tests**.

- **2026-07-15** — **Tour activation is now phone + 4-digit PIN, not email + OTP.** We never hold the
  buyer's email, so identity moved to the phone number: the admin sets a phone, a 4-digit PIN, an
  activation date, an expiry date and a device limit, then sends the phone + PIN to the buyer by hand
  (SMS/WhatsApp). The app unlocks with those two, and the device is registered against the grant —
  after that the session token carries it, so the PIN is never asked for again.
  - **Schema:** `TourAccess.email` → **`phone` (unique)** + **`pinHash`** (email kept, now *optional*,
    for Stripe receipts only); new `activatedAt`; `ticketCount` → **`maxDevices`** (it always *was* the
    device-seat limit — the name lied); `failedPinAttempts` + `pinLockedUntil` for the lockout.
    Migration `20260715031500_switch_tour_access_to_phone_pin` **deletes existing grants** (email-keyed,
    no PIN to migrate — inventing one would hand out guessable access); device sessions and tour joins
    cascade away, purchases survive with a NULL `tourAccessId`. Rehearsed on a Neon branch until
    `migrate diff` said **no drift** (branch since deleted). ⏳ **Not yet applied to production** —
    awaiting the go-ahead, since it deletes live grants.
  - **Security:** the PIN is hashed with **bcrypt, not sha256** ([lib/mobile/pin.ts](src/lib/mobile/pin.ts)) —
    4 digits is 10,000 combinations, so a fast hash would be reversible in milliseconds from a dumped
    column. Online guessing is stopped by a **per-account lockout: 5 wrong PINs → 15 minutes**, which
    survives a restart and an IP change (the IP rate-limiter alone would not). An unknown phone and a
    wrong PIN return the **same** message, or the endpoint becomes an oracle for which numbers are
    buyers. Grant state (revoked / not yet active / expired / device limit) is only revealed **after**
    the PIN checks out. `requireMobileSession` re-checks the window on every request, so an expiry
    reached mid-session locks the tour without waiting for a new unlock.
  - **Devices:** admin-only removal, per the spec — the self-revoke endpoint `/auth/device/revoke` and
    `mobileAuthService.revokeDevice` are **gone**, because a buyer who can free their own slot can pass
    one grant around indefinitely. Sign-out in the app is now local only.
  - **Phone normalization** ([lib/phone.ts](src/lib/phone.ts)) is shared by admin and unlock: the admin
    types `+880 1712-345678`, the buyer types `+8801712345678`, both must resolve to one grant.
  - **Verified against a real Neon branch**, not just types: correct PIN issues a token; the same device
    re-unlocking does not burn a second seat; the 3rd device on a limit of 2 is refused; 5 wrong PINs
    lock the account; a locked account rejects even the **correct** PIN; a future-dated grant says when
    it opens; an unknown phone is indistinguishable from a wrong PIN. `pnpm check` clean; **140 tests**.
  - ⚠️ **Self-service Stripe checkout is now admin-gated** — see §7.

- **2026-07-14** — **Routes are now genuinely per-floor.** All five route handlers resolved the floor
  with `getFloor1ByTourId()`, so **only floor 1's route was ever reachable** — floors 2+ could not be
  routed at all. Worse, `tour-route.service` derived the tour from `route.tourId`, the deprecated column
  the Floor migration made **nullable**: any route created after the migration has `tourId = NULL`, so
  adding an edge threw *"Floor must belong to a tour"*, and `createEdge` also required the route to
  already exist — meaning **a new floor's first edge could never be created**. The service now derives
  the tour from the **Floor**, upserts the route on the first edge, and takes `(tourId, floorId)`
  throughout, validating the floor belongs to the tour (a floorId from another tour is rejected) and
  that both spots of an edge live on that floor. Route endpoints moved under the floor
  (`/tours/[tourId]/floors/[floorId]/route*`); the tour-level ones are deleted, along with the
  deprecated repository/service methods that threw. Admin UI: the route page has a **floor switcher**
  (with each floor's edge count), scopes the spot picker to the selected floor, and points you at the
  Floors page when the tour has none. 9 new tour-route tests; `pnpm check` now fully clean (the 17
  unused-param warnings went with the deprecated methods); 127 tests passing.

- **2026-07-14** — **Spots can now be assigned to a floor (and moved between floors).** There was no way
  to say which floor a spot belonged to: `createSpotSchema`/`updateSpotSchema` still carried the old
  `floor: z.number()` field for the integer column the Floor migration **dropped** (dead — the service
  never passed it to Prisma), and every spot route handler resolved the floor with
  `getFloor1ByTourId()`. That last part was a real bug: a spot on floor 2 would **404 on edit, delete,
  media, and FAQ** because the handler looked for it on floor 1. Spot handlers now resolve the spot's
  *own* floor via `spotService.getFloorIdForSpot()`; `POST /spots` takes `floorId` in the body (falling
  back to the tour's lowest floor); `PATCH /spots/[spotId]` with a different `floorId` **moves** the
  spot. The target floor is resolved through the tour, so a floorId from another tour is rejected, and
  creating a spot on a tour with no floors now fails with a clear message instead of silently landing
  nowhere. Admin UI: the spot form has a **Floor** select (create: which floor; edit: move it), and
  prompts you to create a floor first if the tour has none. Client `Spot` type corrected
  (`floor: number` → `floorId: string`). 8 new spot-service tests; `pnpm check` clean; 118 tests passing.

- **2026-07-14** — **Floor management is now actually usable (admin UI + API).** The floor feature had
  a UI shell and a service/repository layer but **no HTTP glue** — no `floor.controller.ts`, no
  `floor.schema.ts`, and **no route handlers at all**, so the page called endpoints that did not exist
  and its Add/Edit/Delete buttons had no handlers. Added the missing layers: Zod schemas, controller,
  and route handlers for `tours/[tourId]/floors`(+`[floorId]`) and
  `.../floors/[floorId]/transition-points`(+`[pointId]`). The repository is now tour-scoped
  (`findById(tourId, floorId)`) so a floorId from another tour cannot resolve, `floorNo` collisions
  return **409**, and a transition point may only target another floor **of the same tour** (and never
  itself). Floor translations (name per language × audience) and transition points (STAIRS / ELEVATOR /
  LIFT / RAMP / ESCALATOR) are both editable. Admin UI: reachable from a new **Floors** button on the
  tour list; create/edit dialog with audience × language name tabs, plus a transitions dialog. Also
  extracted the `getApiErrorMessage` helper (was copy-pasted in four dialogs) so API messages like
  "Floor 1 already exists on this tour" reach the user, and removed the `as any` casts from the bundle
  integration test by exporting `BundleContentV1`/`BundleContentV2`. `pnpm check` clean (0 errors);
  110 tests passing.

- **2026-07-14** — **Floor migration applied to production; `/tours` 500 fixed.** The `/api/v1/tours`
  500 was **not** an app bug: `20260714184852_introduce_floor_model` had never been applied, so the
  code queried `tour.floors` against a DB with no `Floor` table (Prisma `P2021 TableDoesNotExist`).
  Rehearsed the migration on a throwaway **Neon branch** first, which caught two defects that would
  have half-applied and wedged production: (1) `DROP CONSTRAINT "TourRoute_tourId_key"` — that is a
  unique *index*, not a constraint, so it must be `DROP INDEX`; (2) the new FKs omitted
  `ON UPDATE CASCADE`, the missing `TourRoute_floorId_key` unique index, the `tourId` `DROP NOT NULL`s,
  and the drop of the superseded `Spot."floor"` column — all of which left schema drift. Migration
  rewritten, re-rehearsed on a fresh branch until `prisma migrate diff` reported **no drift**, then
  applied to production. Production verified: 1 tour → Floor 1, 3 spots + 1 route + 2 edges migrated,
  no orphans, no cross-tour leakage. Also fixed the code left inconsistent with the Floor schema —
  `tourIncludeRelations` (dropped the stale top-level `spots` include), `tour.mapper` /
  `tour.service` / `tour-bundle.builder` (now aggregate spots via `tour.floors`), and added
  `spotRepository.findByTourAndId`. `getFloor1ByTourId` now falls back to the lowest-numbered floor
  instead of hard-filtering `floorNo: 1`. `pnpm typecheck` clean; 106 tests passing.

- **2026-07-14** — **Floor model + multi-floor tour architecture planned.** Designed Floor model
  (`Tour → Floor → Spot`) to support indoor multi-level tours (e.g., Colosseum 4 floors). Each floor
  has its own map, route, and spots. Subscription model unchanged (user gets all floors). Complete
  audit of backend (36 files) and mobile (40 files) impact done. Documented in CLAUDE.md §4a.
  Implementation roadmap: Prisma schema + migration → 36 backend file updates → Admin floor CRUD UI
  → Mobile floor switching UI.

- **2026-07-11** — **Test suite Phase 1** (this repo had zero tests): added Vitest 4 + coverage +
  `vitest-mock-extended`, `vitest.config.ts`, `test`/`test:watch`/`test:coverage` scripts, and the
  `src/test/prisma-mock.ts` seam. Wrote **88 co-located unit tests** covering pricing, bundle canonical-
  JSON/signing, `prisma-retry`, session-token hashing, RBAC, session mapping, error model, slug, and the
  mobile-auth/tour-access/subscription-purchase Zod schemas. `pnpm test` green; `pnpm typecheck` clean.
- **2026-07-11** — Created this backend source-of-truth CLAUDE.md (was a one-line `@AGENTS.md` stub);
  documented architecture, module pattern, full schema, admin + mobile API surface, integrations, and
  known issues. Uncommitted working-tree edits noted in §7.
- **2026-07-08** — Diagnosed intermittent mobile 500s as **Neon serverless cold starts**
  (`XX000 Control plane request failed`); added `withDbRetry` / `isTransientDbError`
  ([prisma-retry.ts](src/lib/prisma-retry.ts)), applied to `getConfig()`, and 503 classification for
  transient DB errors in the API error handler ([handler.ts](src/lib/api/handler.ts)). (Committed as
  `2095cfc`.)
- **2026-07-07** — Added offline-first architecture notes; removed unused SVGs (`07a7cfd`).
- **2026-07-06** — Added **subscription payments** (Stripe checkout, plans, device pricing tiers,
  pricing settings, purchases) and **knowledge base** (knowledge articles) systems (`b221a9b`); mobile
  OTP email via Resend (`4ca7970`).
- **Earlier** — Phase-0 foundation (Prisma schema, domain models), tour/spot authoring, media (R2),
  tour bundles + device sessions, FAQ translations, app release remote config, audience content +
  quick tour. See `prisma/migrations/` and `git log`.
