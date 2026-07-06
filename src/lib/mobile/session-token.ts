import { createHash, randomBytes } from "crypto";

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  const pepper = process.env.MOBILE_SESSION_PEPPER?.trim() || "aurelia-dev-pepper";
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}
