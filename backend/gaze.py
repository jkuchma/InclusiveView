"""Gaze / eye-contact estimation from MediaPipe Face Landmarker iris landmarks."""

from __future__ import annotations

from collections import deque
from typing import Any

from mediapipe.tasks.python.vision import FaceLandmarkerResult

# Face mesh indices (478 landmarks with iris refinement)
LEFT_EYE_OUTER = 33
LEFT_EYE_INNER = 133
LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145
RIGHT_EYE_OUTER = 263
RIGHT_EYE_INNER = 362
RIGHT_EYE_TOP = 386
RIGHT_EYE_BOTTOM = 374
LEFT_IRIS = 468
RIGHT_IRIS = 473
NOSE_TIP = 1
LEFT_CHEEK = 234
RIGHT_CHEEK = 454

# Iris horizontal ratio near 0.5 when looking at the camera / kiosk screen.
HORIZONTAL_CENTER_TOLERANCE = 0.17
HEAD_YAW_TOLERANCE = 0.055
HEAD_PITCH_TOLERANCE = 0.09

# Require sustained off-screen gaze before triggering voice assistance.
OFF_GAZE_FRAMES_REQUIRED = 6
OFF_GAZE_WINDOW = 10

_off_gaze_history: deque[bool] = deque(maxlen=OFF_GAZE_WINDOW)


def _lm(landmarks: list[Any], index: int):
    return landmarks[index]


def _iris_horizontal_ratio(
    iris_x: float,
    outer_x: float,
    inner_x: float,
) -> float | None:
    width = inner_x - outer_x
    if abs(width) < 1e-4:
        return None
    return (iris_x - outer_x) / width


def _instant_looking_at_screen(landmarks: list[Any]) -> tuple[bool, float | None]:
    left_ratio = _iris_horizontal_ratio(
        _lm(landmarks, LEFT_IRIS).x,
        _lm(landmarks, LEFT_EYE_OUTER).x,
        _lm(landmarks, LEFT_EYE_INNER).x,
    )
    right_ratio = _iris_horizontal_ratio(
        _lm(landmarks, RIGHT_IRIS).x,
        _lm(landmarks, RIGHT_EYE_OUTER).x,
        _lm(landmarks, RIGHT_EYE_INNER).x,
    )

    if left_ratio is None or right_ratio is None:
        return True, None

    gaze_ratio = (left_ratio + right_ratio) / 2.0

    left_dev = abs(left_ratio - 0.5)
    right_dev = abs(right_ratio - 0.5)

    cheek_mid_x = (_lm(landmarks, LEFT_CHEEK).x + _lm(landmarks, RIGHT_CHEEK).x) / 2.0
    head_yaw = _lm(landmarks, NOSE_TIP).x - cheek_mid_x

    left_eye_mid_y = (
        _lm(landmarks, LEFT_EYE_TOP).y + _lm(landmarks, LEFT_EYE_BOTTOM).y
    ) / 2.0
    right_eye_mid_y = (
        _lm(landmarks, RIGHT_EYE_TOP).y + _lm(landmarks, RIGHT_EYE_BOTTOM).y
    ) / 2.0
    eye_mid_y = (left_eye_mid_y + right_eye_mid_y) / 2.0
    head_pitch = _lm(landmarks, NOSE_TIP).y - eye_mid_y

    eyes_centered = (
        left_dev <= HORIZONTAL_CENTER_TOLERANCE
        and right_dev <= HORIZONTAL_CENTER_TOLERANCE
    )
    head_forward = (
        abs(head_yaw) <= HEAD_YAW_TOLERANCE
        and abs(head_pitch) <= HEAD_PITCH_TOLERANCE
    )

    return eyes_centered and head_forward, round(gaze_ratio, 3)


def classify_gaze(result: FaceLandmarkerResult) -> dict:
    """Classify whether the user is making eye contact with the kiosk screen."""
    if not result.face_landmarks:
        _off_gaze_history.clear()
        return {
            "gaze_detected": False,
            "looking_at_screen": True,
            "gaze_ratio": None,
        }

    landmarks = result.face_landmarks[0]
    instant_looking, gaze_ratio = _instant_looking_at_screen(landmarks)

    _off_gaze_history.append(not instant_looking)
    off_gaze_count = sum(_off_gaze_history)
    looking_at_screen = off_gaze_count < OFF_GAZE_FRAMES_REQUIRED

    return {
        "gaze_detected": True,
        "looking_at_screen": looking_at_screen,
        "gaze_ratio": gaze_ratio,
    }
