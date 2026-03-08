import { apiFetch } from './client'

// Session ID — memory only, resets on page refresh (intentional)
function getSessionId() {
  if (!window.__veloxSessionId) {
    window.__veloxSessionId = crypto.randomUUID()
  }
  return window.__veloxSessionId
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

/**
 * Submit feedback entry. Fire-and-forget — never throws, never blocks UI.
 */
export function submitFeedback(payload) {
  apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      session_id: getSessionId(),
      app_version: APP_VERSION,
    }),
  }).catch(() => {/* silently ignore */})
}

/**
 * Record that a survey was answered/dismissed (prevents re-showing).
 */
export function recordSurveyState(triggerKey, status) {
  return apiFetch('/api/feedback/survey-state', {
    method: 'POST',
    body: JSON.stringify({ trigger_key: triggerKey, status }),
  }).catch(() => {})
}

/**
 * Fetch the list of surveys this user has already answered/dismissed.
 * Returns [] on error so the app stays functional.
 */
export async function getSurveyState() {
  try {
    const data = await apiFetch('/api/feedback/survey-state')
    return data?.completed ?? []
  } catch {
    return []
  }
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export const getFeedbackList = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ).toString()
  return apiFetch(`/api/admin/feedback${qs ? '?' + qs : ''}`)
}

export const getFeedbackStats = (days = 30) =>
  apiFetch(`/api/admin/feedback/stats?days=${days}`)

export const updateFeedbackEntry = (id, payload) =>
  apiFetch(`/api/admin/feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
