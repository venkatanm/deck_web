/**
 * XML Sanitizer - Escape special characters and strip control chars.
 * Run all text from Universal Schema content properties through this
 * before passing to PptxGenJS or any XML builder.
 */

/**
 * Sanitize text for safe XML/OpenXML output.
 * - Escapes: & → &amp;, < → &lt;, > → &gt;, " → &quot;, ' → &apos;
 * - Strips non-printable ASCII control chars (0x00-0x1F except tab 0x09, newline 0x0A, CR 0x0D)
 * - Strips DEL (0x7F)
 * - Strips Unicode control/invisible chars (e.g. zero-width space U+200B, zero-width joiner U+200D)
 */
export function sanitizeXmlString(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}
