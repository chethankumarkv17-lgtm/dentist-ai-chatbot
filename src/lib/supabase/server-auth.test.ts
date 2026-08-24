import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyTenantAccess, requireTenantRole } from './server-auth';

// Mock the Next.js cookies module
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock the supabase SSR module
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn(() => ({
      from: vi.fn(() => ({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle,
          }),
        }),
      })),
    })),
  };
});

describe('Tenant Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyTenantAccess', () => {
    it('should return true if the database returns a membership record (RLS allowed)', async () => {
      mockSingle.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });
      
      const result = await verifyTenantAccess('tenant-A');
      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('organization_id', 'tenant-A');
    });

    it('should return false if malicious cross-tenant access is attempted (RLS blocks/returns empty)', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Row not found' } });
      
      const result = await verifyTenantAccess('tenant-B');
      expect(result).toBe(false);
      expect(mockEq).toHaveBeenCalledWith('organization_id', 'tenant-B');
    });
  });

  describe('requireTenantRole', () => {
    it('should return the role if the user has tenant access and allowed role', async () => {
      mockSingle.mockResolvedValueOnce({ data: { role: 'owner' }, error: null });
      
      const role = await requireTenantRole('tenant-A', ['owner', 'admin']);
      expect(role).toBe('owner');
    });

    it('should throw an Unauthorized error if user accesses cross-tenant boundaries', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      
      await expect(requireTenantRole('tenant-B')).rejects.toThrow('Unauthorized: Tenant access denied.');
    });

    it('should throw a Forbidden error if user role is insufficient within the tenant', async () => {
      mockSingle.mockResolvedValueOnce({ data: { role: 'member' }, error: null });
      
      await expect(requireTenantRole('tenant-A', ['admin', 'owner'])).rejects.toThrow('Forbidden: Insufficient role permissions.');
    });
  });
});
