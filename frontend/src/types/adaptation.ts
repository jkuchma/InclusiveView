// Posture detected by MediaPipe Pose
export type Posture =
  | "standing"
  | "seated"
  | "child"
  | "crouched"
  | "no_person"
  | "unknown";

// Viewing distance estimated from torso size
export type Distance = "close" | "medium" | "far" | "unknown";

// Raw state streamed from backend via WebSocket
export interface SensorState {
  posture: Posture;
  distance: Distance;
  landmarks_detected: boolean;
  timestamp_ms: number;

  // Gaze detection streamed from backend
  gaze_detected: boolean;
  looking_at_screen: boolean;
  gaze_ratio?: number | null;

  // Optional debug/calibration values from backend
  torso_len?: number;
  nose_to_shoulder?: number;
  hips_visible?: boolean;
}

// Derived UI adaptation parameters
export interface AdaptationParams {
  // Layout vertical offset as percentage of viewport height (0 = top, positive = lower)
  layoutOffsetPercent: number;
  // Font scale multiplier (1.0 = normal)
  fontScale: number;
  // High-contrast mode
  highContrast: boolean;
  // Button size scale (1.0 = normal)
  buttonScale: number;
  // Voice assistant active
  voiceMode: boolean;
  // Accessibility label for debug overlay
  label: string;
}

// Keyboard stub triggers
export type StubKey = "cane";