// Utilitas kamera & kompresi foto bukti presensi (khusus klien).
// Foto diperkecil di sisi klien lalu dikirim sebagai data URL JPEG agar
// ukurannya wajar disimpan di D1.

const MAX_DIMENSION = 720;
const JPEG_QUALITY = 0.7;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar."));
    image.src = src;
  });
}

function drawCompressed(
  source: CanvasImageSource,
  width: number,
  height: number,
): string {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas tidak tersedia.");
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

/** Kompres file gambar pilihan pengguna menjadi data URL JPEG kecil. */
export async function fileToCompressedDataUrl(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    return drawCompressed(image, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Ambil satu frame dari elemen video kamera sebagai data URL JPEG kecil. */
export function captureVideoFrame(video: HTMLVideoElement): string {
  return drawCompressed(video, video.videoWidth, video.videoHeight);
}
