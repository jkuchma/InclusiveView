import { useEffect, useRef, useState, useCallback } from "react";
import type { SensorState, AdaptationParams } from "../types/adaptation";

const WS_URL = "ws://localhost:8000/ws";
const RECONNECT_DELAY_MS = 2000;

function deriveAdaptation(
  sensor: SensorState,
  caneStub: boolean,
  gazeStub: boolean
): AdaptationParams {
  let layoutOffsetPercent = 0;
  let fontScale = 1.0;
  let highContrast = false;
  let buttonScale = 1.0;
  let label = "";

  // ── Posture-based layout adaptation ──────────────────────────────────
  switch (sensor.posture) {
    case "seated":
      // Wheelchair / seated user: lower the interactive panel
      layoutOffsetPercent = 20;
      buttonScale = 1.15;
      label = "Wheelchair / Seated";
      break;
    case "child":
      // Child: lower the panel and scale up text for readability
      layoutOffsetPercent = 25;
      fontScale = 1.2;
      buttonScale = 1.2;
      label = "Child";
      break;
    case "crouched":
      layoutOffsetPercent = 15;
      label = "Crouching";
      break;
    case "standing":
      layoutOffsetPercent = 0;
      label = "Standing";
      break;
    case "no_person":
      label = "No person detected";
      break;
    default:
      label = "Detecting…";
  }

  // ── Distance-based visual adaptation ────────────────────────────────
  if (sensor.distance === "close") {
    // User close → low vision indicator: increase font + contrast
    fontScale = Math.max(fontScale, 1.35);
    highContrast = true;
    label += " | Close (Low Vision Mode)";
  } else if (sensor.distance === "far") {
    fontScale = Math.min(fontScale, 0.9);
    label += " | Far";
  }

  // ── Stub triggers ────────────────────────────────────────────────────
  const voiceMode = caneStub || gazeStub;
  if (voiceMode) {
    highContrast = true;
    label += caneStub ? " | White Cane Detected" : " | No Eye Contact";
  }

  return { layoutOffsetPercent, fontScale, highContrast, buttonScale, voiceMode, label };
}

interface UseAdaptationReturn {
  sensor: SensorState;
  adaptation: AdaptationParams;
  connected: boolean;
  caneStub: boolean;
  gazeStub: boolean;
  toggleCane: () => void;
  toggleGaze: () => void;
}

const DEFAULT_SENSOR: SensorState = {
  posture: "unknown",
  distance: "unknown",
  landmarks_detected: false,
  timestamp_ms: 0,
};

export function useAdaptation(): UseAdaptationReturn {
  const [sensor, setSensor] = useState<SensorState>(DEFAULT_SENSOR);
  const [connected, setConnected] = useState(false);
  const [caneStub, setCaneStub] = useState(false);
  const [gazeStub, setGazeStub] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SensorState;
        setSensor(data);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Keyboard shortcuts: C = white cane toggle, G = gaze (no eye contact) toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") setCaneStub((v) => !v);
      if (e.key === "g" || e.key === "G") setGazeStub((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const adaptation = deriveAdaptation(sensor, caneStub, gazeStub);

  return {
    sensor,
    adaptation,
    connected,
    caneStub,
    gazeStub,
    toggleCane: () => setCaneStub((v) => !v),
    toggleGaze: () => setGazeStub((v) => !v),
  };
}
