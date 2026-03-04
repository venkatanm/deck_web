/**
 * Vector Converter - SVG to EMF with PNG fallback.
 * Uses Inkscape CLI when available; falls back to sharp (PNG) on failure.
 */

import { spawn } from "child_process";
import { mkdtemp, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import sharp from "sharp";

export interface ConvertSvgOptions {
  /** Target width in pixels (96 DPI). Scales SVG to fit. */
  width?: number;
  /** Target height in pixels (96 DPI). Scales SVG to fit. */
  height?: number;
}

const DEFAULT_SIZE = 96; // 1 inch at 96 DPI

/**
 * Scale SVG string to target dimensions by modifying root <svg> attributes.
 */
function scaleSvg(svgString: string, width?: number, height?: number): string {
  const w = width ?? DEFAULT_SIZE;
  const h = height ?? DEFAULT_SIZE;

  return svgString
    .replace(/\bwidth="[^"]*"/, `width="${w}"`)
    .replace(/\bheight="[^"]*"/, `height="${h}"`)
    .replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
}

/**
 * Convert SVG string to EMF binary buffer.
 * Primary: Inkscape CLI (when installed).
 * Fallback: sharp → high-resolution transparent PNG on EMF failure.
 *
 * @param svgString - Raw SVG markup
 * @param options - Optional width/height for scaling (schema bounding box)
 * @returns EMF Buffer, or PNG Buffer if EMF conversion fails
 */
export async function convertSvgToEmf(
  svgString: string,
  options?: ConvertSvgOptions
): Promise<Buffer> {
  const scaledSvg = scaleSvg(
    svgString,
    options?.width,
    options?.height
  );

  try {
    const emfBuffer = await convertViaInkscape(scaledSvg);
    return emfBuffer;
  } catch {
    return fallbackToPng(scaledSvg, options?.width, options?.height);
  }
}

/**
 * Attempt EMF conversion via Inkscape CLI.
 * Inkscape 1.0+: inkscape input.svg --export-filename output.emf --export-type=emf
 * Note: EMF export is Windows-only in Inkscape; on Linux/macOS this will fail and fallback to PNG.
 */
async function convertViaInkscape(svgString: string): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), "svg2emf-"));
  const svgPath = join(tmpDir, "input.svg");
  const emfPath = join(tmpDir, "output.emf");

  try {
    await writeFile(svgPath, svgString, "utf-8");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("inkscape", [
        svgPath,
        "--export-filename",
        emfPath,
        "--export-type=emf",
      ], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      proc.stderr?.on("data", (chunk) => { stderr += chunk; });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Inkscape exited ${code}: ${stderr}`));
      });

      proc.on("error", (err) => reject(err));
    });

    const buffer = await readFile(emfPath);
    return buffer;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Fallback: render SVG to high-resolution transparent PNG via sharp.
 * Used when Inkscape is unavailable or SVG is malformed for EMF export.
 */
async function fallbackToPng(
  svgString: string,
  width?: number,
  height?: number
): Promise<Buffer> {
  const w = width ?? DEFAULT_SIZE;
  const h = height ?? DEFAULT_SIZE;
  const scale = 2; // High-resolution output for crisp raster fallback

  return sharp(Buffer.from(svgString, "utf-8"))
    .resize(Math.round(w * scale), Math.round(h * scale))
    .png()
    .toBuffer();
}
