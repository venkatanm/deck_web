import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAppUrl } from '../config/domains'

// ── Logo ──────────────────────────────────────────────────────────────────────
function VeloxLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <path d="M8 12L26 42L44 12" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 12L20 12L26 26" stroke="#2DD4F0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Eyebrow pill ──────────────────────────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 16px', borderRadius: 100,
      background: 'rgba(45,212,240,0.08)', border: '1px solid rgba(45,212,240,0.22)',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: 'var(--cyan)',
      marginBottom: 28, position: 'relative',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', flexShrink: 0 }} />
      {children}
    </div>
  )
}

// ── Main LandingPage ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navRef = useRef(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const sBtn = {
    primary: {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
      letterSpacing: '-0.01em', padding: '11px 22px',
      borderRadius: 8, background: 'var(--cyan)', color: '#080C14',
      border: 'none', cursor: 'pointer', textDecoration: 'none',
      transition: 'opacity 0.15s', whiteSpace: 'nowrap',
    },
    ghost: {
      fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
      color: 'var(--text-mid)', textDecoration: 'none',
      whiteSpace: 'nowrap', cursor: 'pointer', background: 'none', border: 'none',
    },
  }

  const navInnerStyle = {
    maxWidth: 1160, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
    padding: '12px 24px',
    background: scrolled ? 'rgba(8,12,20,0.97)' : 'rgba(15,21,32,0.85)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)', borderRadius: 14,
    transition: 'background 0.2s',
  }

  return (
    <div style={{ fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: 'var(--bg)', color: 'var(--text-hi)', overflowX: 'hidden' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav ref={navRef} style={{ position: 'sticky', top: 0, zIndex: 50, padding: '12px 24px' }}>
        <div style={navInnerStyle}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
            <VeloxLogo size={28} />
            <span style={{ fontFamily: 'inherit', fontSize: 22, fontWeight: 900, letterSpacing: '-0.035em', color: '#fff' }}>Velox</span>
          </Link>

          {/* Desktop CTAs — link to app domain (decks.datavelox.com) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="landing-nav-ctas">
            <a href={`${getAppUrl()}/login`} style={sBtn.ghost}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-hi)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mid)' }}
            >Sign in</a>
            <a href={`${getAppUrl()}/register`} style={{ ...sBtn.primary, padding: '9px 18px' }}>Get Access</a>
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            className="landing-hamburger"
          >
            {[0, 1, 2].map(i => <span key={i} style={{ display: 'block', width: 22, height: 2, background: 'var(--text-mid)', borderRadius: 2 }} />)}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ maxWidth: 1160, margin: '8px auto 0', padding: '12px 16px', background: 'rgba(15,21,32,0.98)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <a href={`${getAppUrl()}/login`} onClick={() => setMobileOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-lo)', padding: '10px 8px', borderRadius: 8, textDecoration: 'none' }}>Sign in</a>
            <a href={`${getAppUrl()}/register`} onClick={() => setMobileOpen(false)} style={{ ...sBtn.primary, marginTop: 8, justifyContent: 'center' }}>Get Access</a>
          </div>
        )}
      </nav>


      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '72px 48px 80px', position: 'relative', overflow: 'hidden' }}>

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)', backgroundSize: '32px 32px', maskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 0%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 75% at 50% 50%, black 0%, transparent 100%)' }} />
        {/* Glow */}
        <div style={{ position: 'absolute', width: 800, height: 500, pointerEvents: 'none', background: 'radial-gradient(ellipse, rgba(45,212,240,0.07) 0%, transparent 65%)', top: '10%', left: '50%', transform: 'translateX(-50%)' }} />

        <Eyebrow>Enterprise Productivity Platform</Eyebrow>

        <h1 style={{ fontSize: 'clamp(48px, 6.5vw, 84px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.02, color: 'var(--text-hi)', marginBottom: 24, position: 'relative' }}>
          Build faster.<br />
          Present smarter.<br />
          <span style={{ color: 'var(--cyan)', fontWeight: 300 }}>Move at Velox speed.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', fontWeight: 400, color: 'var(--text-mid)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 36px', position: 'relative' }}>
          Velox builds AI-powered tools for enterprise teams who need to
          work faster without sacrificing quality. Starting with the way
          your team creates and presents ideas.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <a href={`${getAppUrl()}/register`} style={{ ...sBtn.primary, padding: '14px 28px', fontSize: 15 }}>
            Get Access to Velox Decks
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(30,42,58,0.9)', padding: '24px 48px', background: 'var(--bg-deep)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-mid)', flexWrap: 'wrap', gap: 12 }}>
          <span>© {new Date().getFullYear()} Velox Data Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href={`${getAppUrl()}/login`} style={{ color: 'var(--text-mid)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-hi)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mid)' }}>Sign in</a>
            <a href={`${getAppUrl()}/register`} style={{ color: 'var(--text-mid)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-hi)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mid)' }}>Get Access</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-nav-ctas { display: none !important; }
          .landing-hamburger { display: flex !important; }
          section { padding: 60px 24px 56px !important; }
          footer { padding: 24px !important; }
          nav { padding: 10px 16px !important; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
