/**
 * useThemeVariables - Injects CSS custom properties from the presentation theme
 * into a style object. Apply to the root SlideCanvas wrapper so all child elements
 * can use var(--theme-accent1), var(--theme-dk1), etc.
 */

import { useMemo } from "react";
import { usePresentationStore } from "../store/usePresentationStore";

const THEME_SLOTS = [
  "dk1",
  "lt1",
  "dk2",
  "lt2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
] as const;

export function useThemeVariables(): React.CSSProperties {
  const theme = usePresentationStore((s) => s.presentation.theme);

  return useMemo(() => {
    const vars: Record<string, string> = {};
    for (const slot of THEME_SLOTS) {
      vars[`--theme-${slot}`] = theme.colorScheme[slot];
    }
    vars["--theme-headFont"] = theme.fontScheme.headFont;
    vars["--theme-bodyFont"] = theme.fontScheme.bodyFont;

    return vars as React.CSSProperties;
  }, [theme]);
}
