import crypto from "crypto";

export function makeCode(length = 10) {
  return crypto.randomBytes(16).toString("hex").slice(0, length).toUpperCase();
}

export function makePassToken() {
  return crypto.randomBytes(24).toString("hex");
}