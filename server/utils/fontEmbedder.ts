/**
 * Font Embedder - Injects .TTF/.OTF binaries into an existing PPTX zip.
 * PowerPoint uses application/x-fontdata for TTF/OTF (not obfuscated like Word).
 * Full p:embeddedFontLst XML injection requires additional presentation.xml patching.
 */

import type JSZip from "jszip";
import { fetchFontBuffer } from "./fontExtractor";

export interface FontToEmbed {
  typeface: string;
  url: string;
  role: "regular" | "bold" | "italic" | "boldItalic";
}

/**
 * Inject font binaries into an existing PPTX zip.
 * Modifies the zip in place. Registers font content types.
 */
export async function injectFontsIntoZip(
  zip: JSZip,
  fonts: FontToEmbed[]
): Promise<void> {
  if (fonts.length === 0) return;

  const fontBuffers: { typeface: string; role: string; buf: Buffer }[] = [];

  for (const f of fonts) {
    const buf = await fetchFontBuffer(f.url);
    if (buf) fontBuffers.push({ typeface: f.typeface, role: f.role, buf });
  }

  if (fontBuffers.length === 0) return;

  for (let i = 0; i < fontBuffers.length; i++) {
    const { buf } = fontBuffers[i];
    const ext = buf[0] === 0x4f && buf[1] === 0x54 ? "otf" : "ttf";
    zip.file(`ppt/fonts/font${i + 1}.${ext}`, buf);
  }

  const contentTypes = await zip.file("[Content_Types].xml")?.async("string");
  if (contentTypes) {
    const defaults: string[] = [];
    if (!contentTypes.includes('Extension="ttf"')) {
      defaults.push('<Default Extension="ttf" ContentType="application/x-fontdata"/>');
    }
    if (!contentTypes.includes('Extension="otf"')) {
      defaults.push('<Default Extension="otf" ContentType="application/x-fontdata"/>');
    }
    if (defaults.length > 0) {
      const inserted = contentTypes.replace(
        "<Default Extension=\"gif\" ContentType=\"image/gif\"/>",
        `${defaults.join("")}<Default Extension="gif" ContentType="image/gif"/>`
      );
      zip.file("[Content_Types].xml", inserted);
    }
  }
}
