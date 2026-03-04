/**
 * Icon utilities - convert Lucide icons to colorized SVG strings for storage.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";

/** Render a Lucide icon to SVG string with theme color applied */
export function iconToSvgString(
  IconComponent: LucideIcon,
  hexColor: string,
  size = 24
): string {
  const markup = renderToStaticMarkup(
    createElement(IconComponent, {
      color: hexColor,
      size,
      strokeWidth: 2,
    })
  );
  return markup;
}

/** Make stored SVG scale to fill its container (for canvas rendering) */
export function svgToResponsive(svg: string): string {
  return svg
    .replace(/\bwidth="24"/, 'width="100%"')
    .replace(/\bheight="24"/, 'height="100%"')
    .replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
}
