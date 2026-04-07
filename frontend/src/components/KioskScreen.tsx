import React, { useState } from "react";
import type { AdaptationParams, SensorState } from "../types/adaptation";

interface KioskScreenProps {
  adaptation: AdaptationParams;
  sensor: SensorState;
}

// Main menu tiles
const MENU_ITEMS = [
  { id: "checkin", icon: "✈", label: "Check In", sub: "Flight check-in & boarding pass" },
  { id: "wayfinding", icon: "🗺", label: "Wayfinding", sub: "Terminal maps & directions" },
  { id: "arrivals", icon: "🛬", label: "Arrivals", sub: "View arriving flights" },
  { id: "departures", icon: "🛫", label: "Departures", sub: "View departing flights" },
  { id: "services", icon: "🛎", label: "Services", sub: "Lounges, shops & dining" },
  { id: "help", icon: "❓", label: "Help", sub: "Assistance & accessibility" },
];

const TRANSITION = "transition-all duration-500 ease-in-out";

export const KioskScreen: React.FC<KioskScreenProps> = ({ adaptation, sensor }) => {
  const [activePage, setActivePage] = useState<string | null>(null);

  const {
    layoutOffsetPercent,
    fontScale,
    highContrast,
    buttonScale,
    voiceMode,
  } = adaptation;

  // ── Derived style variables ─────────────────────────────────────────
  const bg = highContrast ? "#000000" : "#0a1628";
  const cardBg = highContrast ? "#1a1a1a" : "#0d2244";
  const cardBorder = highContrast ? "#ffffff" : "#1e3a6e";
  const textPrimary = highContrast ? "#ffffff" : "#e8f0fe";
  const textSecondary = highContrast ? "#cccccc" : "#8aabcf";
  const accentColor = highContrast ? "#ffff00" : "#4285f4";
  const accentHover = highContrast ? "#ffffaa" : "#5a95ff";
  const headerBg = highContrast ? "#222200" : "#061020";
  const statusBarBg = highContrast ? "#111100" : "#061020";

  const baseFontPx = 16 * fontScale;
  const titleFontPx = 28 * fontScale;
  const subFontPx = 13 * fontScale;
  const tileIconPx = 40 * fontScale * buttonScale;
  const tileLabelPx = 17 * fontScale * buttonScale;
  const tileSubPx = 12 * fontScale;
  const tileMinH = 130 * buttonScale;
  const tileMinW = 200 * buttonScale;

  // Panel shifts downward for seated / child users
  const panelTranslateY = `${layoutOffsetPercent}px`;

  if (activePage) {
    return (
      <DetailPage
        page={activePage}
        onBack={() => setActivePage(null)}
        adaptation={adaptation}
        bg={bg}
        cardBg={cardBg}
        textPrimary={textPrimary}
        accentColor={accentColor}
        baseFontPx={baseFontPx}
        titleFontPx={titleFontPx}
        TRANSITION={TRANSITION}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        color: textPrimary,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: baseFontPx,
        display: "flex",
        flexDirection: "column",
      }}
      className={TRANSITION}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: headerBg,
          borderBottom: `2px solid ${accentColor}`,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>🏛</span>
          <div>
            <div style={{ fontSize: titleFontPx, fontWeight: 700, letterSpacing: 1 }}>
              City Services Kiosk
            </div>
            <div style={{ fontSize: subFontPx, color: textSecondary }}>
              InclusiveView Adaptive Interface
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: subFontPx, color: textSecondary }}>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: subFontPx, color: accentColor }}>
            {sensor.landmarks_detected ? "🟢 Active" : "🔴 Sensing…"}
          </div>
        </div>
      </header>

      {/* ── Main content panel (offset by posture) ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 24px",
          transform: `translateY(${panelTranslateY})`,
        }}
        className={TRANSITION}
      >
        <h2
          style={{
            fontSize: 20 * fontScale,
            fontWeight: 600,
            color: textSecondary,
            marginBottom: 24,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          How can we help you today?
        </h2>

        {/* ── Menu Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(3, minmax(${tileMinW}px, 1fr))`,
            gap: 18,
            width: "100%",
            maxWidth: 900,
          }}
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 16,
                padding: "22px 18px",
                cursor: "pointer",
                color: textPrimary,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                minHeight: tileMinH,
                transition: "background 0.2s, border-color 0.2s, transform 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = highContrast ? "#333300" : "#122d52";
                (e.currentTarget as HTMLButtonElement).style.borderColor = accentHover;
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = cardBg;
                (e.currentTarget as HTMLButtonElement).style.borderColor = cardBorder;
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
              aria-label={`${item.label}: ${item.sub}`}
            >
              <span style={{ fontSize: tileIconPx, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: tileLabelPx, fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: tileSubPx, color: textSecondary, textAlign: "center" }}>
                {item.sub}
              </span>
            </button>
          ))}
        </div>

        {/* ── Language selector ── */}
        <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
          {["English", "Español", "中文", "العربية"].map((lang) => (
            <button
              key={lang}
              style={{
                background: "transparent",
                border: `1px solid ${cardBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: subFontPx,
                color: textSecondary,
                cursor: "pointer",
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* ── Voice Assistant Banner ── */}
      {voiceMode && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            background: highContrast ? "#333300" : "#0d2244",
            border: `2px solid ${accentColor}`,
            borderRadius: 16,
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: `0 0 24px ${accentColor}55`,
            zIndex: 50,
            animation: "fadeIn 0.4s ease",
          }}
        >
          <span style={{ fontSize: 28 }}>🔊</span>
          <div>
            <div style={{ fontSize: 16 * fontScale, fontWeight: 700, color: textPrimary }}>
              Voice Assistance Active
            </div>
            <div style={{ fontSize: 13 * fontScale, color: textSecondary }}>
              Say a menu option or press a button for spoken guidance
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "center",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 1s infinite" }} />
            <div style={{ width: 6, height: 12, borderRadius: 3, background: accentColor, animation: "pulse 1s infinite 0.2s" }} />
            <div style={{ width: 6, height: 8, borderRadius: 3, background: accentColor, animation: "pulse 1s infinite 0.4s" }} />
          </div>
        </div>
      )}

      {/* ── Status bar ── */}
      <footer
        style={{
          background: statusBarBg,
          borderTop: `1px solid ${cardBorder}`,
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 12,
          color: textSecondary,
          flexShrink: 0,
        }}
      >
        <span>InclusiveView v0.1 — Sprint 2</span>
        <span>
          Posture: <b style={{ color: textPrimary }}>{sensor.posture}</b> &nbsp;|&nbsp;
          Distance: <b style={{ color: textPrimary }}>{sensor.distance}</b>
        </span>
        <span style={{ color: accentColor }}>{adaptation.label || "Adapting…"}</span>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; transform: scaleY(0.8); } 50% { opacity: 1; transform: scaleY(1.2); } }
      `}</style>
    </div>
  );
};

// ── Simple detail page (stub) ─────────────────────────────────────────
interface DetailPageProps {
  page: string;
  onBack: () => void;
  adaptation: AdaptationParams;
  bg: string;
  cardBg: string;
  textPrimary: string;
  accentColor: string;
  baseFontPx: number;
  titleFontPx: number;
  TRANSITION: string;
}

const PAGE_CONTENT: Record<string, { icon: string; title: string; body: string }> = {
  checkin: { icon: "✈", title: "Check In", body: "Scan your booking reference or passport to begin check-in. Select your seat, add baggage, and print or download your boarding pass." },
  wayfinding: { icon: "🗺", title: "Wayfinding", body: "Use the interactive map below to find gates, restrooms, lounges, and transport connections. Tap any area for step-by-step directions." },
  arrivals: { icon: "🛬", title: "Arrivals", body: "Live arrivals board. Flight statuses are updated every 60 seconds directly from ATC feeds." },
  departures: { icon: "🛫", title: "Departures", body: "Live departures board. Check your gate, departure time, and current status here." },
  services: { icon: "🛎", title: "Services", body: "Discover lounges, dining, shopping, and transit services available in this terminal." },
  help: { icon: "❓", title: "Help & Accessibility", body: "Need assistance? Press the intercom button to speak with a staff member, or choose a category below for self-service support." },
};

const DetailPage: React.FC<DetailPageProps> = ({
  page, onBack, adaptation, bg, cardBg, textPrimary, accentColor, baseFontPx, titleFontPx, TRANSITION,
}) => {
  const content = PAGE_CONTENT[page] ?? { icon: "ℹ", title: page, body: "Content loading…" };
  const { layoutOffsetPercent } = adaptation;

  return (
    <div
      style={{ minHeight: "100vh", background: bg, color: textPrimary, fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: baseFontPx, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}
      className={TRANSITION}
    >
      <div
        style={{ background: cardBg, borderRadius: 20, padding: 40, maxWidth: 680, width: "100%", transform: `translateY(${layoutOffsetPercent}px)` }}
        className={TRANSITION}
      >
        <div style={{ fontSize: 52, marginBottom: 16 }}>{content.icon}</div>
        <h1 style={{ fontSize: titleFontPx, fontWeight: 700, marginBottom: 16, color: accentColor }}>{content.title}</h1>
        <p style={{ lineHeight: 1.7, color: textPrimary, marginBottom: 32 }}>{content.body}</p>
        <button
          onClick={onBack}
          style={{ background: accentColor, border: "none", borderRadius: 10, padding: "14px 32px", fontSize: baseFontPx, fontWeight: 600, color: "#fff", cursor: "pointer" }}
        >
          ← Back to Main Menu
        </button>
      </div>
    </div>
  );
};
