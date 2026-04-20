import React, { useEffect, useRef, useState } from "react";
import type { AdaptationParams, SensorState } from "../types/adaptation";

// ── i18n ──────────────────────────────────────────────────────────────────────
type Lang = "en" | "es" | "zh" | "ar";

interface LangStrings {
  dir: "ltr" | "rtl";
  kioskTitle: string;
  kioskSubtitle: string;
  heading: string;
  accessibilityMode: string;
  closeViewingMsg: string;
  voiceActiveTitle: string;
  voiceActiveSub: string;
  backButton: string;
  sensing: string;
  activeLabel: string;
  menu: {
    checkin: { label: string; sub: string };
    wayfinding: { label: string; sub: string };
    arrivals: { label: string; sub: string };
    departures: { label: string; sub: string };
    services: { label: string; sub: string };
    help: { label: string; sub: string };
  };
}

const TRANSLATIONS: Record<Lang, LangStrings> = {
  en: {
    dir: "ltr",
    kioskTitle: "City Services Kiosk",
    kioskSubtitle: "InclusiveView Adaptive Interface",
    heading: "How can we help you today?",
    accessibilityMode: "Accessibility Mode",
    closeViewingMsg: "Larger text and higher contrast enabled for closer viewing distance",
    voiceActiveTitle: "Voice Assistance Active",
    voiceActiveSub: "Hover, tab, or select a menu option for spoken guidance",
    backButton: "← Back to Main Menu",
    sensing: "Sensing…",
    activeLabel: "Active",
    menu: {
      checkin: { label: "Check in", sub: "Flight check-in and boarding pass" },
      wayfinding: { label: "Wayfinding", sub: "Terminal maps and directions" },
      arrivals: { label: "Arrivals", sub: "View arriving flights" },
      departures: { label: "Departures", sub: "View departing flights" },
      services: { label: "Services", sub: "Lounges, shops, and dining" },
      help: { label: "Help", sub: "Assistance and accessibility" },
    },
  },
  es: {
    dir: "ltr",
    kioskTitle: "Quiosco de Servicios",
    kioskSubtitle: "Interfaz Adaptativa InclusiveView",
    heading: "¿En qué podemos ayudarle hoy?",
    accessibilityMode: "Modo de Accesibilidad",
    closeViewingMsg: "Texto más grande y mayor contraste activados para visión cercana",
    voiceActiveTitle: "Asistencia de Voz Activa",
    voiceActiveSub: "Pase el cursor o use Tab para recibir orientación hablada",
    backButton: "← Volver al Menú Principal",
    sensing: "Detectando…",
    activeLabel: "Activo",
    menu: {
      checkin: { label: "Facturación", sub: "Facturación y tarjeta de embarque" },
      wayfinding: { label: "Orientación", sub: "Mapas de la terminal y direcciones" },
      arrivals: { label: "Llegadas", sub: "Ver vuelos de llegada" },
      departures: { label: "Salidas", sub: "Ver vuelos de salida" },
      services: { label: "Servicios", sub: "Salones, tiendas y restaurantes" },
      help: { label: "Ayuda", sub: "Asistencia y accesibilidad" },
    },
  },
  zh: {
    dir: "ltr",
    kioskTitle: "城市服务自助机",
    kioskSubtitle: "InclusiveView 自适应界面",
    heading: "今天我们能为您做什么？",
    accessibilityMode: "无障碍模式",
    closeViewingMsg: "已启用更大字体和更高对比度，适应近距离查看",
    voiceActiveTitle: "语音助手已启动",
    voiceActiveSub: "悬停、按 Tab 或选择菜单选项以获取语音指引",
    backButton: "← 返回主菜单",
    sensing: "检测中…",
    activeLabel: "运行中",
    menu: {
      checkin: { label: "值机", sub: "航班值机及登机牌" },
      wayfinding: { label: "导航", sub: "航站楼地图及指引" },
      arrivals: { label: "到港", sub: "查看到港航班" },
      departures: { label: "离港", sub: "查看离港航班" },
      services: { label: "服务", sub: "贵宾室、商店及餐饮" },
      help: { label: "帮助", sub: "协助及无障碍服务" },
    },
  },
  ar: {
    dir: "rtl",
    kioskTitle: "كشك الخدمات المدنية",
    kioskSubtitle: "واجهة InclusiveView التكيفية",
    heading: "كيف يمكننا مساعدتك اليوم؟",
    accessibilityMode: "وضع إمكانية الوصول",
    closeViewingMsg: "تم تفعيل نص أكبر وتباين أعلى للمشاهدة من مسافة قريبة",
    voiceActiveTitle: "المساعد الصوتي نشط",
    voiceActiveSub: "مرر الفأرة أو اضغط Tab أو اختر خياراً للإرشاد الصوتي",
    backButton: "→ العودة إلى القائمة الرئيسية",
    sensing: "جارٍ الاستشعار…",
    activeLabel: "نشط",
    menu: {
      checkin: { label: "تسجيل الوصول", sub: "تسجيل الرحلة وبطاقة الصعود" },
      wayfinding: { label: "خرائط المطار", sub: "خرائط المبنى والاتجاهات" },
      arrivals: { label: "الوصول", sub: "عرض الرحلات الواردة" },
      departures: { label: "المغادرة", sub: "عرض الرحلات الصادرة" },
      services: { label: "الخدمات", sub: "الصالات والمحلات والمطاعم" },
      help: { label: "المساعدة", sub: "المساعدة وإمكانية الوصول" },
    },
  },
};

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: "en", label: "English" },
  { key: "es", label: "Español" },
  { key: "zh", label: "中文" },
  { key: "ar", label: "العربية" },
];

const MENU_IDS = ["checkin", "wayfinding", "arrivals", "departures", "services", "help"] as const;
type MenuId = typeof MENU_IDS[number];

const MENU_ICONS: Record<MenuId, string> = {
  checkin: "✈",
  wayfinding: "🗺",
  arrivals: "🛬",
  departures: "🛫",
  services: "🛎",
  help: "❓",
};

// ── Enriched page content ─────────────────────────────────────────────────────
interface PageContent {
  icon: string;
  title: string;
  body: string;
  steps?: string[];
}

const PAGE_CONTENT: Record<string, PageContent> = {
  checkin: {
    icon: "✈",
    title: "Check In",
    body: "Complete your check-in in a few easy steps. Have your passport or booking reference ready.",
    steps: [
      "Scan your passport or booking confirmation code",
      "Confirm your passenger name and contact details",
      "Choose or confirm your seat on the interactive seat map",
      "Add checked baggage if needed (fees apply for excess weight)",
      "Print your boarding pass or send it to your mobile device",
    ],
  },
  wayfinding: {
    icon: "🗺",
    title: "Wayfinding",
    body: "Find your gate, facilities, and transport connections in this terminal.",
    steps: [
      "Select your destination: Gate, Restroom, Restaurant, or Transport",
      "An interactive map highlights the shortest accessible route",
      "Colour-coded floor markings guide you step by step",
      "Wheelchair-accessible paths are marked with the ♿ symbol",
      "Tap 'Staff Assist' on screen for a human guide at any point",
    ],
  },
  arrivals: {
    icon: "🛬",
    title: "Arrivals",
    body: "Live arrivals board — updated every 60 seconds from ATC feeds.",
    steps: [
      "AA 123  ·  New York JFK    ·  ✅ On Time   ·  14:30  ·  Gate A5",
      "UA 456  ·  Chicago ORD    ·  ⚠️ Delayed   ·  15:10  ·  Gate B12",
      "DL 789  ·  Los Angeles    ·  🟢 Landed    ·  13:55  ·  Gate A8",
      "BA 001  ·  London LHR     ·  ✅ On Time   ·  16:05  ·  Gate C22",
      "SW 321  ·  Dallas DAL     ·  ⚠️ Delayed   ·  17:30  ·  Gate B7",
    ],
  },
  departures: {
    icon: "🛫",
    title: "Departures",
    body: "Live departures board — check your gate and current status.",
    steps: [
      "AA 234  ·  Miami MIA       ·  🔴 Boarding  ·  15:45  ·  Gate 7",
      "BA 002  ·  London LHR     ·  ✅ On Time   ·  16:20  ·  Gate 22",
      "UA 567  ·  Denver DEN     ·  ⚠️ Delayed   ·  17:00  ·  Gate 14",
      "DL 890  ·  Atlanta ATL    ·  ✅ On Time   ·  17:25  ·  Gate 3",
      "SW 654  ·  Las Vegas LAS  ·  ✅ On Time   ·  18:10  ·  Gate 9",
    ],
  },
  services: {
    icon: "🛎",
    title: "Services",
    body: "Discover everything available in this terminal.",
    steps: [
      "🛋 Lounges — United Club (Gate 15) · Delta Sky Club (Gate 22)",
      "🍔 Dining — McDonald's · Starbucks · Terminal Grill · Sushi Bar",
      "🛍 Shopping — Duty Free (Gate 10) · Newsstand · Pharmacy",
      "🚌 Transport — Taxi rank (Level 0) · Rideshare (Zone B) · Rail link",
      "🅿 Parking — Short stay (P1) · Long stay (P3) · Accessible (P1A)",
    ],
  },
  help: {
    icon: "❓",
    title: "Help & Accessibility",
    body: "We are here to help. Choose an option below or press the red intercom button.",
    steps: [
      "📞 Staff assistance — press the red intercom button on this kiosk",
      "♿ Wheelchair service — call 555-HELP or ask any staff member",
      "🔊 Voice mode — press C on a keyboard or use the debug panel",
      "🔍 Lost & Found — Level 1, Counter C, open 07:00–22:00",
      "🚨 Medical emergency — dial 911 or alert the nearest staff member",
    ],
  },
};

const TRANSITION = "transition-all duration-500 ease-in-out";

// ── Types ─────────────────────────────────────────────────────────────────────
interface KioskScreenProps {
  adaptation: AdaptationParams;
  sensor: SensorState;
}

// ── KioskScreen ───────────────────────────────────────────────────────────────
export const KioskScreen: React.FC<KioskScreenProps> = ({ adaptation, sensor }) => {
  const [activePage, setActivePage] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const lastAnnouncementRef = useRef<string>("");

  const t = TRANSLATIONS[lang];

  const { layoutOffsetPercent, fontScale, highContrast, buttonScale, voiceMode } = adaptation;
  const isAccessibilityMode = highContrast || voiceMode || sensor.distance === "close";

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const clearAnnouncementMemory = () => {
    lastAnnouncementRef.current = "";
  };

  const getMainMenuGuidance = () =>
    `Voice guidance enabled. Main menu. Options are ${MENU_IDS.map((id) => t.menu[id].label).join(", ")}. Press tab to move through options and enter to select.`;

  const getDetailPageGuidance = (page: string) => {
    const content = PAGE_CONTENT[page];
    if (!content) return "Voice guidance enabled. Page loaded.";
    return `${content.title}. ${content.body} Press the back button to return to the main menu.`;
  };

  const announceSelection = (label: string, sub: string) => {
    if (!voiceMode) return;
    const announcement = `${label}. ${sub}`;
    if (announcement !== lastAnnouncementRef.current) {
      speak(announcement);
      lastAnnouncementRef.current = announcement;
    }
  };

  useEffect(() => {
    if (!voiceMode) {
      window.speechSynthesis?.cancel();
      lastAnnouncementRef.current = "";
      return;
    }
    const announcement = activePage ? getDetailPageGuidance(activePage) : getMainMenuGuidance();
    if (announcement !== lastAnnouncementRef.current) {
      speak(announcement);
      lastAnnouncementRef.current = announcement;
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [voiceMode, activePage, lang]);

  // ── Colours ───────────────────────────────────────────────────────────────────
  const bg = highContrast ? "#000000" : "#0a1628";
  const cardBg = highContrast ? "#111111" : "#0d2244";
  const cardBorder = highContrast ? "#ffffff" : "#1e3a6e";
  const textPrimary = highContrast ? "#ffffff" : "#e8f0fe";
  const textSecondary = highContrast ? "#f0f0f0" : "#8aabcf";
  const accentColor = highContrast ? "#ffff00" : "#4285f4";
  const accentHover = highContrast ? "#fff799" : "#5a95ff";
  const headerBg = highContrast ? "#111111" : "#061020";
  const statusBarBg = highContrast ? "#111111" : "#061020";

  // ── Sizes ─────────────────────────────────────────────────────────────────────
  const baseFontPx = 16 * fontScale;
  const titleFontPx = 28 * fontScale;
  const subFontPx = 13 * fontScale;
  const tileIconPx = 40 * fontScale * buttonScale;
  const tileLabelPx = 17 * fontScale * buttonScale;
  const tileSubPx = 12 * fontScale;
  const tileMinH = 130 * buttonScale;
  const tileMinW = 200 * buttonScale;
  const panelTranslateY = `${layoutOffsetPercent}px`;

  if (activePage) {
    return (
      <DetailPage
        page={activePage}
        onBack={() => {
          if (voiceMode) {
            speak("Returning to main menu");
            lastAnnouncementRef.current = "Returning to main menu";
          }
          setActivePage(null);
        }}
        adaptation={adaptation}
        t={t}
        bg={bg}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        accentColor={accentColor}
        baseFontPx={baseFontPx}
        titleFontPx={titleFontPx}
        TRANSITION={TRANSITION}
      />
    );
  }

  return (
    <div
      dir={t.dir}
      style={{
        minHeight: "100vh",
        background: bg,
        color: textPrimary,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: baseFontPx,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      className={TRANSITION}
    >
      {isAccessibilityMode && (
        <div
          style={{
            position: "fixed",
            top: 18,
            right: t.dir === "rtl" ? "auto" : 24,
            left: t.dir === "rtl" ? 24 : "auto",
            background: accentColor,
            color: highContrast ? "#000000" : "#ffffff",
            padding: "8px 14px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13 * fontScale,
            zIndex: 100,
            boxShadow: `0 0 18px ${accentColor}66`,
          }}
          className={TRANSITION}
        >
          {t.accessibilityMode}
        </div>
      )}

      {/* Header */}
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
          <span style={{ fontSize: 32 * fontScale }}>🏛</span>
          <div>
            <div style={{ fontSize: titleFontPx, fontWeight: 700, letterSpacing: 1 }}>
              {t.kioskTitle}
            </div>
            <div style={{ fontSize: subFontPx, color: textSecondary }}>
              {t.kioskSubtitle}
            </div>
          </div>
        </div>
        <div style={{ textAlign: t.dir === "rtl" ? "left" : "right" }}>
          <div style={{ fontSize: subFontPx, color: textSecondary }}>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: subFontPx, color: accentColor }}>
            {sensor.landmarks_detected ? `🟢 ${t.activeLabel}` : `🔴 ${t.sensing}`}
          </div>
        </div>
      </header>

      {/* Main content */}
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
          {t.heading}
        </h2>

        {sensor.distance === "close" && (
          <div
            style={{
              marginBottom: 18,
              padding: "10px 16px",
              borderRadius: 12,
              background: highContrast ? "#222200" : "#102744",
              border: `2px solid ${accentColor}`,
              color: textPrimary,
              fontSize: 14 * fontScale,
              fontWeight: 600,
            }}
            className={TRANSITION}
          >
            {t.closeViewingMsg}
          </div>
        )}

        {/* Menu grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(3, minmax(${tileMinW}px, 1fr))`,
            gap: 18,
            width: "100%",
            maxWidth: 900,
          }}
        >
          {MENU_IDS.map((id) => {
            const item = t.menu[id];
            return (
              <button
                key={id}
                onClick={() => {
                  if (voiceMode) {
                    speak(`Opening ${item.label}`);
                    lastAnnouncementRef.current = `Opening ${item.label}`;
                  }
                  setActivePage(id);
                }}
                onMouseEnter={(e) => {
                  announceSelection(item.label, item.sub);
                  (e.currentTarget as HTMLButtonElement).style.background = highContrast ? "#2a2a00" : "#122d52";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = accentHover;
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
                }}
                onTouchStart={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = highContrast ? "#2a2a00" : "#122d52";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = accentHover;
                }}
                onFocus={() => announceSelection(item.label, item.sub)}
                onMouseLeave={(e) => {
                  clearAnnouncementMemory();
                  (e.currentTarget as HTMLButtonElement).style.background = cardBg;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = cardBorder;
                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                }}
                onTouchEnd={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = cardBg;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = cardBorder;
                }}
                onBlur={() => clearAnnouncementMemory()}
                aria-label={`${item.label}: ${item.sub}`}
                style={{
                  background: cardBg,
                  border: `2px solid ${cardBorder}`,
                  borderRadius: 16,
                  padding: "22px 18px",
                  cursor: "pointer",
                  color: textPrimary,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  minHeight: tileMinH,
                  boxShadow: highContrast ? `0 0 0 1px ${accentColor}` : "none",
                  transition: "background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
                <span style={{ fontSize: tileIconPx, lineHeight: 1 }}>{MENU_ICONS[id]}</span>
                <span style={{ fontSize: tileLabelPx, fontWeight: 700 }}>{item.label}</span>
                <span style={{ fontSize: tileSubPx, color: textSecondary, textAlign: "center" }}>
                  {item.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Language switcher */}
        <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {LANG_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLang(key)}
              style={{
                background: lang === key ? accentColor : "transparent",
                border: `1px solid ${lang === key ? accentColor : cardBorder}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: subFontPx,
                color: lang === key ? (highContrast ? "#000" : "#fff") : textSecondary,
                cursor: "pointer",
                fontWeight: lang === key ? 700 : 400,
                transition: "all 0.2s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice mode banner */}
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
              {t.voiceActiveTitle}
            </div>
            <div style={{ fontSize: 13 * fontScale, color: textSecondary }}>
              {t.voiceActiveSub}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 1s infinite" }} />
            <div style={{ width: 6, height: 12, borderRadius: 3, background: accentColor, animation: "pulse 1s infinite 0.2s" }} />
            <div style={{ width: 6, height: 8, borderRadius: 3, background: accentColor, animation: "pulse 1s infinite 0.4s" }} />
          </div>
        </div>
      )}

      {/* Footer */}
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
        <span>InclusiveView v0.3 — Sprint 3</span>
        <span>
          Posture: <b style={{ color: textPrimary }}>{sensor.posture}</b> &nbsp;|&nbsp;
          Distance: <b style={{ color: textPrimary }}>{sensor.distance}</b>
        </span>
        <span style={{ color: accentColor }}>{adaptation.label || "Adapting…"}</span>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scaleY(0.8); }
          50%       { opacity: 1;   transform: scaleY(1.2); }
        }
        @media (max-width: 640px) {
          /* 2-column grid on narrow screens */
          div[style*="repeat(3"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

// ── DetailPage ────────────────────────────────────────────────────────────────
interface DetailPageProps {
  page: string;
  onBack: () => void;
  adaptation: AdaptationParams;
  t: LangStrings;
  bg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  baseFontPx: number;
  titleFontPx: number;
  TRANSITION: string;
}

const DetailPage: React.FC<DetailPageProps> = ({
  page, onBack, adaptation, t, bg, cardBg, textPrimary, textSecondary,
  accentColor, baseFontPx, titleFontPx, TRANSITION,
}) => {
  const content = PAGE_CONTENT[page] ?? { icon: "ℹ", title: page, body: "Content loading…" };
  const { layoutOffsetPercent } = adaptation;

  return (
    <div
      dir={t.dir}
      style={{
        minHeight: "100vh",
        background: bg,
        color: textPrimary,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: baseFontPx,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
      className={TRANSITION}
    >
      <div
        style={{
          background: cardBg,
          borderRadius: 20,
          padding: 40,
          maxWidth: 720,
          width: "100%",
          transform: `translateY(${layoutOffsetPercent}px)`,
        }}
        className={TRANSITION}
      >
        <div style={{ fontSize: 52, marginBottom: 16 }}>{content.icon}</div>
        <h1 style={{ fontSize: titleFontPx, fontWeight: 700, marginBottom: 12, color: accentColor }}>
          {content.title}
        </h1>
        <p style={{ lineHeight: 1.7, color: textPrimary, marginBottom: content.steps ? 24 : 32 }}>
          {content.body}
        </p>

        {content.steps && (
          <ol
            style={{
              listStyle: "none",
              margin: "0 0 32px",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {content.steps.map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 14px",
                  background: `${accentColor}11`,
                  borderRadius: 10,
                  borderLeft: t.dir === "rtl" ? "none" : `3px solid ${accentColor}`,
                  borderRight: t.dir === "rtl" ? `3px solid ${accentColor}` : "none",
                  fontSize: baseFontPx * 0.95,
                  lineHeight: 1.5,
                  color: textPrimary,
                  fontFamily: step.includes("·") ? "monospace" : "inherit",
                }}
              >
                <span style={{ color: accentColor, fontWeight: 700, minWidth: 22, flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span style={{ color: textSecondary }}>{step}</span>
              </li>
            ))}
          </ol>
        )}

        <button
          onClick={onBack}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          style={{
            background: accentColor,
            border: "none",
            borderRadius: 10,
            padding: "14px 32px",
            fontSize: baseFontPx,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "opacity 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {t.backButton}
        </button>
      </div>
    </div>
  );
};
