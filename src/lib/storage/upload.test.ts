import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateSecureUpload,
  detectMagicMimeType,
  sanitizeFilename,
} from './validator';
import {
  uploadClinicAsset,
  getClinicAssets,
  deleteClinicAsset,
} from './service';

// --- IN-MEMORY DATABASE & STORAGE MOCK ---
interface MockDb {
  uploaded_assets: {
    id: string;
    organization_id: string;
    uploaded_by?: string;
    asset_type: string;
    storage_path: string;
    public_url: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
    created_at: string;
  }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  uploaded_assets: [
    {
      id: 'asset-1',
      organization_id: 'org-clinic-a',
      uploaded_by: 'user-1',
      asset_type: 'logo',
      storage_path: 'organizations/org-clinic-a/logo/logo-1.png',
      public_url: 'https://example.com/logo-1.png',
      file_name: 'clinic_logo.png',
      mime_type: 'image/png',
      file_size_bytes: 45000,
      created_at: '2026-08-20T10:00:00Z',
    },
  ],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn(() => obj),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      order: vi.fn(() => obj),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `asset-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: item, error: null })),
          })),
          data: item,
          error: null,
        };
      }),
      delete: vi.fn(() => {
        return {
          eq: vi.fn((field: string, val: unknown) => {
            const initial = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = initial.filter(r => r[field] !== val);
            return { data: null, error: null };
          }),
        };
      }),
      then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: result }),
    };

    return obj;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
        getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://storage.radiantnobel.com/${path}` } })),
        remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    },
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

// Helper to create synthetic magic byte image buffers
function createFakeJpegBuffer(size = 100): Uint8Array {
  const buf = new Uint8Array(size);
  buf[0] = 0xFF;
  buf[1] = 0xD8;
  buf[2] = 0xFF;
  buf[3] = 0xE0;
  return buf;
}

function createFakePngBuffer(size = 100): Uint8Array {
  const buf = new Uint8Array(size);
  buf[0] = 0x89;
  buf[1] = 0x50; // P
  buf[2] = 0x4E; // N
  buf[3] = 0x47; // G
  buf[4] = 0x0D;
  buf[5] = 0x0A;
  buf[6] = 0x1A;
  buf[7] = 0x0A;
  return buf;
}

function createFakeWebpBuffer(size = 100): Uint8Array {
  const buf = new Uint8Array(size);
  // RIFF
  buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46;
  // WEBP at offset 8
  buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50;
  return buf;
}

describe('Phase 28 — Secure File Uploads & Asset Protection', () => {
  beforeEach(() => {
    mockDbState.uploaded_assets = [
      {
        id: 'asset-1',
        organization_id: 'org-clinic-a',
        uploaded_by: 'user-1',
        asset_type: 'logo',
        storage_path: 'organizations/org-clinic-a/logo/logo-1.png',
        public_url: 'https://example.com/logo-1.png',
        file_name: 'clinic_logo.png',
        mime_type: 'image/png',
        file_size_bytes: 45000,
        created_at: '2026-08-20T10:00:00Z',
      },
    ];
  });

  describe('1. Binary Magic Byte & Extension Validation', () => {
    it('detects genuine JPEG, PNG, and WebP binary headers', () => {
      const jpeg = detectMagicMimeType(createFakeJpegBuffer());
      expect(jpeg?.mimeType).toBe('image/jpeg');
      expect(jpeg?.extension).toBe('jpg');

      const png = detectMagicMimeType(createFakePngBuffer());
      expect(png?.mimeType).toBe('image/png');
      expect(png?.extension).toBe('png');

      const webp = detectMagicMimeType(createFakeWebpBuffer());
      expect(webp?.mimeType).toBe('image/webp');
      expect(webp?.extension).toBe('webp');
    });

    it('approves valid images with matching extensions', () => {
      const res = validateSecureUpload(createFakeJpegBuffer(), 'dentist-headshot.jpg', 'dentist_photo');
      expect(res.valid).toBe(true);
      expect(res.detectedMimeType).toBe('image/jpeg');
    });
  });

  describe('2. Malicious File & Executable Prevention', () => {
    it('rejects executable files disguised with an image extension', () => {
      // Create PE executable header (MZ = 4D 5A) disguised as .png
      const fakeExe = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      const res = validateSecureUpload(fakeExe, 'malware.png', 'clinic_image');

      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invalid file format');
    });

    it('rejects PHP scripts and web shells', () => {
      const phpScript = new TextEncoder().encode('<?php system($_GET["cmd"]); ?>');
      const res = validateSecureUpload(phpScript, 'shell.php.png', 'clinic_image');

      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invalid file format');
    });

    it('rejects disallowed file extensions (exe, sh, pdf, svg)', () => {
      const buf = createFakeJpegBuffer();
      const resExe = validateSecureUpload(buf, 'payload.exe', 'clinic_image');
      expect(resExe.valid).toBe(false);
      expect(resExe.error).toContain('not permitted');

      const resSvg = validateSecureUpload(buf, 'vector.svg', 'logo');
      expect(resSvg.valid).toBe(false);
      expect(resSvg.error).toContain('not permitted');
    });

    it('rejects oversized files exceeding threshold', () => {
      const oversizedLogo = createFakePngBuffer(3 * 1024 * 1024); // 3MB (Limit is 2MB)
      const res = validateSecureUpload(oversizedLogo, 'logo.png', 'logo');

      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed size of 2MB');
    });
  });

  describe('3. Path Traversal & Filename Sanitization', () => {
    it('strips directory traversal and path separators from filenames', () => {
      expect(sanitizeFilename('../../../../etc/passwd.png')).toBe('passwd.png');
      expect(sanitizeFilename('..\\..\\Windows\\System32\\cmd.jpg')).toBe('cmd.jpg');
      expect(sanitizeFilename('Dr. John Smith (Photo #1!).jpg')).toBe('dr._john_smith__photo__1__.jpg');
    });
  });

  describe('4. Secure Upload Service & Tenant Isolation', () => {
    it('uploads asset into isolated tenant path and records database entry', async () => {
      const res = await uploadClinicAsset('org-clinic-a', 'user-1', 'dentist_photo', {
        name: 'dr_smith.jpg',
        buffer: createFakeJpegBuffer(5000),
      });

      expect(res.success).toBe(true);
      expect(res.asset?.storagePath).toContain('organizations/org-clinic-a/dentist_photo/');
      expect(res.asset?.publicUrl).toBeDefined();
    });

    it('lists only assets belonging to the requested clinic', async () => {
      const assets = await getClinicAssets('org-clinic-a');
      expect(assets.length).toBeGreaterThan(0);
      expect(assets[0].organizationId).toBe('org-clinic-a');
    });

    it('strictly prevents cross-tenant asset deletion', async () => {
      // Clinic B attempts to delete Clinic A's asset
      const res = await deleteClinicAsset('org-clinic-b', 'asset-1');
      expect(res.success).toBe(false);
      expect(res.error).toContain('access denied');
    });

    it('allows owner clinic to delete its own asset', async () => {
      const res = await deleteClinicAsset('org-clinic-a', 'asset-1');
      expect(res.success).toBe(true);
      expect(mockDbState.uploaded_assets.length).toBe(0);
    });
  });
});
