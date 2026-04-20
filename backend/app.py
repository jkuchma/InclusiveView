import asyncio
import json
import threading
import time
from collections import deque

import cv2
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ── Stabilization config ──────────────────────────────────────────────────────
HISTORY_LEN = 10       # frames kept in the sliding window
STABLE_THRESHOLD = 6   # majority needed to commit a new value


def _mode(history: deque, fallback: str) -> str:
    """Return the most common value if it meets STABLE_THRESHOLD, else fallback."""
    if not history:
        return fallback
    counts: dict[str, int] = {}
    for v in history:
        counts[v] = counts.get(v, 0) + 1
    best = max(counts, key=lambda k: counts[k])
    return best if counts[best] >= STABLE_THRESHOLD else fallback


posture_history: deque = deque(maxlen=HISTORY_LEN)
distance_history: deque = deque(maxlen=HISTORY_LEN)

app = FastAPI(title="InclusiveView Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_state = {
    "posture": "unknown",
    "distance": "unknown",
    "landmarks_detected": False,
    "timestamp_ms": 0,
}

state_lock = threading.Lock()

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
PoseLandmarkerResult = mp.tasks.vision.PoseLandmarkerResult
RunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = "pose_landmarker.task"


def classify_posture(result: PoseLandmarkerResult) -> dict:
    if not result.pose_landmarks or len(result.pose_landmarks) == 0:
        return {
            "posture": "no_person",
            "distance": "unknown",
            "landmarks_detected": False,
        }

    landmarks = result.pose_landmarks[0]

    def lm(index: int):
        return landmarks[index]

    def vis(index: int) -> float:
        return landmarks[index].visibility if hasattr(landmarks[index], 'visibility') else 1.0

    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    NOSE = 0

    left_shoulder = lm(LEFT_SHOULDER)
    right_shoulder = lm(RIGHT_SHOULDER)
    left_hip = lm(LEFT_HIP)
    right_hip = lm(RIGHT_HIP)
    left_knee = lm(LEFT_KNEE)
    right_knee = lm(RIGHT_KNEE)
    nose = lm(NOSE)

    shoulder_y = (left_shoulder.y + right_shoulder.y) / 2.0
    hip_y = (left_hip.y + right_hip.y) / 2.0
    knee_y = (left_knee.y + right_knee.y) / 2.0
    shoulder_spread = abs(left_shoulder.x - right_shoulder.x)

    # Use face size (nose-to-shoulder distance) for distance when hips not visible
    nose_to_shoulder = abs(nose.y - shoulder_y)
    hips_visible = (vis(LEFT_HIP) > 0.3 and vis(RIGHT_HIP) > 0.3)

    torso_len = abs(hip_y - shoulder_y) if hips_visible else nose_to_shoulder * 0.8
    hip_to_knee = abs(knee_y - hip_y) if hips_visible else 0.5  # assume standing if hips not visible

    if hips_visible:
        # Thresholds tuned for a typical ~60 cm – 150 cm standing range
        if torso_len > 0.38:
            distance = "close"
        elif torso_len > 0.20:
            distance = "medium"
        else:
            distance = "far"
    else:
        if nose_to_shoulder > 0.18:
            distance = "close"
        elif nose_to_shoulder > 0.10:
            distance = "medium"
        else:
            distance = "far"

    if not hips_visible:
        # Only upper body visible — classify from shoulder position in frame
        if shoulder_y > 0.6:
            posture = "seated"
        else:
            posture = "standing"
    elif hip_to_knee < 0.12:
        posture = "seated"
    elif torso_len < 0.12:
        posture = "unknown"
    elif nose.y < shoulder_y < hip_y < knee_y:
        if torso_len < 0.18 and shoulder_spread < 0.18:
            posture = "child"
        else:
            posture = "standing"
    else:
        posture = "crouched"

    return {
        "posture": posture,
        "distance": distance,
        "landmarks_detected": True,
    }


def result_callback(result: PoseLandmarkerResult, output_image: mp.Image, timestamp_ms: int) -> None:
    raw = classify_posture(result)

    # Feed raw values into history windows
    posture_history.append(raw["posture"])
    distance_history.append(raw["distance"])

    # Use current stable value as fallback so we never flip to "unknown" on a bad frame
    with state_lock:
        current_posture = latest_state["posture"]
        current_distance = latest_state["distance"]

    stable_posture = _mode(posture_history, current_posture)
    stable_distance = _mode(distance_history, current_distance)

    stabilized = {
        "posture": stable_posture,
        "distance": stable_distance,
        "landmarks_detected": raw["landmarks_detected"],
        "timestamp_ms": timestamp_ms,
    }

    with state_lock:
        latest_state.update(stabilized)


def camera_loop() -> None:
    options = PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=RunningMode.LIVE_STREAM,
        num_poses=1,
        min_pose_detection_confidence=0.3,
        min_pose_presence_confidence=0.3,
        min_tracking_confidence=0.3,
        result_callback=result_callback,
    )

    import platform
    backend_id = cv2.CAP_DSHOW if platform.system() == "Windows" else cv2.CAP_ANY
    cap = cv2.VideoCapture(0, backend_id)

    if not cap.isOpened():
        print("ERROR: Could not open webcam.")
        return

    with PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, frame = cap.read()
            if not ok:
                continue

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            timestamp_ms = int(time.time() * 1000)
            landmarker.detect_async(mp_image, timestamp_ms)

            # cv2.imshow is not safe from background threads on macOS.
            # Pose state is streamed to the frontend via WebSocket instead.
            time.sleep(0.01)  # ~100 fps cap to avoid busy-spin

    cap.release()


@app.on_event("startup")
async def startup_event():
    thread = threading.Thread(target=camera_loop, daemon=True)
    thread.start()


@app.get("/health")
async def health():
    with state_lock:
        return {"status": "ok", "latest_state": latest_state}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            with state_lock:
                payload = latest_state.copy()

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Frontend disconnected.")