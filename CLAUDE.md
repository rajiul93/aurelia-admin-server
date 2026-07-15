@AGENTS.md

# Aurelia Admin + Server — Project Source of Truth

> Single source of truth for architecture, implemented features, database schema, API
> endpoints, integrations, and history for the **backend/admin** repo (`admin-and-server-aurelia`).
> **Read this before starting any task; update it after completing any task.** Treat it as the
> project's persistent memory. The mobile client (`aurelia-app`) keeps its own CLAUDE.md.

**Status legend:** ✅ Completed · 🚧 In Progress · ⚠️ Known Issue · ⏳ Pending · ❌ Not Started

Last updated: **2026-07-11**

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
- **Admin modules:** `tour`, `spot`, `tour-route`, `tour-bundle`, `tour-access`, `media`, `faq`,
  `faq-category`, `knowledge-article`, `ai-knowledge`, `app-asset`, `app-ui-string`, `audit-log`,
  `device-pricing-tier`, `subscription-plan`, `subscription-purchase`, `staff-profile`, `user`.
- **Mobile modules:** `mobile-auth`, `mobile-catalog`, `mobile-download`, `mobile-entitlements`,
  `mobile-knowledge`, `mobile-app-content`, `mobile-release-config`, `mobile-versions`.
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
- ✅ **Floors** — multi-floor support: each tour can have multiple indoor floors, each with its own map
  and set of spots. `Floor` model stores floorNo, tourId, optional mapTileUrl. Enables indoor/multi-level
  tours (e.g., Colosseum 4 floors). Each floor has independent navigation, route, and offline map.
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

**Support content**
- ✅ **FAQs** — categories (translated) + FAQs (translated question/answer text+html), answer rendering
  helper [faq.answer.ts](src/modules/faq/faq.answer.ts).
- ✅ **Knowledge articles** — `KNOWLEDGE | INFO_PAGE | LEGAL`, keyed, lifecycle-gated, optional inclusion
  in assistant, translated body html/text.
- ✅ **App content (remote)** — `AppUiString` (translated UI strings) + `AppAsset` (keyed media, optional
  time-of-day) + **`AppReleaseConfig`** singleton (feature flags, versions, maintenance mode). Admin panel
  [app-release-config-panel.tsx](src/app/(dashboard)/app-content/app-release-config-panel.tsx).

**Access, subscriptions & payments**
- ✅ **Tour access** — admin grants access by email to one/more tours, with expiry, ticket count,
  `allowSubscriptionFeatures`, source (`ADMIN | SELF_SERVICE`); revoke; device sessions per grant.
- ✅ **Subscription payments (self-service)** — `SubscriptionPlan` + `DevicePricingTier` +
  `SubscriptionPricingSettings` (singleton) drive pricing; `SubscriptionPurchase` (+ tour join) records
  Stripe checkout. Pricing math [subscription-purchase.pricing.ts](src/modules/subscription-purchase/subscription-purchase.pricing.ts).
  **Stripe** integration ([src/lib/stripe/](src/lib/stripe/)) with webhook at
  [/api/v1/webhooks/stripe](src/app/api/v1/webhooks/stripe/route.ts).
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
[prisma/migrations/](prisma/migrations/) (latest: `20260706182045_add_knowledge_articles`). Seed:
[prisma/seed.ts](prisma/seed.ts) (`pnpm db:seed` — seeds subscription plans + device tiers).

**Models (grouped):**
- **Content:** `Tour`, `TourTranslation`, `Floor`, `Spot`, `SpotTranslation`, `SpotFaq`, `SpotFaqTranslation`,
  `TourRoute`, `RouteEdge`, `TourMedia`, `AiKnowledge`, `AiKnowledgeTranslation`, `TourBundle`,
  `Place`, `Category`, `Media`.
- **Support content:** `Faq`, `FaqTranslation`, `FaqCategory`, `FaqCategoryTranslation`,
  `KnowledgeArticle`, `KnowledgeArticleTranslation`, `AppUiString`, `AppUiStringTranslation`,
  `AppAsset`, `AppLanguage`, `AppReleaseConfig`.
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
  mapTileUrl String?                 // Optional: custom map tile URL per floor
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
- `tours/[tourId]/ai-knowledge`(+`[knowledgeId]`)
- `tours/[tourId]/bundles/build`, `.../bundles/latest`, `.../bundles/latest/download`
- `media`(+`[id]`), `faqs`(+`[id]`), `faq-categories`(+`[id]`), `knowledge-articles`(+`[id]`)
- `app-assets`(+`[id]`), `app-ui-strings`(+`[id]`), `app-release-config`
- `tour-access`(+`[id]`, `/revoke`, `/sessions`(+`[sessionId]/revoke`))
- `subscription-plans`(+`[id]`), `device-pricing-tiers`(+`[id]`), `subscription-pricing-settings`,
  `subscription-purchases`
- `users`(+`[id]`), `staff-profile/me`, `audit-logs`

**Mobile API (public; API key + device session)** — under `/api/v1/app`:
- **`auth/unlock`** — phone + 4-digit PIN → device session token (the buyer's only way in)
- `auth/otp/request`, `auth/otp/verify` (legacy, email-only grants), `auth/devices`
  — **no `auth/device/revoke`**: only the admin frees a device slot
- `catalog/tours`, `tours/[tourId]/download`, `knowledge-pack`, `app-content`, `release-config`, `versions`
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
- ⚠️ **Working tree uncommitted.** As of last update, edits to `route-map-preview.tsx`, `tourList.tsx`,
  `globals.css`, `card.tsx`, `send-otp-email.ts` are present but **not committed** (see `git status`).
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
- **Each floor gets its own map** — `Floor.mapTileUrl` is per-floor. Bundle building must include all
  floors' maps for Colosseum; mobile switches between floor-specific maps when user selects floor.

---

## 10. Testing

Runner: **Vitest 4** (`pnpm test`, `pnpm test:watch`, `pnpm test:coverage`). Config
[vitest.config.ts](vitest.config.ts) — node environment, `src/**/*.test.ts`, v8 coverage scoped to
`src/lib`, `src/modules`, `src/schemas`. Tests are co-located next to source (`*.test.ts`).

**Status (Phase 1 — critical pure logic + business rules):** ✅ **88 tests / 12 files passing**;
`tsc --noEmit` clean.
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
