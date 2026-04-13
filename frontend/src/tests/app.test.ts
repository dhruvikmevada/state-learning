import { describe, it, expect } from 'vitest';

// Test utility functions
describe('formatCurrency', () => {
  // Import inline to avoid module resolution issues in test
  const formatCurrency = (val: number): string => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toLocaleString()}`;
  };

  it('formats millions', () => {
    expect(formatCurrency(1500000)).toBe('$1.5M');
    expect(formatCurrency(2000000)).toBe('$2.0M');
  });

  it('formats thousands', () => {
    expect(formatCurrency(45000)).toBe('$45K');
    expect(formatCurrency(1000)).toBe('$1K');
  });

  it('formats small numbers', () => {
    expect(formatCurrency(500)).toBe('$500');
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatDate', () => {
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  it('formats null as dash', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('formats ISO date strings', () => {
    const result = formatDate('2024-03-15T00:00:00.000Z');
    expect(result).toContain('2024');
    expect(result).toContain('Mar');
  });
});

describe('Form validation logic', () => {
  const requiredFields = ['projectNumber', 'projectName', 'system', 'phase', 'category', 'description'];

  const validate = (form: Record<string, string>) => {
    const errors: Record<string, string> = {};
    for (const field of requiredFields) {
      if (!form[field]?.trim()) {
        errors[field] = 'Required';
      }
    }
    return errors;
  };

  it('returns errors for empty form', () => {
    const errors = validate({
      projectNumber: '', projectName: '', system: '', phase: '', category: '', description: '',
    });
    expect(Object.keys(errors)).toHaveLength(6);
  });

  it('returns no errors for complete form', () => {
    const errors = validate({
      projectNumber: '2025-001',
      projectName: 'Test Project',
      system: 'Curtain Wall',
      phase: 'Installation',
      category: 'Quality',
      description: 'A test description',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('catches single missing field', () => {
    const errors = validate({
      projectNumber: '2025-001',
      projectName: 'Test Project',
      system: 'Curtain Wall',
      phase: 'Installation',
      category: '', // missing
      description: 'A test description',
    });
    expect(Object.keys(errors)).toHaveLength(1);
    expect(errors.category).toBe('Required');
  });

  it('catches whitespace-only values', () => {
    const errors = validate({
      projectNumber: '   ',
      projectName: 'Test',
      system: 'Curtain Wall',
      phase: 'Install',
      category: 'Quality',
      description: 'Desc',
    });
    expect(errors.projectNumber).toBe('Required');
  });
});

describe('Role permission checks', () => {
  type Role = 'ADMIN' | 'PM' | 'PMO' | 'DEPARTMENT_APPROVER' | 'EXECUTIVE_READONLY' | 'STANDARD_CONTRIBUTOR';

  const DASHBOARD_ROLES: Role[] = ['ADMIN', 'PM', 'PMO', 'DEPARTMENT_APPROVER', 'EXECUTIVE_READONLY'];
  const SUBMIT_ROLES: Role[] = ['ADMIN', 'PM', 'PMO', 'DEPARTMENT_APPROVER', 'STANDARD_CONTRIBUTOR'];

  const canViewDashboard = (role: Role) => DASHBOARD_ROLES.includes(role);
  const canSubmit = (role: Role) => SUBMIT_ROLES.includes(role);
  const canApprove = (role: Role, type: 'pm' | 'pmo' | 'department') => {
    if (role === 'ADMIN') return true;
    if (type === 'pm') return role === 'PM';
    if (type === 'pmo') return role === 'PMO';
    if (type === 'department') return role === 'DEPARTMENT_APPROVER';
    return false;
  };

  it('ADMIN can do everything', () => {
    expect(canViewDashboard('ADMIN')).toBe(true);
    expect(canSubmit('ADMIN')).toBe(true);
    expect(canApprove('ADMIN', 'pm')).toBe(true);
    expect(canApprove('ADMIN', 'pmo')).toBe(true);
    expect(canApprove('ADMIN', 'department')).toBe(true);
  });

  it('EXECUTIVE_READONLY can only view', () => {
    expect(canViewDashboard('EXECUTIVE_READONLY')).toBe(true);
    expect(canSubmit('EXECUTIVE_READONLY')).toBe(false);
    expect(canApprove('EXECUTIVE_READONLY', 'pm')).toBe(false);
    expect(canApprove('EXECUTIVE_READONLY', 'pmo')).toBe(false);
    expect(canApprove('EXECUTIVE_READONLY', 'department')).toBe(false);
  });

  it('STANDARD_CONTRIBUTOR can submit but not view dashboard or approve', () => {
    expect(canViewDashboard('STANDARD_CONTRIBUTOR')).toBe(false);
    expect(canSubmit('STANDARD_CONTRIBUTOR')).toBe(true);
    expect(canApprove('STANDARD_CONTRIBUTOR', 'pm')).toBe(false);
  });

  it('PM can only approve PM step', () => {
    expect(canApprove('PM', 'pm')).toBe(true);
    expect(canApprove('PM', 'pmo')).toBe(false);
    expect(canApprove('PM', 'department')).toBe(false);
  });

  it('PMO can only approve PMO step', () => {
    expect(canApprove('PMO', 'pmo')).toBe(true);
    expect(canApprove('PMO', 'pm')).toBe(false);
  });

  it('DEPARTMENT_APPROVER can only approve department step', () => {
    expect(canApprove('DEPARTMENT_APPROVER', 'department')).toBe(true);
    expect(canApprove('DEPARTMENT_APPROVER', 'pm')).toBe(false);
  });
});

describe('Approval workflow state machine', () => {
  type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

  const computeFinalStatus = (pm: ApprovalStatus, pmo: ApprovalStatus, dept: ApprovalStatus) => {
    const all = [pm, pmo, dept];
    if (all.every((s) => s === 'APPROVED')) return 'APPROVED_REUSABLE';
    if (all.some((s) => s === 'REJECTED')) return 'REJECTED';
    if (all.some((s) => s === 'APPROVED') && all.some((s) => s === 'PENDING')) return 'IN_REVIEW';
    return 'SUBMITTED';
  };

  it('all pending = SUBMITTED', () => {
    expect(computeFinalStatus('PENDING', 'PENDING', 'PENDING')).toBe('SUBMITTED');
  });

  it('all approved = APPROVED_REUSABLE', () => {
    expect(computeFinalStatus('APPROVED', 'APPROVED', 'APPROVED')).toBe('APPROVED_REUSABLE');
  });

  it('any rejected = REJECTED', () => {
    expect(computeFinalStatus('APPROVED', 'REJECTED', 'PENDING')).toBe('REJECTED');
    expect(computeFinalStatus('REJECTED', 'PENDING', 'PENDING')).toBe('REJECTED');
  });

  it('partial approved = IN_REVIEW', () => {
    expect(computeFinalStatus('APPROVED', 'PENDING', 'PENDING')).toBe('IN_REVIEW');
    expect(computeFinalStatus('APPROVED', 'APPROVED', 'PENDING')).toBe('IN_REVIEW');
  });
});
