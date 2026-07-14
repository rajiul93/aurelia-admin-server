/**
 * Bundle format version negotiation for mobile clients
 * Handles backward compatibility with older mobile apps
 */

export type BundleFormatVersion = "1" | "2";

/**
 * Get appropriate bundle format version for a mobile client
 * @param clientApiVersion - Client's API version (e.g., "1.0.0")
 * @returns Recommended bundle format version ("1" or "2")
 *
 * Version matrix:
 * - API v1.0.0 - v1.1.x → Bundle v1 (flat routes)
 * - API v1.2.0+  → Bundle v2 (per-floor routes)
 */
export function getBundleFormatVersion(clientApiVersion?: string): BundleFormatVersion {
  if (!clientApiVersion) {
    return "2"; // Default to latest for unknown clients
  }

  const parts = clientApiVersion.split(".");
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1] || "0", 10);

  // v1.2.0+ supports v2 bundle format
  if (major > 1 || (major === 1 && minor >= 2)) {
    return "2";
  }

  // v1.0.x and v1.1.x need v1 bundle format
  return "1";
}

/**
 * Check if a bundle format version is supported by a client
 */
export function isFormatVersionSupported(clientApiVersion: string, bundleFormatVersion: BundleFormatVersion): boolean {
  const supported = getBundleFormatVersion(clientApiVersion);
  return bundleFormatVersion <= supported;
}

/**
 * Get all supported bundle format versions
 */
export function getSupportedBundleVersions(): BundleFormatVersion[] {
  return ["1", "2"];
}
