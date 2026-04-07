import React, { useEffect, useRef, useState } from "react";

export const CameraPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((e) => setError(e.message));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "#556", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Camera Preview
      </div>
      {error ? (
        <div style={{ fontSize: 11, color: "#f27070", padding: 8, background: "#2a1a1a", borderRadius: 6 }}>
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #1e3a6e",
            transform: "scaleX(-1)", // mirror
            background: "#000",
            maxHeight: 160,
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
};
