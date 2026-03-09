/**
 * Turns raw pipeline error detail into a user-facing message.
 * TaskGroup / sub-exception errors come from the doc-to-deck service (asyncio);
 * we show a friendly line and append the raw detail for support.
 */
export function formatPipelineError(detail) {
  const raw = typeof detail === "string" ? detail : detail ? String(detail) : "";
  const isTaskGroup = /TaskGroup|sub-exception|unhandled\s+errors/i.test(raw);
  const friendly = isTaskGroup
    ? "The AI pipeline hit an internal error. Check that the doc-to-deck service is running and that API keys (e.g. GEMINI_API_KEY) are set."
    : raw.trim() || "Pipeline error.";
  return raw.trim() ? `${friendly}\n\nDetails: ${raw}` : friendly;
}
