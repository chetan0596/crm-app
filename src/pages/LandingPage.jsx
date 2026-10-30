import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

const NAV_LINKS = [
  { label: "Features", href: "#features", icon: "fa-solid fa-grip" },
  { label: "Modules", href: "#modules", icon: "fa-solid fa-cubes" },
  { label: "Workflow", href: "#workflow", icon: "fa-solid fa-diagram-project" },
  { label: "Pricing", href: "#pricing", icon: "fa-solid fa-tag" },
  { label: "Reviews", href: "#testimonials", icon: "fa-solid fa-star" },
];

const FEATURES = [
  {
    icon: "fa-solid fa-users-viewfinder",
    title: "Smart Lead Management",
    text: "Capture leads from web forms, WhatsApp, Google Sheets and webhooks — all into one organized pipeline.",
  },
  {
    icon: "fa-solid fa-bell",
    title: "Follow-ups & Reminders",
    text: "Never miss a callback. Scheduled follow-ups, push notifications and activity timelines keep your team on track.",
  },
  {
    icon: "fa-solid fa-boxes-stacked",
    title: "Inventory & Warehouses",
    text: "Items, units, taxes, purchases, sales and multi-warehouse stock transfers — built right into your CRM.",
  },
  {
    icon: "fa-solid fa-file-invoice",
    title: "Quotations & Payments",
    text: "Generate branded quotations, convert them to invoices, track payments and manage credit & debit notes.",
  },
  {
    icon: "fa-solid fa-chart-pie",
    title: "Reports & Analytics",
    text: "Lead source performance, sales trends, item ledgers and payment reports — real-time dashboards included.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Roles & Permissions",
    text: "Granular role-based access for every screen and action. Your data stays exactly where it should.",
  },
];

const MODULES = [
  "Lead Pipeline", "Lead Sources", "Follow-Ups", "WhatsApp Integration",
  "Google Sheets Import", "Webhooks", "Quotation Templates", "Payments",
  "Inventory", "Purchases & Sales", "Stock Transfers", "Reports",
];

const STEPS = [
  { num: "01", title: "Capture", text: "Leads flow in automatically from every channel — forms, sheets, WhatsApp, API webhooks." },
  { num: "02", title: "Nurture", text: "Assign, tag and stage leads. Schedule follow-ups and track every conversation." },
  { num: "03", title: "Close", text: "Send quotations, record payments and convert deals — with invoices ready in one click." },
  { num: "04", title: "Grow", text: "Measure what's working with source-wise reports and real-time dashboards." },
];

const STATS = [
  { value: "500+", label: "Businesses onboard" },
  { value: "1.2M+", label: "Leads managed" },
  { value: "98%", label: "Follow-ups on time" },
  { value: "4.8/5", label: "Customer rating" },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹999",
    period: "/user per month",
    desc: "For small teams getting started with CRM.",
    features: [
      "Up to 5 users",
      "Lead pipeline & follow-ups",
      "Quotations & payments",
      "Basic reports",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: "₹1,999",
    period: "/user per month",
    desc: "For growing teams that need the full stack.",
    features: [
      "Unlimited users",
      "Everything in Starter",
      "Inventory & warehouses",
      "WhatsApp & webhook integrations",
      "Roles & permissions",
      "Advanced reports & exports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored pricing",
    desc: "For large teams with custom needs.",
    features: [
      "Everything in Growth",
      "Custom integrations & API",
      "Dedicated account manager",
      "Onboarding & training",
      "SLA & uptime guarantee",
    ],
    cta: "Talk to Sales",
    popular: false,
  },
];

const FAQS = [
  {
    q: "How do leads get into Sarth?",
    a: "Leads arrive automatically from your website forms, WhatsApp, Google Sheets and any tool that can call a webhook. You can also import spreadsheets manually — mapping columns takes under a minute.",
  },
  {
    q: "Can I control what each team member sees?",
    a: "Yes. Sarth uses role-based permissions for every screen and action. Agents, managers and admins each get their own view — and you can fine-tune it per user.",
  },
  {
    q: "Does it work on mobile?",
    a: "Sarth is a Progressive Web App. Install it on your phone or desktop directly from the browser — you'll get push notifications for follow-up reminders even when the app is closed.",
  },
  {
    q: "Is inventory really included, or is it an add-on?",
    a: "It's built in: items, units, taxes, purchases, sales, multi-warehouse stock transfers and item ledgers — all in the same system as your leads and quotations.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export your leads, customers and reports at any time. Your data belongs to you — we just keep it organized.",
  },
];

const TESTIMONIALS = [
  {
    quote: "We stopped losing leads in WhatsApp chats. Every enquiry lands in Sarth, gets assigned, and follow-ups happen on time. Conversions are up 30%.",
    name: "Rajesh Patel",
    role: "Sales Head, Shree Distributors",
    initials: "RP",
  },
  {
    quote: "Quotations, payments, credit notes — our entire billing runs inside one system now. The stock transfer module alone saved us hours every week.",
    name: "Meera Shah",
    role: "Operations Manager, Aarav Traders",
    initials: "MS",
  },
  {
    quote: "The role-based permissions let us give agents exactly what they need — nothing more. Setup took one afternoon, not weeks.",
    name: "Kunal Desai",
    role: "Founder, KD Realty",
    initials: "KD",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on Escape + lock body scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // ---------- SEO (landing route only; cleaned up on unmount) ----------
  useEffect(() => {
    const origin = window.location.origin;
    const prevTitle = document.title;
    document.title = "Sarth CRM — Grow Business Faster | Leads, Inventory & Payments";

    const upsert = (selector, tag, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(tag);
        el.setAttribute("data-seo", "landing");
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };
    const meta = (attr, key, content) =>
      upsert(`meta[${attr}="${key}"]`, "meta", { [attr]: key, content });

    const desc =
      "Sarth is an all-in-one CRM — capture leads from WhatsApp, Google Sheets & webhooks, manage follow-ups, quotations, payments and multi-warehouse inventory in one workspace.";

    meta("name", "description", desc);
    meta("name", "robots", "index, follow");
    meta("property", "og:type", "website");
    meta("property", "og:site_name", "Sarth CRM");
    meta("property", "og:title", "Sarth CRM — Turn leads into revenue");
    meta("property", "og:description", desc);
    meta("property", "og:url", origin + "/");
    meta("property", "og:image", origin + "/sarth-logo.png");
    meta("name", "twitter:card", "summary_large_image");
    meta("name", "twitter:title", "Sarth CRM — Turn leads into revenue");
    meta("name", "twitter:description", desc);
    meta("name", "twitter:image", origin + "/sarth-logo.png");
    upsert('link[rel="canonical"]', "link", { rel: "canonical", href: origin + "/" });

    // Structured data
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Sarth",
        url: origin,
        logo: origin + "/sarth-logo.png",
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Sarth CRM",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: desc,
        offers: { "@type": "Offer", price: "999", priceCurrency: "INR" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "127" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ];
    schemas.forEach((s) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.setAttribute("data-seo", "landing");
      el.textContent = JSON.stringify(s);
      document.head.appendChild(el);
    });

    return () => {
      document.title = prevTitle;
      document.head.querySelectorAll('[data-seo="landing"]').forEach((n) => n.remove());
    };
  }, []);

  // Scroll-reveal: staggered fade-up for cards and section headers
  useEffect(() => {
    const targets = document.querySelectorAll(
      ".landing .section-head, .landing .feature-card, .landing .stat,\n" +
      "       .landing .step, .landing .price-card, .landing .testimonial-card,\n" +
      "       .landing .module-chip, .landing .why-list li, .landing .cta-card"
    );
    const groups = new Map();
    targets.forEach((el) => {
      el.classList.add("reveal");
      const parent = el.parentElement;
      const idx = groups.get(parent) ?? 0;
      groups.set(parent, idx + 1);
      el.style.transitionDelay = `${Math.min(idx, 5) * 70}ms`;
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ================= NAVBAR ================= */}
      <header className={`landing-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="landing-container nav-inner">
          <Link to="/" className="nav-brand">
            <img src="/sarth-logo.png" alt="Sarth — Grow Business" />
          </Link>

          <nav className="nav-links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary">
              Get Started <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* ---------- Mobile drawer ---------- */}
      <nav
        id="landing-menu"
        className={`mobile-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="drawer-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              <i className={l.icon}></i>
              <span>{l.label}</span>
              <i className="fa-solid fa-angle-right drawer-chev"></i>
            </a>
          ))}
        </div>

        <div className="drawer-promo">
          <i className="fa-solid fa-rocket"></i>
          <strong>Ready to grow faster?</strong>
          <span>Join 500+ businesses running on Sarth.</span>
        </div>

        <div className="drawer-actions">
          <Link to="/register" className="btn btn-primary">
            Get Started <i className="fa-solid fa-arrow-right"></i>
          </Link>
          <Link to="/login" className="btn btn-outline">Login</Link>
        </div>
      </nav>

      <main>
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-blob hero-blob-1" aria-hidden="true"></div>
        <div className="hero-blob hero-blob-2" aria-hidden="true"></div>
        <div className="hero-grid" aria-hidden="true"></div>

        <div className="landing-container hero-inner">
          <div className="hero-copy">
            <span className="hero-badge">
              <i className="fa-solid fa-sparkles"></i> All-in-one CRM & Inventory
            </span>
            <h1>
              Turn leads into revenue.
              <br />
              <span className="grad-text">Grow Business</span> — faster.
            </h1>
            <p>
              Sarth brings your leads, follow-ups, quotations, payments and
              inventory into one clean workspace — so your team spends less time
              managing tools and more time closing deals.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Free <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <i className="fa-solid fa-circle-play"></i> Sign In
              </Link>
            </div>
            <div className="hero-proof">
              <i className="fa-solid fa-shield-check"></i>
              No credit card required &nbsp;·&nbsp; Setup in minutes
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true" role="presentation">
            <div className="hero-logo-orb">
              <img src="/sarth-logo-symbol.png" alt="" />
            </div>

            <div className="float-card card-lead">
              <div className="fc-icon purple"><i className="fa-solid fa-user-plus"></i></div>
              <div>
                <strong>New Lead</strong>
                <span>via WhatsApp — just now</span>
              </div>
            </div>

            <div className="float-card card-sales">
              <span className="fc-label">Sales this month</span>
              <strong className="fc-value">₹4.8L</strong>
              <span className="fc-trend"><i className="fa-solid fa-arrow-trend-up"></i> +18%</span>
            </div>

            <div className="float-card card-pipeline">
              <div className="fc-row">
                <span>Pipeline</span>
                <i className="fa-solid fa-ellipsis"></i>
              </div>
              <div className="fc-bars">
                <div className="bar" style={{ height: "45%" }}></div>
                <div className="bar" style={{ height: "70%" }}></div>
                <div className="bar" style={{ height: "55%" }}></div>
                <div className="bar" style={{ height: "90%" }}></div>
                <div className="bar" style={{ height: "75%" }}></div>
                <div className="bar" style={{ height: "100%" }}></div>
              </div>
            </div>

            <div className="float-chip chip-followup">
              <i className="fa-solid fa-bell"></i> Follow-up · 2:30 PM
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="stats">
        <div className="landing-container stats-grid">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="section" id="features">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2>Everything your team needs to <span className="grad-text">close more deals</span></h2>
            <p>From first contact to final invoice — Sarth keeps the whole sales cycle in one place.</p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">
                  <i className={f.icon}></i>
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MODULES ================= */}
      <section className="section section-alt" id="modules">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Modules</span>
            <h2>One platform, <span className="grad-text">every module</span></h2>
            <p>Sales, marketing and inventory — modular, permission-controlled and connected.</p>
          </div>
          <div className="module-chips">
            {MODULES.map((m) => (
              <span className="module-chip" key={m}>
                <i className="fa-solid fa-check-circle"></i> {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW ================= */}
      <section className="section" id="workflow">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From lead to ledger in <span className="grad-text">four steps</span></h2>
          </div>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {i < STEPS.length - 1 && <div className="step-line" aria-hidden="true"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY ================= */}
      <section className="section section-dark" id="why">
        <div className="landing-container why-inner">
          <div className="why-copy">
            <span className="eyebrow light">Why Sarth</span>
            <h2>Built for growing businesses, not enterprise complexity.</h2>
            <ul className="why-list">
              <li>
                <i className="fa-solid fa-bolt"></i>
                <div><strong>Go live in a day</strong><p>Import leads from Sheets or webhooks — no migration headache.</p></div>
              </li>
              <li>
                <i className="fa-solid fa-mobile-screen"></i>
                <div><strong>Works like an app</strong><p>PWA-ready — install on your phone and get push reminders anywhere.</p></div>
              </li>
              <li>
                <i className="fa-solid fa-lock"></i>
                <div><strong>Your data, your rules</strong><p>Fine-grained permissions for every role on your team.</p></div>
              </li>
            </ul>
          </div>
          <div className="why-visual" aria-hidden="true">
            <div className="quote-card">
              <i className="fa-solid fa-quote-left"></i>
              <p>Sarth replaced four separate tools for us. Leads, stock and invoices finally talk to each other.</p>
              <div className="quote-author">
                <div className="quote-avatar">SD</div>
                <div>
                  <strong>Operations Head</strong>
                  <span>Retail &amp; Distribution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section className="section section-alt" id="pricing">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Pricing</span>
            <h2>Simple plans that <span className="grad-text">scale with you</span></h2>
            <p>Start free for 14 days. No credit card required — upgrade when you're ready.</p>
          </div>

          <div className="pricing-grid">
            {PLANS.map((plan) => (
              <div className={`price-card ${plan.popular ? "is-popular" : ""}`} key={plan.name}>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <h3>{plan.name}</h3>
                <p className="price-desc">{plan.desc}</p>
                <div className="price-row">
                  <span className="price">{plan.price}</span>
                  <span className="price-period">{plan.period}</span>
                </div>
                <ul className="price-features">
                  {plan.features.map((f) => (
                    <li key={f}><i className="fa-solid fa-check"></i> {f}</li>
                  ))}
                </ul>
                <Link
                  to={plan.name === "Enterprise" ? "/login" : "/register"}
                  className={`btn btn-lg ${plan.popular ? "btn-primary" : "btn-outline"} price-cta`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section" id="testimonials">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">Testimonials</span>
            <h2>Teams that <span className="grad-text">grew with Sarth</span></h2>
            <p>Real results from businesses running on Sarth CRM every day.</p>
          </div>

          <div className="testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <div className="testimonial-card" key={t.name}>
                <div className="stars" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i className="fa-solid fa-star" key={i}></i>
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="quote-avatar">{t.initials}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="section" id="faq">
        <div className="landing-container">
          <div className="section-head">
            <span className="eyebrow">FAQ</span>
            <h2>Questions? <span className="grad-text">Answered.</span></h2>
            <p>Everything you need to know before getting started.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div className={`faq-item ${open ? "is-open" : ""}`} key={f.q}>
                  <button
                    className="faq-q"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                  >
                    {f.q}
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                  <div className="faq-a" style={{ maxHeight: open ? "300px" : 0 }}>
                    <p>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta">
        <div className="landing-container">
          <div className="cta-card">
            <div className="cta-blob" aria-hidden="true"></div>
            <h2>Ready to <span className="grad-text">grow your business?</span></h2>
            <p>Start managing leads, inventory and payments in one place today.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="landing-footer">
        <div className="landing-container footer-grid">
          <div className="footer-brand">
            <img src="/sarth-logo.png" alt="Sarth" />
            <p>CRM &amp; inventory management for growing businesses.</p>
            <div className="footer-social">
              <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#pricing">Pricing</a>
            <a href="#workflow">Workflow</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#why">Why Sarth</a>
            <a href="#testimonials">Reviews</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-col">
            <h4>Get started</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Create account</Link>
            <a href="mailto:support@sarth.app">support@sarth.app</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="landing-container footer-bottom-inner">
            <span>© {new Date().getFullYear()} Sarth CRM. All rights reserved.</span>
            <span className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
