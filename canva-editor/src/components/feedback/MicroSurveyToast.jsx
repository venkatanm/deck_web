import { useState, useEffect, useRef } from 'react'
import useFeedback, { SURVEY_CONFIG, SURVEY_AUTO_DISMISS_MS } from '../../store/useFeedback'
import useEditorStore from '../../store/useEditorStore'

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmojiScale({ options, labels, value, onChange }) {
  return (
    <div className="flex justify-between gap-1.5">
      {options.map((emoji, i) => (
        <button
          key={i}
          type="button"
          title={labels[i]}
          onClick={() => onChange(i + 1)}
          className="flex-1 text-xl py-1.5 rounded-lg transition-all"
          style={
            value === i + 1
              ? { background: 'var(--cyan-dim)', border: '1px solid rgba(45,212,240,0.4)', transform: 'scale(1.1)' }
              : { border: '1px solid transparent' }
          }
          onMouseEnter={(e) => { if (value !== i + 1) e.currentTarget.style.background = 'var(--card2)' }}
          onMouseLeave={(e) => { if (value !== i + 1) e.currentTarget.style.background = '' }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null)
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          className="text-2xl transition-colors leading-none"
          style={{ color: (hover ?? value) && n <= (hover ?? value) ? 'var(--cyan)' : 'var(--border)' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function NpsScale({ value, onChange }) {
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className="flex-1 py-1.5 text-xs font-semibold rounded transition-all"
            style={
              value === i
                ? { background: 'var(--cyan)', color: 'var(--text-inv)' }
                : { background: 'var(--card2)', color: 'var(--text-mid)' }
            }
            onMouseEnter={(e) => { if (value !== i) e.currentTarget.style.background = 'var(--border)' }}
            onMouseLeave={(e) => { if (value !== i) e.currentTarget.style.background = 'var(--card2)' }}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>Not likely</span>
        <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>Very likely</span>
      </div>
    </div>
  )
}

// ── Main toast ─────────────────────────────────────────────────────────────────

export default function MicroSurveyToast() {
  const activeSurvey   = useFeedback(s => s.activeSurvey)
  const dismissSurvey  = useFeedback(s => s.dismissSurvey)
  const submitSurvey   = useFeedback(s => s.submitSurvey)
  const currentPageId  = useEditorStore(s => s.currentPageId)

  const [rating, setRating]           = useState(null)
  const [followUp, setFollowUp]       = useState('')
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const timerRef = useRef(null)

  const config = activeSurvey ? SURVEY_CONFIG[activeSurvey] : null

  // Reset state when a new survey appears
  useEffect(() => {
    if (activeSurvey) {
      setRating(null)
      setFollowUp('')
      setShowFollowUp(false)
      setSubmitted(false)
    }
  }, [activeSurvey])

  // Auto-dismiss timer
  useEffect(() => {
    if (!activeSurvey || submitted) return
    timerRef.current = setTimeout(() => {
      dismissSurvey(activeSurvey, 'auto_dismissed')
    }, SURVEY_AUTO_DISMISS_MS)
    return () => clearTimeout(timerRef.current)
  }, [activeSurvey, submitted])

  // Keyboard dismiss
  useEffect(() => {
    if (!activeSurvey) return
    const handler = (e) => {
      if (e.key === 'Escape') dismissSurvey(activeSurvey, 'dismissed')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeSurvey])

  if (!activeSurvey || !config) return null

  const pauseTimer = () => clearTimeout(timerRef.current)
  const resumeTimer = () => {
    if (submitted) return
    timerRef.current = setTimeout(() => dismissSurvey(activeSurvey, 'auto_dismissed'), SURVEY_AUTO_DISMISS_MS)
  }

  const handleRatingSelect = (value) => {
    setRating(value)
    const show =
      config.followUpCondition === 'always' ||
      (config.followUpCondition === 'low_score' && value <= 3)
    setShowFollowUp(show)
    if (!show) {
      setTimeout(() => handleSubmit(value, ''), 350)
    }
  }

  const handleSubmit = (ratingValue = rating, followUpValue = followUp) => {
    if (ratingValue === null) return
    setSubmitted(true)

    const labels = config.optionLabels
    const primaryAnswer = labels
      ? `${config.options[ratingValue - 1]} ${labels[ratingValue - 1]}`
      : String(ratingValue)

    submitSurvey(activeSurvey, {
      rating:        ratingValue,
      primaryAnswer,
      followUpText:  followUpValue || null,
      pageContext:   'editor',
      deckId:        currentPageId ?? null,
    })

    setTimeout(() => dismissSurvey(activeSurvey, 'answered'), 1500)
  }

  return (
    <div
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="dialog"
      aria-label="Quick feedback"
      className="fixed bottom-24 right-6 z-[9980] w-80 rounded-card p-4"
      style={{
        background:  'var(--card)',
        border:      '1px solid var(--border)',
        boxShadow:   '0 8px 32px rgba(0,0,0,0.45)',
        animation:   'slideUpFade 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {submitted ? (
        <div className="flex items-center gap-2 py-1">
          <span className="text-lg" style={{ color: 'var(--cyan)' }}>✓</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-hi)' }}>
            Thanks for your feedback.
          </span>
        </div>
      ) : (
        <>
          {/* Question */}
          <p className="text-sm font-medium leading-snug mb-3" style={{ color: 'var(--text-hi)' }}>
            {config.question}
          </p>

          {/* Rating input */}
          {config.inputType === 'emoji' && (
            <EmojiScale
              options={config.options}
              labels={config.optionLabels}
              value={rating}
              onChange={handleRatingSelect}
            />
          )}
          {config.inputType === 'stars' && (
            <StarRating value={rating} onChange={handleRatingSelect} />
          )}
          {config.inputType === 'nps' && (
            <NpsScale value={rating} onChange={handleRatingSelect} />
          )}

          {/* Follow-up textarea */}
          {showFollowUp && (
            <div className="mt-3" style={{ animation: 'slideUpFade 0.2s ease-out' }}>
              <textarea
                autoFocus
                rows={2}
                placeholder={config.followUpLabel}
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="panel-input resize-none text-sm"
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={rating === null}
                  className="text-xs font-semibold px-3 py-1.5 rounded-btn disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: 'var(--cyan)', color: 'var(--text-inv)' }}
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(rating, '')}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-lo)' }}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* Dismiss — only before rating selected */}
          {!showFollowUp && rating === null && (
            <button
              type="button"
              onClick={() => dismissSurvey(activeSurvey, 'dismissed')}
              className="mt-2 text-xs block transition-colors"
              style={{ color: 'var(--text-lo)' }}
            >
              Skip
            </button>
          )}
        </>
      )}
    </div>
  )
}
