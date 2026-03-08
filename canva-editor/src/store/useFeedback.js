import { create } from 'zustand'
import { submitFeedback, recordSurveyState, getSurveyState } from '../api/feedback'

// Survey cool-down: don't show another survey within 7 days of the last one
const SURVEY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

// Auto-dismiss delay (ms) — component uses this to start its timer
export const SURVEY_AUTO_DISMISS_MS = 12_000

export const SURVEY_CONFIG = {
  first_export: {
    trigger:           'first_export',
    question:          'How was your first export?',
    inputType:         'emoji',
    options:           ['😕', '😐', '🙂', '😊', '🤩'],
    optionLabels:      ['Poor', 'Okay', 'Good', 'Great', 'Excellent'],
    followUpLabel:     'Anything we should improve?',
    followUpCondition: 'always',
    delayMs:           800,
  },
  doc_to_deck: {
    trigger:           'doc_to_deck',
    question:          'How accurate was the AI conversion?',
    inputType:         'stars',
    followUpLabel:     "What was off?",
    followUpCondition: 'low_score',
    delayMs:           1200,
  },
  brand_kit_save: {
    trigger:           'brand_kit_save',
    question:          'Was the Brand Kit setup straightforward?',
    inputType:         'emoji',
    options:           ['😕', '😐', '🙂', '😊', '🤩'],
    optionLabels:      ['Very hard', 'Hard', 'Okay', 'Easy', 'Very easy'],
    followUpLabel:     'What would have made it easier?',
    followUpCondition: 'low_score',
    delayMs:           600,
  },
  nps: {
    trigger:           'nps',
    question:          'How likely are you to recommend Velox Decks to a colleague?',
    inputType:         'nps',
    followUpLabel:     "What's the main reason for your score?",
    followUpCondition: 'always',
    delayMs:           0,
  },
}

const useFeedback = create((set, get) => ({
  // Which surveys this user has completed (trigger → status)
  completedTriggers: {},
  // The currently active survey trigger key, or null
  activeSurvey: null,
  // Timestamp when the last survey was shown (for cooldown)
  lastSurveyShownAt: null,
  // Whether survey state has been loaded from the API
  surveyStateLoaded: false,

  /** Load completed surveys from API — call once on app mount */
  loadSurveyState: async () => {
    const completed = await getSurveyState()
    const map = Object.fromEntries(completed.map(c => [c.trigger, c.status]))
    set({ completedTriggers: map, surveyStateLoaded: true })
  },

  /**
   * Attempt to show a survey.
   * Guards: already done, another showing, cooldown, isDirty, modal open.
   * context: { isDirty, isModalOpen, delayMs?, pageContext?, deckId? }
   */
  triggerSurvey: (trigger, context = {}) => {
    const state = get()
    if (!state.surveyStateLoaded)              return
    if (state.completedTriggers[trigger])      return
    if (state.activeSurvey !== null)           return
    if (context.isDirty)                       return
    if (context.isModalOpen)                   return
    if (state.lastSurveyShownAt &&
        Date.now() - state.lastSurveyShownAt < SURVEY_COOLDOWN_MS) return

    const cfg = SURVEY_CONFIG[trigger]
    if (!cfg) return

    const delay = context.delayMs ?? cfg.delayMs ?? 800
    setTimeout(() => {
      // Re-check guards after delay (state may have changed)
      const s = get()
      if (s.completedTriggers[trigger]) return
      if (s.activeSurvey !== null)      return
      set({ activeSurvey: trigger, lastSurveyShownAt: Date.now() })
    }, delay)
  },

  /** Dismiss without submitting (manual or auto) */
  dismissSurvey: (trigger, status = 'dismissed') => {
    set(s => ({
      activeSurvey: null,
      completedTriggers: { ...s.completedTriggers, [trigger]: status },
    }))
    recordSurveyState(trigger, status)
    // No feedback entry — dismissed = no data
  },

  /** Submit a survey answer + close the toast */
  submitSurvey: (trigger, data) => {
    // Optimistically close first — never block UI
    set(s => ({
      activeSurvey: null,
      completedTriggers: { ...s.completedTriggers, [trigger]: 'answered' },
    }))
    recordSurveyState(trigger, 'answered')
    submitFeedback({
      type:            'survey',
      survey_trigger:  trigger,
      rating:          data.rating,
      primary_answer:  data.primaryAnswer,
      follow_up_text:  data.followUpText ?? null,
      page_context:    data.pageContext ?? null,
      deck_id:         data.deckId ?? null,
    })
  },

  /** Submit free-text feedback from the button */
  submitButtonFeedback: (text, context = {}) => {
    submitFeedback({
      type:           'button',
      primary_answer: text,
      page_context:   context.pageContext ?? null,
      deck_id:        context.deckId ?? null,
    })
  },
}))

export default useFeedback
