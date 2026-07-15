import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * A 4-digit PIN is only 10,000 combinations, so a fast hash (sha256, like the
 * OTP codes use) would be reversible in milliseconds if the database ever
 * leaked. bcrypt is deliberately slow, which is the only thing standing between
 * a dumped `pinHash` column and every buyer's PIN. The online guess path is
 * handled separately by the per-account lockout in mobile-auth.service.
 */
export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}
