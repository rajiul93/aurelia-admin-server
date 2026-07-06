import { createHash, createHmac, createSign } from "crypto";
import { toCanonicalJson } from "./canonical-json";

export function sha256Hex(input: string | Buffer) {
  return createHash("sha256").update(input).digest("hex");
}

export function checksumJson(value: unknown) {
  return sha256Hex(toCanonicalJson(value));
}

export type BundleSignature = {
  algorithm: "RSA-SHA256" | "HMAC-SHA256";
  signature: string;
};

function normalizePem(value: string) {
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

export function signCanonicalPayload(canonicalJson: string): BundleSignature {
  const privateKeyPem = process.env.BUNDLE_SIGNING_PRIVATE_KEY?.trim();

  if (privateKeyPem) {
    const signer = createSign("RSA-SHA256");
    signer.update(canonicalJson);
    signer.end();

    return {
      algorithm: "RSA-SHA256",
      signature: signer.sign(normalizePem(privateKeyPem), "base64"),
    };
  }

  const secret = process.env.BUNDLE_SIGNING_SECRET?.trim();
  if (secret) {
    return {
      algorithm: "HMAC-SHA256",
      signature: createHmac("sha256", secret)
        .update(canonicalJson)
        .digest("base64"),
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      algorithm: "HMAC-SHA256",
      signature: createHmac("sha256", "aurelia-dev-bundle-secret")
        .update(canonicalJson)
        .digest("base64"),
    };
  }

  throw new Error(
    "Bundle signing is not configured. Set BUNDLE_SIGNING_PRIVATE_KEY or BUNDLE_SIGNING_SECRET.",
  );
}

export function signManifestBody(body: Record<string, unknown>): BundleSignature {
  return signCanonicalPayload(toCanonicalJson(body));
}
