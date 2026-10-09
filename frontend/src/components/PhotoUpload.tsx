import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { compressToDataUrl, ImageValidationError, validateFile } from "../lib/imageProcessing";
import { CameraCapture } from "./CameraCapture";

interface PhotoUploadProps {
  which: "user" | "crush";
  title: string;
  hint: string;
  photo: string | null;
  onSet: (dataUrl: string) => void;
  onRemove: () => void;
}

const isCoarse = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export function PhotoUpload({ which, title, hint, photo, onSet, onRemove }: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      validateFile(file);
      const dataUrl = await compressToDataUrl(file);
      onSet(dataUrl);
    } catch (e) {
      setError(e instanceof ImageValidationError ? e.message : "ประมวลผลรูปไม่สำเร็จ ลองรูปอื่นนะ");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openCamera() {
    if (isCoarse() || !navigator.mediaDevices?.getUserMedia) {
      captureRef.current?.click();
      return;
    }
    setCameraOpen(true);
  }

  return (
    <div className="glass p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        {photo && (
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-emerald-300">
            พร้อมแล้ว
          </span>
        )}
      </div>

      {photo ? (
        <div className="photo-pop space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            <img
              src={photo}
              alt={title}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                className="btn btn-ghost !bg-black/60 !p-2"
                onClick={() => {
                  onRemove();
                  fileRef.current?.click();
                }}
                aria-label={`เปลี่ยน${title}`}
                title={`เปลี่ยน${title}`}
              >
                <ImagePlus size={16} />
              </button>
              <button
                className="btn btn-ghost !bg-black/60 !p-2"
                onClick={onRemove}
                aria-label={`ลบ${title}`}
                title={`ลบ${title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <p className="text-[0.72rem] leading-relaxed text-muted">
            {hint}
          </p>
        </div>
      ) : (
        <div
          className={`upload-zone flex flex-col items-center justify-center gap-3 px-4 py-8 text-center ${
            drag ? "upload-zone--drag" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent-soft">
            <ImagePlus size={24} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {busy ? "กำลังเตรียมรูป..." : "ลากรูปมาวาง หรือกดเลือกไฟล์"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              JPEG / PNG / WebP ไม่เกิน 8MB — {hint}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className="btn btn-ghost !py-2 text-sm"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <ImagePlus size={16} />
              เลือกไฟล์
            </button>
            <button
              className="btn btn-outline-accent !py-2 text-sm"
              onClick={openCamera}
              disabled={busy}
            >
              <Camera size={16} />
              ถ่ายรูป
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-200">
          {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={captureRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-hidden="true"
      />

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={async (dataUrl) => {
            setCameraOpen(false);
            setBusy(true);
            try {
              onSet(await compressToDataUrl(dataUrl));
            } catch {
              setError("ประมวลผลรูปไม่สำเร็จ ลองอีกครั้งนะ");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      <span className="hidden">{which}</span>
    </div>
  );
}
