import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          setReady(true);
        }
      } catch {
        setError("ไม่ได้รับอนุญาตให้ใช้กล้อง เปิดสิทธิ์ในเบราว์เซอร์แล้วลองใหม่ หรือเลือกไฟล์แทนได้เลย");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  async function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="ถ่ายรูป"
    >
      <div className="glass w-full max-w-md p-5 fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">ถ่ายรูปด้วยกล้อง 📸</h3>
          <button className="btn btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label="ปิดกล้อง">
            <X size={18} />
          </button>
        </div>
        {error ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm leading-relaxed">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="aspect-[3/4] w-full object-cover"
              />
            </div>
            <button className="btn btn-primary mt-4 w-full" onClick={snap} disabled={!ready}>
              <Camera size={18} />
              {ready ? "ถ่ายเลย!" : "กำลังเปิดกล้อง..."}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
