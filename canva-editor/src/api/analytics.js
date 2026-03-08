import { apiFetch } from './client'

/**
 * Fire-and-forget event tracking. Never throws — analytics must never break the UI.
 * @param {string} name  - event name e.g. "project.saved"
 * @param {object} props - optional metadata e.g. { format: "pptx", slideCount: 12 }
 */
export function track(name, props = {}) {
  apiFetch('/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ name, properties: props }),
  }).catch(() => {/* silently ignore */})
}

export const getAnalyticsStats = () => apiFetch('/api/analytics/stats')
