// ── Nav scroll blur ──────────────────────────────────────────────────────────

const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled')
  } else {
    nav.classList.remove('scrolled')
  }
}, { passive: true })


// ── Mobile hamburger ─────────────────────────────────────────────────────────

const hamburger  = document.getElementById('nav-hamburger')
const mobileMenu = document.getElementById('mobile-menu')

hamburger.addEventListener('click', () => {
  const isOpen = !mobileMenu.hidden
  mobileMenu.hidden = isOpen
  hamburger.setAttribute('aria-expanded', String(!isOpen))
})

// Close mobile menu on nav link click
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.hidden = true
    hamburger.setAttribute('aria-expanded', 'false')
  })
})


// ── Smooth scroll for anchor links ──────────────────────────────────────────

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'))
    if (!target) return
    e.preventDefault()
    const navHeight = nav.offsetHeight + 12
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
  })
})


// ── Contact form ─────────────────────────────────────────────────────────────

const form      = document.getElementById('contact-form')
const submitBtn = document.getElementById('form-submit')
const successEl = document.getElementById('form-success')
const errorEl   = document.getElementById('form-error')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorEl.hidden = true

  // Basic client-side validation
  const name    = form.name.value.trim()
  const email   = form.email.value.trim()
  const message = form.message.value.trim()
  if (!name || !email || !message) return

  submitBtn.disabled    = true
  submitBtn.textContent = 'Sending…'

  const payload = {
    name,
    email,
    company: form.company.value.trim(),
    message,
  }

  try {
    // Try the backend API endpoint first
    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    form.reset()
    form.hidden      = true
    successEl.hidden = false

  } catch {
    submitBtn.disabled    = false
    submitBtn.textContent = 'Send message'
    errorEl.hidden        = false
  }
})


// ── Intersection observer — fade-in sections ─────────────────────────────────

const observerOpts = { threshold: 0.12 }

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      observer.unobserve(entry.target)
    }
  })
}, observerOpts)

document.querySelectorAll(
  '.feature-card, .step, .contact-copy, .contact-form-wrap'
).forEach(el => {
  el.classList.add('fade-in')
  observer.observe(el)
})
