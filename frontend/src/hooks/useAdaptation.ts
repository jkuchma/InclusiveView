import { useEffect, useRef, useState, useCallback } from "react";
import type { SensorState, AdaptationParams } from "../types/adaptation";

const WS_URL = "ws://localhost:8000/ws";
const RECONNECT_DELAY_MS = 2000;

function deriveAdaptation(
  sensor: SensorState,
  caneStub: boolean
): AdaptationParams {
  let layoutOffsetPercent = 0;
  let fontScale = 1.0;
  let highContrast = false;
  let buttonScale = 1.0;
  let label = "";

  switch (sensor.posture) {
    case "seated":
      layoutOffsetPercent = 20;
      buttonScale = 1.15;
      label = "Wheelchair / Seated";
      break;

    case "child":
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

  if (sensor.distance === "close") {
    fontScale = Math.max(fontScale, 1.35);
    highContrast = true;
    label += " | Close / Low Vision Mode";
  } else if (sensor.distance === "far") {
    fontScale = Math.min(fontScale, 0.9);
    label += " | Far";
  }

  const gazeNeedsAssistance =
    sensor.gaze_detected === true &&
    sensor.looking_at_screen === false;

  const voiceMode = caneStub || gazeNeedsAssistance;

  if (voiceMode) {
    highContrast = true;

    if (caneStub) {
      label += " | White Cane Detected";
    } else if (gazeNeedsAssistance) {
      label += " | Not Looking at Screen";
    }
  }

  return {
    layoutOffsetPercent,
    fontScale,
    highContrast,
    buttonScale,
    voiceMode,
    label,
  };
}

interface UseAdaptationReturn {
  sensor: SensorState;
  adaptation: AdaptationParams;
  connected: boolean;
  caneStub: boolean;
  toggleCane: () => void;
}

const DEFAULT_SENSOR: SensorState = {
  posture: "unknown",
  distance: "unknown",
  landmarks_detected: false,
  timestamp_ms: 0,

  gaze_detected: false,
  looking_at_screen: true,
  gaze_ratio: null,

  torso_len: undefined,
  nose_to_shoulder: undefined,
  hips_visible: undefined,
};

export function useAdaptation(): UseAdaptationReturn {
  const [sensor, setSensor] = useState<SensorState>(DEFAULT_SENSOR);
  const [connected, setConnected] = useState(false);
  const [caneStub, setCaneStub] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<SensorState>;

        setSensor({
          ...DEFAULT_SENSOR,
          ...data,
        });
      } catch {
        // Ignore malformed WebSocket messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Keyboard shortcut:
  // C = simulate white cane detection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        setCaneStub((v) => !v);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const adaptation = deriveAdaptation(sensor, caneStub);

  return {
    sensor,
    adaptation,
    connected,
    caneStub,
    toggleCane: () => setCaneStub((v) => !v),
  };
}