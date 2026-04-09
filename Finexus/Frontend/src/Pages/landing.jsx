import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';

const FinexusLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#6366F1"/>
    <path d="M7 9h14M7 14h9M7 19h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="21" cy="14" r="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-3 3 3h-2v4z" fill="currentColor"/>
      </svg>
    ),
    title: 'Expense Tracking',
    description: 'Log and categorize every expense with a simple message. Finexus understands natural language and keeps your books tidy automatically.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'AI-Driven Insights',
    description: 'Get personalized financial recommendations, spending pattern analysis, and predictive budgets powered by your data.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Automated Assistance',
    description: 'Set spending limits, recurring logs, and financial goals. Finexus works silently in the background so you never miss a beat.',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      {/* ── NAVBAR ── */}
      <header className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <FinexusLogo />
            <span className="landing-nav__wordmark">Finexus</span>
          </div>
          <nav className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#how" className="landing-nav__link">How it works</a>
          </nav>
          <div className="landing-nav__actions">
            <button
              id="nav-login-btn"
              className="btn btn--ghost"
              onClick={() => navigate('/login')}
            >
              Log in
            </button>
            <button
              id="nav-signup-btn"
              className="btn btn--primary"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__badge">
            <span className="badge-dot" />
            AI-Powered Financial Platform
          </div>
          <h1 className="landing-hero__headline">
            Finexus — Your AI<br />Financial Command Center
          </h1>
          <p className="landing-hero__subline">
            Manage your finances through natural conversation. Track expenses,
            uncover insights, and stay in control — all in one intelligent interface.
          </p>
          <div className="landing-hero__cta">
            <button
              id="hero-get-started-btn"
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/signup')}
            >
              Get Started — it's free
            </button>
            <button
              id="hero-login-btn"
              className="btn btn--outline btn--lg"
              onClick={() => navigate('/login')}
            >
              Log In
            </button>
          </div>

          {/* Mock Chat Preview */}
          <div className="landing-hero__preview">
            <div className="preview-bar">
              <span className="preview-dot red" />
              <span className="preview-dot amber" />
              <span className="preview-dot green" />
              <span className="preview-title">Finexus Chat</span>
            </div>
            <div className="preview-messages">
              <div className="preview-msg preview-msg--ai">
                <div className="preview-avatar">F</div>
                <div className="preview-bubble">
                  Good morning! Your spending this week is <strong>₹4,230</strong>. You're on track with your ₹6,000 weekly budget. Anything to log?
                </div>
              </div>
              <div className="preview-msg preview-msg--user">
                <div className="preview-bubble">Add expense ₹500 for food</div>
              </div>
              <div className="preview-msg preview-msg--ai">
                <div className="preview-avatar">F</div>
                <div className="preview-bubble">
                  Logged ✓ <strong>₹500</strong> under <em>Food &amp; Dining</em>. Running total today: ₹1,240.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="landing-features">
        <div className="landing-features__inner">
          <div className="section-label">Core Capabilities</div>
          <h2 className="section-heading">Everything you need to master your finances</h2>
          <p className="section-sub">Built for clarity. Engineered for intelligence.</p>
          <div className="features-grid">
            {features.map((f, i) => (
              <article key={i} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="landing-how">
        <div className="landing-how__inner">
          <div className="section-label">How It Works</div>
          <h2 className="section-heading">Three steps to financial clarity</h2>
          <div className="how-steps">
            {[
              { num: '01', title: 'Sign up in seconds', desc: 'Create your Finexus account with just your email and password. No credit card required.' },
              { num: '02', title: 'Chat naturally', desc: 'Type expenses, ask questions, or request summaries — Finexus understands plain language.' },
              { num: '03', title: 'Stay in control', desc: 'Review AI insights, set goals, and watch your financial picture sharpen over time.' },
            ].map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-step__num">{s.num}</div>
                <h3 className="how-step__title">{s.title}</h3>
                <p className="how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-banner__inner">
          <h2>Start managing money the smart way.</h2>
          <p>Join Finexus and take command of your financial future today.</p>
          <button
            id="cta-banner-btn"
            className="btn btn--primary btn--lg"
            onClick={() => navigate('/signup')}
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-nav__brand">
            <FinexusLogo />
            <span className="landing-nav__wordmark">Finexus</span>
          </div>
          <p className="landing-footer__copy">© 2025 Finexus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
