export const HEIC_BLOCK_MESSAGE =
  'This photo format is not supported in your browser. On iPhone: Settings → Camera → Formats → Most Compatible. Or upload JPG/PNG.';

export const VIDEO_BLOCK_MESSAGE =
  'Video files are not supported. Please upload JPG or PNG photos only.';

export const PDF_BLOCK_MESSAGE =
  'PDF files are not supported. Please upload JPG or PNG photos only.';

export const WEBP_BLOCK_MESSAGE =
  'WEBP files are not supported. Please upload JPG or PNG photos only.';

export const UNSUPPORTED_FILE_MESSAGE =
  'Only JPG, PNG, or compatible iPhone photos are supported.';

export const UPLOAD_FORMAT_HINT =
  'JPG or PNG preferred. iPhone HEIC may work if your browser can convert it. PDF and video are not supported.';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (HEIC_MIME_TYPES.has(type)) return true;
  return /\.(heic|heif)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  if (file.type.toLowerCase().startsWith('video/')) return true;
  return /\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i.test(file.name);
}

export function isPdfFile(file: File): boolean {
  if (file.type.toLowerCase() === 'application/pdf') return true;
  return /\.pdf$/i.test(file.name);
}

export function isWebpFile(file: File): boolean {
  if (file.type.toLowerCase() === 'image/webp') return true;
  return /\.webp$/i.test(file.name);
}

export function isAllowedJpegOrPng(file: File): boolean {
  const type = file.type.toLowerCase();
  if (ALLOWED_MIME_TYPES.has(type)) return true;
  return /\.(jpe?g|png)$/i.test(file.name);
}

/** HEIC is allowed into compressImage — conversion may still fail in-browser. */
export function getFileRejectionReason(file: File): string | null {
  if (isVideoFile(file)) return VIDEO_BLOCK_MESSAGE;
  if (isPdfFile(file)) return PDF_BLOCK_MESSAGE;
  if (isWebpFile(file)) return WEBP_BLOCK_MESSAGE;
  if (isHeicFile(file)) return null;
  if (!isAllowedJpegOrPng(file)) return UNSUPPORTED_FILE_MESSAGE;
  return null;
}

export function getDataUrlMime(dataUrl: string): string {
  const match = String(dataUrl || '').match(/^data:([^;]+);/i);
  return match ? match[1].toLowerCase() : '';
}
