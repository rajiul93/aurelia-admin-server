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
- ✅ **Mobile auth (OTP)** — email OTP sign-in tied to a `TourAccess`: request/verify OTP → issues a
  hashed **device session token**; device registration + revoke. Guard chain
  [require-mobile.ts](src/lib/mobile/require-mobile.ts): API key → API-version compat → device session.
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
- `auth/otp/request`, `auth/otp/verify`, `auth/devices`, `auth/device/revoke`
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

- **2026-07-14** — **Floor model + multi-floor tour architecture planned.** Designed Floor model
  (`Tour → Floor → Spot`) to support indoor multi-level tours (e.g., Colosseum 4 floors). Each floor
  has its own map, route, and spots. Subscription model unchanged (user gets all floors). Complete
  audit of backend (36 files) and mobile (40 files) impact done. Documented in CLAUDE.md §4a.
  Implementation roadmap: Prisma schema + migration → 36 backend file updates → Admin floor CRUD UI
  → Mobile floor switching UI. ⏳ Implementation pending.

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
