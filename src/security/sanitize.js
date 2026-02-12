// src/security/sanitize.js
import DOMPurify from "dompurify";

export function sanitizeText(input) {
  if (typeof window === "undefined") return String(input ?? "").trim();

  return DOMPurify.sanitize(String(input ?? ""), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}
