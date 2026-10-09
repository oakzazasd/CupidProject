export const MAX_FILE_MB = 8;
export const MAX_DIMENSION = 1280;

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageValidationError("ไฟล์นี้ไม่รองรับ กรุณาใช้รูป JPEG, PNG หรือ WebP");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new ImageValidationError("รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่มีขนาดเล็กลง");
  }
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ImageValidationError("อ่านไฟล์ไม่สำเร็จ ลองเลือกรูปใหม่นะ"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ImageValidationError("เปิดรูปไม่ได้ ไฟล์อาจเสียหาย ลองรูปอื่นนะ"));
    img.src = src;
  });
}

export async function compressToDataUrl(input: string | File): Promise<string> {
  let src: string;
  if (typeof input === "string") {
    src = input;
  } else {
    validateFile(input);
    src = await readAsDataUrl(input);
  }
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return src;
  }
}
