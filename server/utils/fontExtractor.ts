/**
 * Font Extractor - Downloads or reads .TTF/.OTF binaries for OpenXML embedding.
 * Used by the export pipeline to bundle fonts into the PPTX archive.
 */

import { SAFE_EXPORT_FONTS } from "../../shared/schema/PresentationSchema.ts";

export type SafeFont = (typeof SAFE_EXPORT_FONTS)[number];

/** Get the best safe fallback for a font (Calibri for both) */
export function getSafeFallback(_role: "headFont" | "bodyFont"): SafeFont {
  return "Calibri";
}

/**
 * Download or fetch the raw .TTF/.OTF binary buffer from a URL.
 * Returns null if fetch fails or content is not a valid font.
 */
export async function fetchFontBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4) return null;
    // TTF magic: 0x00010000 or 'true' (OTF)
    const magic = buf.readUInt32BE(0);
    if (magic === 0x00010000 || magic === 0x74727565) return buf;
    // Also accept 'OTTO' (OpenType CFF)
    if (buf[0] === 0x4f && buf[1] === 0x54 && buf[2] === 0x54 && buf[3] === 0x4f) return buf;
    return null;
  } catch {
    return null;
  }
}
