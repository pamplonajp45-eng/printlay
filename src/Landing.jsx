import { useState, useEffect } from "react";
import { Sun, Moon, Check } from "lucide-react";
import FeedbackSection from "./components/FeedbackSection";
import SupportModal from "./components/SupportModal";
import "./Landing.css";

// Constants & Content
const EDITOR_URL = "/app";

const STEPS = [
  {
    num: "01",
    title: "Bulk upload your photos in seconds",
    desc: "Drop multiple customer pictures at once to batch process them with ease.",
  },
  {
    num: "02",
    title: "Choose photo size and auto crop",
    desc: "Select polaroid or standard dimensions and let smart centering frame every shot.",
  },
  {
    num: "03",
    title: "Fit sheets with smart cut guides",
    desc: "Automatically arrange photos on paper with clean dashed lines for easy trimming.",
  },
  {
    num: "04",
    title: "Download ready to print sheet files",
    desc: "Export high resolution PDF or PNG files formatted for crisp studio printing.",
  },
];

const PERKS = [
  "No sign up required",
  "Zero export limits",
  "Runs locally in browser",
  "Privacy friendly processing",
];

const UPLOAD_CARDS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

// Step Visual Components
function StepVisual({ index }) {
  if (index === 0) {
    return (
      <div className="glass-card v-box">
        {UPLOAD_CARDS.map((card) => (
          <div
            key={card.id}
            className={`sc-${card.id}`}
            style={{ width: 84, height: 110, position: "absolute" }}
          >
            <div
              className="glass-card"
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
            />
          </div>
        ))}
        <div
          className="glass-card"
          style={{ position: "absolute", bottom: 16, zIndex: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ height: 20, overflow: "hidden" }}>
              <div
                className="cnt-reel"
                style={{ display: "flex", flexDirection: "column" }}
              >
                {[0, 1, 2, 3, 4].map((n) => (
                  <span key={n} style={{ height: 20, fontWeight: 700 }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>photos</span>
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="glass-card v-box">
        <div
          className="glass-card"
          style={{ width: 130, height: 160, position: "relative" }}
        >
          <div style={{ width: 110, height: 110, overflow: "hidden" }}>
            <div
              className="crop-box"
              style={{
                width: 140,
                height: 110,
                background: "var(--primary-accent)",
              }}
            />
          </div>
          <div
            style={{ position: "relative", height: 20, marginTop: 12 }}
          >
            <span
              className="lbl-old"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              Original
            </span>
            <span
              className="lbl-new"
              style={{ fontSize: 12, fontWeight: 700 }}
            >
              Polaroid
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="glass-card v-box">
        <div
          className="glass-card"
          style={{ width: 150, height: 210, position: "relative" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="grid-c glass-card"
                style={{ width: 56, height: 76, borderRadius: 4 }}
              />
            ))}
          </div>
          <div
            className="guides"
            style={{
              position: "absolute",
              inset: 10,
              border: "1px dashed var(--primary-accent)",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card v-box">
      <div
        className="glass-card sheet-dl"
        style={{ width: 150, height: 210, position: "relative" }}
      >
        <div
          className="chk-pop bubble-button-primary"
          style={{
            zIndex: 10,
            padding: "8px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={16} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              Ready to print
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nav Section
function Nav({ theme, onToggleTheme, onOpenEditor }) {
  return (
    <header
      className="glass-card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src={
            theme === "dark"
              ? "/printlay-logo-dark.svg"
              : "/printlay-logo.svg"
          }
          alt="PrintLay"
          style={{ width: 44, height: 44 }}
        />
        <h1 className="heading" style={{ margin: 0, fontSize: 22 }}>
          PrintLay
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={onToggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a
          href={EDITOR_URL}
          onClick={(e) => {
            if (onOpenEditor) {
              e.preventDefault();
              onOpenEditor();
            }
          }}
          className="bubble-button-primary bubble-btn"
        >
          Open Editor
        </a>
      </div>
    </header>
  );
}

// Hero Section
function Hero({ onOpenEditor }) {
  return (
    <section
      className="fade-up"
      style={{ textAlign: "center", padding: "64px 16px" }}
    >
      <h2 className="heading" style={{ fontSize: 44, margin: "0 0 16px" }}>
        Print layouts ready in seconds
      </h2>
      <p style={{ fontSize: 18, color: "var(--text-muted)" }}>
        Bulk-crop photos and auto-arrange sheets for your print shop.
      </p>
      <div style={{ marginTop: 28 }}>
        <a
          href={EDITOR_URL}
          onClick={(e) => {
            if (onOpenEditor) {
              e.preventDefault();
              onOpenEditor();
            }
          }}
          className="bubble-button-primary bubble-btn"
        >
          Open Editor
        </a>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorks({ onOpenEditor }) {
  return (
    <section style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 className="heading" style={{ fontSize: 32, margin: 0 }}>
          How PrintLay works
        </h2>
      </div>
      {STEPS.map((step, idx) => (
        <div key={step.num} className="observe-step step-row">
          <div className="step-col">
            <span
              className="bubble-pill-active"
              style={{ display: "inline-block", marginBottom: 12 }}
            >
              {step.num}
            </span>
            <h3
              className="heading"
              style={{ fontSize: 24, margin: "0 0 8px" }}
            >
              {step.title}
            </h3>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              {step.desc}
            </p>
          </div>
          <div className="step-col">
            <StepVisual index={idx} />
          </div>
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <a
          href={EDITOR_URL}
          onClick={(e) => {
            if (onOpenEditor) {
              e.preventDefault();
              onOpenEditor();
            }
          }}
          className="bubble-button-primary bubble-btn"
        >
          Open Editor
        </a>
      </div>
    </section>
  );
}

// Free Section
function FreeSection({ onOpenEditor }) {
  return (
    <section
      className="fade-up"
      style={{ maxWidth: 640, margin: "80px auto 0" }}
    >
      <div
        className="glass-card"
        style={{ padding: 36, textAlign: "center" }}
      >
        <h2
          className="heading"
          style={{ fontSize: 32, margin: "0 0 12px" }}
        >
          100% free for everyone
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          {PERKS.map((perk) => (
            <div
              key={perk}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Check size={18} style={{ color: "var(--primary-accent)" }} />
              <span
                style={{ color: "var(--text-muted)", fontSize: 15 }}
              >
                {perk}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <a
            href={EDITOR_URL}
            onClick={(e) => {
              if (onOpenEditor) {
                e.preventDefault();
                onOpenEditor();
              }
            }}
            className="bubble-button-primary bubble-btn"
          >
            Open Editor
          </a>
        </div>
      </div>
    </section>
  );
}

// Footer Section
function Footer({ theme }) {
  return (
    <footer
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src={
            theme === "dark"
              ? "/printlay-logo-dark.svg"
              : "/printlay-logo.svg"
          }
          alt="PrintLay"
          style={{ width: 32, height: 32 }}
        />
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
          @jeypiidev2026
        </span>
      </div>
      <SupportModal theme={theme} />
    </footer>
  );
}

// Main Landing Component
export default function Landing({ onOpenEditor }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("printlay-theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("printlay-theme", theme);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href =
        theme === "dark"
          ? "/printlay-logo-dark.svg"
          : "/printlay-logo.svg";
    }
  }, [theme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    const elements = document.querySelectorAll(".observe-step, .fade-up");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={`app-bg-wrapper ${theme === "dark" ? "theme-dark" : ""}`}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <Nav theme={theme} onToggleTheme={toggleTheme} onOpenEditor={onOpenEditor} />
        <Hero onOpenEditor={onOpenEditor} />
        <HowItWorks onOpenEditor={onOpenEditor} />
        <FeedbackSection onOpenEditor={onOpenEditor} />
        <FreeSection onOpenEditor={onOpenEditor} />
        <div style={{ marginTop: 64 }}>
          <Footer theme={theme} />
        </div>
      </div>
    </div>
  );
}
