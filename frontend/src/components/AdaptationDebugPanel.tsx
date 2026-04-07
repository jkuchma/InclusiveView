import React from "react";
import type { AdaptationParams, SensorState } from "../types/adaptation";

interface Props {
  sensor: SensorState;
  adaptation: AdaptationParams;
  connected: boolean;
  caneStub: boolean;
  gazeStub: boolean;
  onToggleCane: () => void;
  onToggleGaze: () => void;
  visible: boolean;
  onToggleVisible: () => void;
}

const pill = (label: string, value: string, ok: boolean) => (
  <div
    key={label}
    style={{
      background: ok ? "#1a3a1a" : "#2a1a1a",
      border: `1px solid ${ok ? "#2a6a2a" : "#6a2a2a"}`,
      borderRadius: 8,
      padding: "6px 12px",
      display: "flex",
      gap: 8,
      alignItems: "center",
    }}
  >
    <span style={{ fontSize: 11, color: "#aaa" }}>{label}</span>
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: ok ? "#6ef26e" : "#f27070",
        fontFamily: "monospace",
      }}
    >
      {value}
    </span>
  </div>
);

const stubBtn = (label: string, active: boolean, onClick: () => void) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#553300" : "#1a1a2e",
      border: `1px solid ${active ? "#ffaa00" : "#334"}`,
      borderRadius: 8,
      padding: "8px 14px",
      color: active ? "#ffdd88" : "#aaa",
      cursor: "pointer",
      fontSize: 12,
      fontFamily: "monospace",
      transition: "all 0.2s",
    }}
    title={`Press ${label.includes("Cane") ? "C" : "G"} key to toggle`}
  >
    {active ? "✓ " : "○ "}{label}
  </button>
);

export const AdaptationDebugPanel: React.FC<Props> = ({
  sensor,
  adaptation,
  connected,
  caneStub,
  gazeStub,
  onToggleCane,
  onToggleGaze,
  visible,
  onToggleVisible,
}) => {
  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={onToggleVisible}
        style={{
          position: "fixed",
          top: 80,
          right: 0,
          background: "#0d2244",
          border: "1px solid #1e3a6e",
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          color: "#8aabcf",
          padding: "10px 8px",
          cursor: "pointer",
          fontSize: 12,
          writingMode: "vertical-rl",
          letterSpacing: 1,
          zIndex: 100,
        }}
      >
        {visible ? "▶ Debug" : "◀ Debug"}
      </button>

      {/* Panel */}
      {visible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 300,
            height: "100vh",
            background: "#050e1c",
            borderLeft: "1px solid #1e3a6e",
            padding: "20px 16px",
            overflowY: "auto",
            zIndex: 99,
            fontFamily: "monospace",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 14, color: "#4285f4", fontWeight: 700, letterSpacing: 1 }}>
            InclusiveView Debug
          </div>

          {/* Connection */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#556", textTransform: "uppercase", letterSpacing: 1 }}>
              Backend
            </div>
            {pill("WS", connected ? "connected" : "disconnected", connected)}
          </div>

          {/* Sensor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#556", textTransform: "uppercase", letterSpacing: 1 }}>
              Sensor
            </div>
            {pill("posture", sensor.posture, sensor.posture !== "unknown" && sensor.posture !== "no_person")}
            {pill("distance", sensor.distance, sensor.distance !== "unknown")}
            {pill("landmarks", sensor.landmarks_detected ? "yes" : "no", sensor.landmarks_detected)}
          </div>

          {/* Adaptation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#556", textTransform: "uppercase", letterSpacing: 1 }}>
              Adaptation
            </div>
            {pill("layout↓", `${adaptation.layoutOffsetPercent}px`, adaptation.layoutOffsetPercent > 0)}
            {pill("fontScale", adaptation.fontScale.toFixed(2), adaptation.fontScale !== 1)}
            {pill("contrast", adaptation.highContrast ? "HIGH" : "normal", adaptation.highContrast)}
            {pill("btnScale", adaptation.buttonScale.toFixed(2), adaptation.buttonScale !== 1)}
            {pill("voice", adaptation.voiceMode ? "ON" : "off", adaptation.voiceMode)}
          </div>

          {/* Keyboard stubs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#556", textTransform: "uppercase", letterSpacing: 1 }}>
              Keyboard Stubs
            </div>
            {stubBtn("White Cane (C)", caneStub, onToggleCane)}
            {stubBtn("No Gaze (G)", gazeStub, onToggleGaze)}
            <div style={{ fontSize: 10, color: "#445", marginTop: 2 }}>
              Press <b style={{ color: "#8aabcf" }}>C</b> or <b style={{ color: "#8aabcf" }}>G</b> on keyboard to toggle
            </div>
          </div>

          {/* Active label */}
          <div style={{ fontSize: 11, color: "#8aabcf", marginTop: 4, lineHeight: 1.5 }}>
            <b>Status:</b> {adaptation.label || "—"}
          </div>
        </div>
      )}
    </>
  );
};
