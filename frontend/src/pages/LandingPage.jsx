import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #ffffff;
    --bg2: #f7f6fb;
    --bg3: #efedf7;
    --border: rgba(15,23,42,0.08);
    --border-light: rgba(15,23,42,0.14);
    --violet: #7c3aed;
    --violet-light: #8b5cf6;
    --violet-dim: rgba(124,58,237,0.10);
    --violet-glow: rgba(124,58,237,0.25);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.12);
    --text: #17151f;
    --text-muted: #5b586b;
    --text-dim: #78748c;
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.10);
    --blue: #3b82f6;

    /* theme-only helper tokens (not present in the original dark-only design) */
    --nav-bg: rgba(255,255,255,0.85);
    --card-recessed: #ffffff;
    --track-bg: rgba(15,23,42,0.07);
    --subtle-fill: rgba(15,23,42,0.04);
    --accent-text: #6d28d9;
    --accent-text-strong: #6d28d9;
    --accent-text-soft: #7c3aed;
    --accent-text-green: #059669;
    --hero-gradient: linear-gradient(90deg, #7c3aed 0%, #6d28d9 30%, #5b21b6 70%, #4c1d95 100%);
    --border-hover-a: rgba(15,23,42,0.22);
    --border-hover-b: rgba(15,23,42,0.26);
  }

  .dark {
    --bg: #0a0a0f;
    --bg2: #0f0f18;
    --bg3: #141420;
    --border: rgba(255,255,255,0.07);
    --border-light: rgba(255,255,255,0.12);
    --violet: #7c3aed;
    --violet-light: #8b5cf6;
    --violet-dim: rgba(124,58,237,0.15);
    --violet-glow: rgba(124,58,237,0.25);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.16);
    --text: #f1f0ff;
    --text-muted: #8b8a9b;
    --text-dim: #4a4959;
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.15);
    --blue: #3b82f6;

    --nav-bg: rgba(10,10,15,0.85);
    --card-recessed: #0a0a14;
    --track-bg: rgba(255,255,255,0.07);
    --subtle-fill: rgba(255,255,255,0.04);
    --accent-text: #a78bfa;
    --accent-text-strong: #8b5cf6;
    --accent-text-soft: #c4b5fd;
    --accent-text-green: #34d399;
    --hero-gradient: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 30%, #7c3aed 70%, #6d28d9 100%);
    --border-hover-a: rgba(255,255,255,0.25);
    --border-hover-b: rgba(255,255,255,0.3);
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 1.6;
    overflow-x: hidden;
  }

  h1,h2,h3,h4 { font-family: 'Fraunces', serif; }

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
    background: var(--nav-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Fraunces', serif;
    font-weight: 600;
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
    font-family: 'Inter', sans-serif;
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
  .btn-ghost:hover { color: var(--text); border-color: var(--border-hover-a); background: var(--bg3); }

  .btn-primary {
    font-family: 'Inter', sans-serif;
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
    font-family: 'Inter', sans-serif;
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
    font-family: 'Inter', sans-serif;
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
  .btn-outline-lg:hover { color: var(--text); border-color: var(--border-hover-b); background: var(--bg3); }

  /* ── HERO ── */
  .hero {
    padding: 130px 2.5rem 90px;
    max-width: 1180px;
    margin: 0 auto;
    position: relative;

    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3.5rem;
    align-items: center;
  }

  .hero-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .hero-title {
    max-width: 620px;
    margin: 0 0 1.5rem;

    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(2.5rem, 4.2vw, 3.75rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
    text-align: left;
  }

  .hero-gradient {
    display: inline-block;
    background: var(--hero-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    max-width: 480px;
    margin: 0 0 2.5rem;

    font-size: 1.05rem;
    line-height: 1.7;
    text-align: left;

    color: var(--text-muted);
    font-weight: 400;
  }

  .hero-ctas {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  /* ── HERO VISUAL (fanned job-card stack) ── */
  .hero-visual {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .job-stack {
    position: relative;
    width: 100%;
    max-width: 560px;
    height: 400px;
    margin: 0 auto;
  }

  .job-card-wrap {
    position: absolute;
    bottom: 0;
    transform-origin: bottom center;
  }

  .job-card {
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    padding: 1.35rem 1.3rem 1.5rem;
    box-shadow: 0 16px 36px rgba(23,21,31,0.13);
    overflow: hidden;
    color: #14131a;
  }

  .dark .job-card {
    box-shadow: 0 16px 36px rgba(0,0,0,0.42);
  }

  .jc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.15rem;
  }

  .jc-logo {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
  }

  .jc-salary {
    font-size: 0.68rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .jc-role {
    font-family: 'Fraunces', serif;
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
  }

  .jc-front .jc-role { margin-bottom: 0.6rem; font-size: 1.05rem; }

  .jc-desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.72rem;
    font-weight: 400;
    line-height: 1.5;
    opacity: 0.72;
    margin-bottom: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .jc-desc-front {
    font-size: 0.8rem;
  }

  .jc-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.66rem;
    opacity: 0.8;
    margin-bottom: 0.9rem;
  }

  .jc-avatars { display: flex; }

  .jc-avatar {
    width: 17px; height: 17px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: rgba(0,0,0,0.18);
    margin-left: -5px;
  }

  .jc-avatar:first-child { margin-left: 0; }

  .jc-apply {
    display: block;
    width: 100%;
    background: rgba(0,0,0,0.85);
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 0.6rem;
    font-size: 0.76rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }

  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
      text-align: center;
      padding-top: 110px;
    }
    .hero-copy { align-items: center; text-align: center; }
    .hero-title, .hero-sub { text-align: center; }
    .hero-ctas { justify-content: center; }
    .hero-visual { margin-top: 3rem; }
    .job-stack { height: 400px; max-width: 400px; transform: scale(0.78); }
  }

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
    color: var(--accent-text-strong);
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
    max-width: 560px;
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
    font-family: 'Inter', sans-serif;
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

  /* ── NAV FLOW SECTION ── */
  .nav-flow {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
    transition: border-color 0.2s, background 0.2s;
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
    font-family: 'Fraunces', serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text);
  }

  .nav-flow-card p {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 300;
    line-height: 1.5;
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

  /* ── DIVIDER ── */
  .section-divider {
    height: 1px;
    background: var(--border);
    max-width: 1100px;
    margin: 0 auto;
  }

  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const revealUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
}

const JOB_CARDS = [
  {
    company: 'Northwind', role: 'Backend Engineer', salary: '$90K – $130K', bg: '#dbeafe', width: 200, left: -40, rotate: -20, z: 1, bottom: 0,
    desc: 'Design reliable APIs and keep our platform fast.', applied: '20+ applied', cta: 'Apply Now',
  },
  {
    company: 'Solstice', role: 'Marketing Lead', salary: '$60K – $95K', bg: '#fef3c7', width: 200, left: 56, rotate: -10, z: 2, bottom: 30,
    desc: 'Grow our reach and bring in more candidates.', applied: '20+ applied', cta: 'Apply Now',
  },
  {
    company: 'Nimbus', role: 'Senior Product Designer', salary: '$120K – $180K', bg: '#d1fae5', width: 216, left: 150, rotate: 0, z: 5, bottom: 34, front: true,
    desc: 'Craft intuitive, user-friendly experiences for job seekers.', applied: '50+ applied', cta: 'Apply Here',
  },
  {
    company: 'Cobalt', role: 'Data Analyst', salary: '$140K – $210K', bg: '#ffe4e6', width: 200, left: 270, rotate: 10, z: 2, bottom: 30,
    desc: 'Turn application data into insights that improve hiring.', applied: '20+ applied', cta: 'Apply Now',
  },
  {
    company: 'Vertex Labs', role: 'Frontend Engineer', salary: '$100K – $150K', bg: '#ede9fe', width: 200, left: 366, rotate: 20, z: 1, bottom: 0,
    desc: 'Ship polished, accessible React interfaces.', applied: '20+ applied', cta: 'Apply Now',
  },
]

function JobCardStack() {
  return (
    <div className="job-stack">
      {JOB_CARDS.map((job, i) => (
        <div
          key={job.company}
          className="job-card-wrap"
          style={{ left: job.left, width: job.width, bottom: job.bottom, transform: `rotate(${job.rotate}deg)`, zIndex: job.z }}
        >
          <motion.div
            className={`job-card ${job.front ? 'jc-front' : ''}`}
            style={{ background: job.bg }}
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            whileHover={{ y: -22 }}
            transition={{ duration: 0.55, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="jc-top">
              <span className="jc-logo">{job.company[0]}</span>
              <span className="jc-salary">{job.salary}</span>
            </div>
            <div className="jc-role">{job.role}</div>
            <p className={`jc-desc ${job.front ? 'jc-desc-front' : ''}`}>{job.desc}</p>

            <div className="jc-meta">
              <span className="jc-avatars">
                <span className="jc-avatar" />
                <span className="jc-avatar" />
                <span className="jc-avatar" />
              </span>
              {job.applied}
            </div>
            <Link to="/register" className="jc-apply">{job.cta}</Link>
          </motion.div>
        </div>
      ))}
    </div>
  )
}

const NAV_FLOW = [
  {
    label: 'Dashboard', route: '/dashboard', color: '#3b82f6',
    desc: 'Stats, streak, roadmap summary and an AI nudge if you’ve gone quiet',
    icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  },
  {
    label: 'Profile', route: '/profile', color: '#94a3b8',
    desc: 'Manage your CV, account details and re-index your data',
    icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>,
  },
  {
    label: 'AI Assistant', route: '/chat', color: '#8b5cf6',
    desc: 'RAG chat, cover letters, skill gaps, learning roadmap',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
  {
    label: 'Job Hunter', route: '/jobs', color: '#10b981',
    desc: 'Search live listings, see fit-score bars and agent analysis',
    icon: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  },
  {
    label: 'Fit Score', route: '/fit-score', color: '#f59e0b',
    desc: 'Paste a job description, get a hybrid AI + keyword match score',
    icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  },
  {
    label: 'Upload CV', route: '/cv-upload', color: '#22d3ee',
    desc: 'PDF or DOCX — parsed, chunked and embedded for RAG',
    icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  },
  {
    label: 'Tailor CV', route: '/tailor-cv', color: '#f472b6',
    desc: 'Paste a JD, get a rewritten CV, download as PDF',
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
  },
  {
    label: 'Interview Coach', route: '/interview', color: '#f87171',
    desc: 'JD-grounded mock interview with STAR scoring and a timer',
    icon: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>,
  },
  {
    label: 'Tracker', route: '/tracker', color: '#34d399',
    desc: 'Kanban board, calendar, to-do list and overdue detection',
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  },
]

export default function LandingPage() {
    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Fraunces:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
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
                    <ThemeToggle />
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
                <motion.div className="hero-copy" variants={heroContainer} initial="hidden" animate="show">
                    <motion.h1 className="hero-title" variants={heroItem}>
                        Your AI co-pilot
                        <br />
                        <span className="hero-gradient">
                            for landing the right job
                        </span>
                    </motion.h1>

                    <motion.p className="hero-sub" variants={heroItem}>
                        Upload your CV once. CareerPilot finds matching jobs, scores your fit, tailors your CV,
                        coaches you for interviews and tracks every application.
                    </motion.p>

                    <motion.div className="hero-ctas" variants={heroItem}>
                        <Link to="/register" className="btn-primary-lg">
                            Get started
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <a href="#how-it-works" className="btn-outline-lg">See how it works</a>
                    </motion.div>
                </motion.div>

                <div className="hero-visual">
                    <JobCardStack />
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
                        <motion.div className="step-card" custom={0} variants={revealUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
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
                        </motion.div>

                        <motion.div className="step-card" custom={1} variants={revealUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
                            <div className="step-num">02</div>
                            <div className="step-icon" style={{ background: 'var(--green-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            </div>
                            <h3>Discover matching jobs</h3>
                            <p>The AI agent calls live job APIs, retrieves your CV chunks, and computes a cosine-similarity fit score against each listing — automatically.</p>
                        </motion.div>

                        <motion.div className="step-card" custom={2} variants={revealUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
                            <div className="step-num">03</div>
                            <div className="step-icon" style={{ background: 'var(--amber-dim)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>Chat with your AI assistant</h3>
                            <p>Ask anything: "Am I ready for this role?", "Generate a cover letter", "What skills am I missing?". Every answer is grounded in your CV via RAG.</p>
                        </motion.div>

                        <motion.div className="step-card" custom={3} variants={revealUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
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
                        </motion.div>
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
                        {NAV_FLOW.map((item, i) => (
                            <motion.div
                                className="nav-flow-card"
                                key={item.route}
                                custom={i}
                                variants={revealUp}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.3 }}
                            >
                                <div className="nav-flow-icon" style={{ background: `${item.color}1f` }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {item.icon}
                                    </svg>
                                </div>
                                <h4>{item.label}</h4>
                                <p>{item.desc}</p>
                            </motion.div>
                        ))}
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
