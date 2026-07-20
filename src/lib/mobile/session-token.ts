import { createHash, randomBytes } from "crypto";
import { requirePepper } from "./pepper";

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  const pepper = requirePepper("MOBILE_SESSION_PEPPER", "aurelia-dev-pepper");
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}
