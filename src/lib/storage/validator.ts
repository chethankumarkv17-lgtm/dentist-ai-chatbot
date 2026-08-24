export type AllowedAssetType = 'logo' | 'dentist_photo' | 'clinic_image';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
  detectedExtension?: string;
  sanitizedFilename?: string;
}

export const MAX_SIZE_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
export const MAX_SIZE_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'php3', 'php4', 'php5', 'phar',
  'js', 'ts', 'jsx', 'tsx', 'html', 'htm', 'shtml', 'svg', 'xml', 'py', 'pl',
  'cgi', 'rb', 'jar', 'war', 'jsp', 'asp', 'aspx', 'dll', 'so', 'dylib', 'bin',
  'vbs', 'ps1', 'psm1', 'scr', 'msi', 'com', 'pdf', 'zip', 'tar', 'gz', 'rar'
]);

/**
 * Inspects binary magic numbers to determine the true content type.
 * Never trust browser-provided Content-Type headers!
 */
export function detectMagicMimeType(buffer: Uint8Array): { mimeType: string; extension: string } | null {
  if (buffer.length < 12) return null;

  // 1. JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // 3. WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  return null;
}

/**
 * Sanitizes original filename and strips dangerous path traversal sequences.
 */
export function sanitizeFilename(originalName: string): string {
  // Strip path traversal (../ or ..\)
  const basename = originalName.replace(/^.*[\\/]/, '');
  // Remove special characters, control characters, null bytes
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  return sanitized.length > 0 ? sanitized : 'upload.jpg';
}

/**
 * Strictly validates an uploaded file buffer against magic bytes, size limits,
 * extension whitelist, and executable patterns.
 */
export function validateSecureUpload(
  fileBuffer: Uint8Array,
  originalFilename: string,
  assetType: AllowedAssetType = 'clinic_image'
): ValidationResult {
  // 1. Check file size
  const maxSize = assetType === 'logo' ? MAX_SIZE_LOGO_BYTES : MAX_SIZE_IMAGE_BYTES;
  if (!fileBuffer || fileBuffer.length === 0) {
    return { valid: false, error: 'Uploaded file is empty.' };
  }

  if (fileBuffer.length > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum allowed size of ${maxMb}MB.` };
  }

  // 2. Check original extension against dangerous/executable list
  const sanitized = sanitizeFilename(originalFilename);
  const extParts = sanitized.split('.');
  if (extParts.length < 2) {
    return { valid: false, error: 'File must have a valid image extension (.jpg, .jpeg, .png, .webp).' };
  }

  const declaredExt = extParts[extParts.length - 1].toLowerCase();
  if (DISALLOWED_EXTENSIONS.has(declaredExt)) {
    return { valid: false, error: `File type ".${declaredExt}" is not permitted for security reasons.` };
  }

  // 3. Inspect binary magic numbers (Anti-Spoofing)
  const magic = detectMagicMimeType(fileBuffer);
  if (!magic) {
    return {
      valid: false,
      error: 'Invalid file format. The file content does not match a genuine JPEG, PNG, or WebP image.',
    };
  }

  // 4. Verify extension matches magic bytes
  const allowedExtensionsForMime: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };

  const allowedExts = allowedExtensionsForMime[magic.mimeType] || [];
  if (!allowedExts.includes(declaredExt)) {
    return {
      valid: false,
      error: `Extension mismatch: file claims to be ".${declaredExt}" but binary content is "${magic.mimeType}".`,
    };
  }

  return {
    valid: true,
    detectedMimeType: magic.mimeType,
    detectedExtension: magic.extension,
    sanitizedFilename: sanitized,
  };
}
