-- Tour access moves from email + emailed OTP to phone number + a 4-digit PIN the
-- admin sets and delivers by hand. We never hold the buyer's email any more, so
-- `email` becomes optional (self-service Stripe checkout still fills it in).
--
-- Existing grants cannot be carried across: they are keyed by email and have no
-- PIN to migrate, and inventing one would silently hand out guessable access. So
-- they are deleted and the admin re-creates buyers with a phone + PIN. Device
-- sessions and the tour join rows cascade away with them; purchase history and
-- device registrations survive with a NULL tourAccessId (ON DELETE SET NULL).
DELETE FROM "TourAccess";

-- The table is empty now, so NOT NULL without a default is safe.
ALTER TABLE "TourAccess" ADD COLUMN "phone" TEXT NOT NULL;
ALTER TABLE "TourAccess" ADD COLUMN "pinHash" TEXT NOT NULL;

-- Access opens on activatedAt and closes on expiresAt.
ALTER TABLE "TourAccess" ADD COLUMN "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Brute-force guard: 4 digits is only 10,000 combinations.
ALTER TABLE "TourAccess" ADD COLUMN "failedPinAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TourAccess" ADD COLUMN "pinLockedUntil" TIMESTAMP(3);

ALTER TABLE "TourAccess" ALTER COLUMN "email" DROP NOT NULL;

-- ticketCount always gated concurrent device sessions; the name said otherwise.
ALTER TABLE "TourAccess" RENAME COLUMN "ticketCount" TO "maxDevices";

-- One grant per phone number: the phone is the buyer's identity.
CREATE UNIQUE INDEX "TourAccess_phone_key" ON "TourAccess"("phone");
