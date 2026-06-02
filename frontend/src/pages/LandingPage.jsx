import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --bg2: #0f0f18;
    --bg3: #141420;
    --border: rgba(255,255,255,0.07);
    --border-light: rgba(255,255,255,0.12);
    --violet: #7c3aed;
    --violet-light: #8b5cf6;
    --violet-dim: rgba(124,58,237,0.15);
    --violet-glow: rgba(124,58,237,0.25);
    --text: #f1f0ff;
    --text-muted: #8b8a9b;
    --text-dim: #4a4959;
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.15);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.12);
    --blue: #3b82f6;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

  /* ── TOPBAR ── */
  nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2.5rem;
    height: 60px;
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--text);
    text-decoration: none;
  }

  .nav-logo .logo-icon {
    width: 28px; height: 28px;
    background: var(--violet);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }

  .nav-logo .logo-icon svg { width: 16px; height: 16px; color: #fff; }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2rem;
    list-style: none;
  }

  .nav-links a {
    font-size: 0.875rem;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-links a:hover { color: var(--text); }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-ghost {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 0.45rem 1.1rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    display: inline-flex; align-items: center;
  }
  .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.25); background: var(--bg3); }

  .btn-primary {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
    background: var(--violet);
    border: none;
    border-radius: 8px;
    padding: 0.45rem 1.2rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn-primary:hover { background: var(--violet-light); transform: translateY(-1px); }

  .btn-primary-lg {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
    background: var(--violet);
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1.75rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-primary-lg:hover { background: var(--violet-light); transform: translateY(-2px); box-shadow: 0 8px 30px var(--violet-glow); }

  .btn-outline-lg {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    color: var(--text-muted);
    background: transparent;
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 0.75rem 1.75rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-outline-lg:hover { color: var(--text); border-color: rgba(255,255,255,0.3); background: var(--bg3); }

  /* ── HERO ── */
  .hero {
    padding: 90px 2.5rem 60px;
    max-width: 1100px;
    margin: 0 auto;
    position: relative;

    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--violet-dim);
    border: 1px solid rgba(124,58,237,0.3);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.78rem;
    font-weight: 500;
    color: #a78bfa;
    margin-bottom: 2rem;
    letter-spacing: 0.02em;
  }

  .hero-badge .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #a78bfa;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .hero-title {
  max-width: 1000px;
  margin: 0 auto 1.5rem;

  font-family: 'Syne', sans-serif;
  font-size: clamp(2.6rem, 5vw, 4.2rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.05em;
  text-align: center;
 }

.hero-gradient {
  display: inline-block;

  background: linear-gradient(
    90deg,
    #8b5cf6 0%,
    #a78bfa 30%,
    #7c3aed 70%,
    #6d28d9 100%
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

  .hero h1 .accent { color: #8b5cf6; }

 .hero-sub {
  max-width: 760px;
  margin: 0 auto 2.5rem;

  font-size: 1.1rem;
  line-height: 1.7;
  text-align: center;

  color: var(--text-muted);
  font-weight: 300;
}

  .hero-ctas {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    flex-wrap: wrap;
  }

  .hero-stat { text-align: left; }
  .hero-stat .num {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
  }
  .hero-stat .label {
    font-size: 0.78rem;
    color: var(--text-dim);
    margin-top: 2px;
  }

  .hero-stat-sep {
    width: 1px;
    height: 36px;
    background: var(--border-light);
  }

  /* ── MOCK UI PREVIEW ── */
  .preview-wrap {
    margin: 0 auto;
    max-width: 1000px;
    padding: 0 2.5rem 80px;
  }

  .preview-shell {
    background: var(--bg2);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    overflow: hidden;
  }

  .preview-topbar {
    background: var(--bg3);
    border-bottom: 1px solid var(--border);
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .preview-dot { width: 10px; height: 10px; border-radius: 50%; }

  .preview-content {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 320px;
  }

  .preview-sidebar {
    background: var(--bg3);
    border-right: 1px solid var(--border);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .preview-sidebar-label {
    font-size: 0.65rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    padding: 8px 8px 4px;
  }

  .preview-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--text-muted);
    cursor: default;
  }

  .preview-nav-item.active {
    background: var(--violet-dim);
    color: #a78bfa;
  }

  .preview-nav-item .icon {
    width: 16px; height: 16px;
    opacity: 0.7;
  }

  .preview-main {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .preview-greeting {
    background: rgba(124,58,237,0.08);
    border: 1px solid rgba(124,58,237,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.78rem;
    color: #c4b5fd;
  }

  .preview-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .preview-card {
    background: #0a0a14;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }

  .preview-card .pc-label {
    font-size: 0.6rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  .preview-card .pc-val {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .preview-card .pc-sub {
    font-size: 0.62rem;
    color: var(--text-dim);
    margin-top: 2px;
  }

  .preview-bottom {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .preview-box {
    background: #0a0a14;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px;
  }

  .preview-box-label {
    font-size: 0.62rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .preview-progress-bar {
    height: 4px;
    background: rgba(255,255,255,0.07);
    border-radius: 99px;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .preview-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: var(--violet-light);
    width: 34%;
  }

  .preview-roadmap-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .preview-roadmap-item:last-child { border-bottom: none; }

  .preview-pill {
    font-size: 0.6rem;
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid;
    margin-left: auto;
  }

  .pill-done { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #34d399; }
  .pill-active { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.3); color: #a78bfa; }
  .pill-todo { background: rgba(255,255,255,0.04); border-color: var(--border); color: var(--text-dim); }

  .preview-kanban {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .preview-kanban-col { font-size: 0.62rem; }

  .preview-kanban-col .col-title {
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }

  .preview-kanban-card {
    background: #141420;
    border: 1px solid var(--border);
    border-left: 2px solid;
    border-radius: 6px;
    padding: 6px 8px;
    margin-bottom: 4px;
    font-size: 0.65rem;
  }

  .preview-kanban-card .card-role { color: var(--text); font-weight: 500; }
  .preview-kanban-card .card-co { color: var(--text-dim); }

  /* ── SECTIONS ── */
  section { padding: 80px 2.5rem; }

  .section-inner {
    max-width: 1100px;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8b5cf6;
    margin-bottom: 1rem;
  }

  .section-title {
    font-size: clamp(1.8rem, 3vw, 2.5rem);
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin-bottom: 1rem;
    max-width: 600px;
  }

  .section-sub {
    font-size: 1rem;
    color: var(--text-muted);
    max-width: 520px;
    font-weight: 300;
    line-height: 1.7;
    margin-bottom: 3rem;
  }

  /* ── HOW IT WORKS ── */
  .steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
  }

  .step-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.75rem;
    position: relative;
    transition: border-color 0.2s, transform 0.2s;
  }

  .step-card:hover { border-color: var(--border-light); transform: translateY(-3px); }

  .step-num {
    font-family: 'Syne', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    margin-bottom: 1rem;
  }

  .step-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1rem;
  }

  .step-icon svg { width: 20px; height: 20px; }

  .step-card h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }

  .step-card p {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
    font-weight: 300;
  }

  /* ── FEATURES GRID ── */
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .feature-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.75rem;
    transition: border-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .feature-card:hover { border-color: rgba(124,58,237,0.3); transform: translateY(-2px); }
  .feature-card:hover::before { opacity: 1; }

  .feature-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    border: 1px solid;
    margin-bottom: 1.25rem;
  }

  .tag-core { background: var(--violet-dim); border-color: rgba(124,58,237,0.3); color: #a78bfa; }
  .tag-ext { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #34d399; }

  .feature-card h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }

  .feature-card p {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
    font-weight: 300;
    margin-bottom: 1.25rem;
  }

  .feature-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .feature-list li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.825rem;
    color: var(--text-muted);
    font-weight: 300;
  }

  .feature-list li::before {
    content: '';
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--violet-light);
    margin-top: 7px;
    flex-shrink: 0;
  }

  /* ── NAV FLOW SECTION ── */
  .nav-flow {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-top: 2.5rem;
  }

  .nav-flow-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.2s;
    position: relative;
  }

  .nav-flow-card:hover { border-color: var(--border-light); background: var(--bg3); }

  .nav-flow-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }

  .nav-flow-icon svg { width: 16px; height: 16px; }

  .nav-flow-card h4 {
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text);
  }

  .nav-flow-card p {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 300;
    line-height: 1.5;
  }

  .nav-flow-route {
    font-size: 0.62rem;
    color: var(--text-dim);
    font-family: 'DM Sans', monospace;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 2px 6px;
    display: inline-block;
    margin-top: auto;
  }

  /* ── STACK PILLS ── */
  .stack-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }

  .stack-pill {
    font-size: 0.78rem;
    font-weight: 400;
    color: var(--text-muted);
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.3rem 0.85rem;
  }

  /* ── CTA SECTION ── */
  .cta-section {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 80px 2.5rem;
    text-align: center;
  }

  .cta-section h2 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
  }

  .cta-section p {
    font-size: 1rem;
    color: var(--text-muted);
    max-width: 480px;
    margin: 0 auto 2.5rem;
    font-weight: 300;
  }

  .cta-section .cta-btns {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* ── FOOTER ── */
  footer {
    padding: 2rem 2.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  footer .footer-left {
    font-size: 0.8rem;
    color: var(--text-dim);
  }

  footer .footer-left strong { color: var(--text-muted); font-weight: 500; }

  footer .footer-right {
    font-size: 0.78rem;
    color: var(--text-dim);
  }

  /* ── DIVIDER ── */
  .section-divider {
    height: 1px;
    background: var(--border);
    max-width: 1100px;
    margin: 0 auto;
  }

  /* ── ANIMATE ON SCROLL ── */
  .fade-up {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .fade-up.visible { opacity: 1; transform: none; }
`

export default function LandingPage() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.12 }
        )

        const targets = document.querySelectorAll('.fade-up')
        targets.forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
                rel="stylesheet"
            />
            <style>{styles}</style>

            {/* ── TOPBAR ── */}
            <nav>
                <a className="nav-logo" href="#">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    CareerPilot
                </a>

                <div className="nav-actions">
                    <Link to="/login" className="btn-ghost">
                        Log in
                    </Link>
                    <Link to="/register" className="btn-primary">
                        Register
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="hero">

                <h1 className="hero-title">
                    Your AI co-pilot
                    <br />
                    <span className="hero-gradient">
                        for landing the right job
                    </span>
                </h1>

                <p className="hero-sub">
                    Upload your CV once. CareerPilot finds matching jobs, scores your fit, tailors your CV,
                    coaches you for interviews and tracks every application.
                </p>

                <div className="hero-ctas">
                    <Link to="/register" className="btn-primary-lg">
                        Get started
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <a href="#how-it-works" className="btn-outline-lg">See how it works</a>
                </div>

            </section>

            {/* ── HOW IT WORKS ── */}
            <section
                id="how-it-works"
                style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
            >
                <div className="section-inner">
                    <div className="section-label">How it works</div>
                    <h2 className="section-title">Four steps from CV to offer</h2>
                    <p className="section-sub">CareerPilot uses RAG (Retrieval-Augmented Generation) to ground every AI response in your real CV — no hallucinations, no generic advice.</p>

                    <div className="steps">
                        <div className="step-card fade-up">
                            <div className="step-num">01</div>
                            <div className="step-icon" style={{ background: 'var(--violet-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <h3>Upload your CV</h3>
                            <p>PDF or DOCX. We extract, chunk, embed and index every section — skills, experience, education, projects — into a vector database.</p>
                        </div>

                        <div className="step-card fade-up" style={{ transitionDelay: '0.1s' }}>
                            <div className="step-num">02</div>
                            <div className="step-icon" style={{ background: 'var(--green-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                            <h3>Discover matching jobs</h3>
                            <p>The AI agent calls live job APIs, retrieves your CV chunks, and computes a cosine-similarity fit score against each listing — automatically.</p>
                        </div>

                        <div className="step-card fade-up" style={{ transitionDelay: '0.2s' }}>
                            <div className="step-num">03</div>
                            <div className="step-icon" style={{ background: 'var(--amber-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>Chat with your AI assistant</h3>
                            <p>Ask anything: "Am I ready for this role?", "Generate a cover letter", "What skills am I missing?". Every answer is grounded in your CV via RAG.</p>
                        </div>

                        <div className="step-card fade-up" style={{ transitionDelay: '0.3s' }}>
                            <div className="step-num">04</div>
                            <div className="step-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h3>Track and iterate</h3>
                            <p>Kanban board, calendar, streak counter, AI nudges if you've gone quiet — the dashboard keeps you accountable and moving forward every day.</p>
                        </div>
                    </div>
                </div>
            </section>


            <div className="section-divider"></div>

            {/* ── NAVIGATION / APP STRUCTURE ── */}
            <section id="navigation">
                <div className="section-inner">
                    <div className="section-label">App navigation</div>
                    <h2 className="section-title">Every screen, mapped out</h2>
                    <p className="section-sub">CareerPilot has a clean sidebar layout. Every feature lives at its own route — all protected by auth after login.</p>

                    <div className="nav-flow">
                        <div className="nav-flow-card fade-up">
                            <div className="nav-flow-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </div>
                            <h4>Dashboard</h4>
                            <p>Stats, streak, roadmap summary, kanban preview, AI nudge</p>
                            <span className="nav-flow-route">/dashboard</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.05s' }}>
                            <div className="nav-flow-icon" style={{ background: 'var(--green-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                            <h4>Job Hunter</h4>
                            <p>Search, fit score bars, agent analysis, save to tracker</p>
                            <span className="nav-flow-route">/jobs</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.1s' }}>
                            <div className="nav-flow-icon" style={{ background: 'var(--violet-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h4>AI Assistant</h4>
                            <p>RAG chat, cover letters, skill gaps, learning roadmap</p>
                            <span className="nav-flow-route">/chat</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.15s' }}>
                            <div className="nav-flow-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <h4>Tailor CV</h4>
                            <p>Paste JD, get a rewritten CV, download as PDF</p>
                            <span className="nav-flow-route">/tailor-cv</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.2s' }}>
                            <div className="nav-flow-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                </svg>
                            </div>
                            <h4>Interview Coach</h4>
                            <p>5 JD-grounded questions, STAR scoring, readiness score</p>
                            <span className="nav-flow-route">/interview</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.25s' }}>
                            <div className="nav-flow-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <h4>Tracker</h4>
                            <p>Full kanban board, calendar, to-do list, notes per card</p>
                            <span className="nav-flow-route">/tracker</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.3s' }}>
                            <div className="nav-flow-icon" style={{ background: 'rgba(148,163,184,0.1)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <h4>Outreach</h4>
                            <p>Draft personalised recruiter messages, copy to clipboard</p>
                            <span className="nav-flow-route">/outreach</span>
                        </div>

                        <div className="nav-flow-card fade-up" style={{ transitionDelay: '0.35s' }}>
                            <div className="nav-flow-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                    <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                                </svg>
                            </div>
                            <h4>Settings / Profile</h4>
                            <p>Manage CV upload, account info, re-index CV</p>
                            <span className="nav-flow-route">/settings</span>
                        </div>
                    </div>


                </div>
            </section>

            <div className="section-divider"></div>


            {/* ── CTA ── */}
            <div className="cta-section">
                <h2>Ready to find your next role?</h2>
                <p>Upload your CV and let the agent do the hard work. Smart matching, real feedback, zero fluff.</p>
                <div className="cta-btns">
                    <Link to="/register" className="btn-primary-lg">
                        Create account
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <Link to="/login" className="btn-outline-lg">
                        Log in
                    </Link>
                </div>
            </div>


        </>
    )
}
