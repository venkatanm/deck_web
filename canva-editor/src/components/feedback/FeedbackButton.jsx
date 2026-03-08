import { useState } from 'react'
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react'
import useFeedback from '../../store/useFeedback'
import useEditorStore from '../../store/useEditorStore'

export default function FeedbackButton() {
  const [state, setState] = useState('idle')   // 'idle' | 'open' | 'submitted'
  const [text, setText] = useState('')
  const [category, setCategory] = useState(null)

  const activeSurvey         = useFeedback(s => s.activeSurvey)
  const submitButtonFeedback = useFeedback(s => s.submitButtonFeedback)
  const currentPageId        = useEditorStore(s => s.currentPageId)

  // Hide button entirely when a survey toast is showing (z-index clarity)
  if (activeSurvey) return null

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    submitButtonFeedback(
      category ? `[${category}] ${trimmed}` : trimmed,
      { pageContext: 'editor', deckId: currentPageId ?? null }
    )
    setState('submitted')
    setTimeout(() => {
      setState('idle')
      setText('')
      setCategory(null)
    }, 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9970] flex flex-col items-end gap-2">

      {/* Panel — open state */}
      {state === 'open' && (
        <div
          className="w-80 rounded-card p-4"
          style={{
            background: 'var(--card)',
            border:     '1px solid var(--border)',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.45)',
            animation:  'slideUpFade 0.2s ease-out',
          }}
        >
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: translateY(8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>
              Share feedback
            </span>
            <button
              type="button"
              onClick={() => { setState('idle'); setText(''); setCategory(null) }}
              className="transition-colors"
              style={{ color: 'var(--text-lo)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-hi)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-lo)' }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap mb-3">
            {['Bug', 'Idea', 'Other'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? null : cat)}
                className="text-xs font-medium px-3 py-1 rounded-chip transition-all"
                style={
                  category === cat
                    ? { background: 'var(--cyan-dim)', border: '1px solid rgba(45,212,240,0.4)', color: 'var(--cyan)' }
                    : { background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--text-mid)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Text input */}
          <textarea
            autoFocus
            rows={3}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            className="panel-input resize-none text-sm"
          />

          {/* Submit row */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px]" style={{ color: 'var(--text-lo)' }}>
              ⌘↵ to send
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-btn disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: 'var(--cyan)', color: 'var(--text-inv)' }}
            >
              <Send size={12} strokeWidth={2} />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Submitted confirmation */}
      {state === 'submitted' && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-card"
          style={{
            background: 'var(--card)',
            border:     '1px solid var(--border)',
            animation:  'slideUpFade 0.2s ease-out',
          }}
        >
          <CheckCircle size={16} strokeWidth={1.5} style={{ color: 'var(--cyan)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-hi)' }}>
            Feedback sent. Thank you.
          </span>
        </div>
      )}

      {/* Trigger button */}
      {state !== 'submitted' && (
        <button
          type="button"
          onClick={() => setState(state === 'open' ? 'idle' : 'open')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-chip border transition-all text-xs font-medium"
          style={
            state === 'open'
              ? { background: 'var(--card2)', border: '1px solid rgba(107,127,160,0.5)', color: 'var(--text-hi)' }
              : { background: 'var(--card2)', border: '1px solid rgba(107,127,160,0.35)', color: 'var(--text-mid)' }
          }
          onMouseEnter={(e) => { if (state !== 'open') { e.currentTarget.style.color = 'var(--text-hi)'; e.currentTarget.style.borderColor = 'rgba(107,127,160,0.6)'; } }}
          onMouseLeave={(e) => { if (state !== 'open') { e.currentTarget.style.color = 'var(--text-mid)'; e.currentTarget.style.borderColor = 'rgba(107,127,160,0.35)'; } }}
          aria-label="Share feedback"
        >
          <MessageSquare size={14} strokeWidth={1.5} />
          Feedback
        </button>
      )}
    </div>
  )
}
