import { createLessonSchema, approvalSchema, lessonQuerySchema } from '../utils/validation';
import { canPerform, Permissions } from '../middleware/rbac';
import { Role } from '@prisma/client';

describe('Validation Schemas', () => {
  describe('createLessonSchema', () => {
    const validData = {
      projectNumber: '2024-101',
      projectName: 'Test Project',
      system: 'Curtain Wall',
      phase: 'Installation',
      category: 'Quality',
      description: 'Test description of an issue found on site',
    };

    it('should accept valid minimal data', () => {
      const result = createLessonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid full data', () => {
      const fullData = {
        ...validData,
        client: 'Test Client',
        location: 'Toronto, ON',
        projectType: 'Commercial',
        severity: 'HIGH',
        rootCause: 'Root cause detail',
        lessonLearned: 'What was learned',
        preventiveAction: 'Preventive steps',
        costImpact: 50000,
        costAvoided: 10000,
        scheduleImpact: 14,
        vendorRelated: true,
        vendorName: 'TestVendor Inc.',
        claimsRelevant: true,
        evidenceLink: 'https://example.com/evidence',
        minutesLink: 'https://example.com/minutes',
        primaryResponsibleDepartment: 'Field Team',
        dateIdentified: '2024-03-15',
        targetDate: '2024-04-30',
      };
      const result = createLessonSchema.safeParse(fullData);
      expect(result.success).toBe(true);
    });

    it('should reject missing projectNumber', () => {
      const { projectNumber, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing projectName', () => {
      const { projectName, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing system', () => {
      const { system, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing phase', () => {
      const { phase, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing category', () => {
      const { category, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing description', () => {
      const { description, ...data } = validData;
      const result = createLessonSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty projectNumber', () => {
      const result = createLessonSchema.safeParse({ ...validData, projectNumber: '' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid severity', () => {
      const result = createLessonSchema.safeParse({ ...validData, severity: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should reject negative costImpact', () => {
      const result = createLessonSchema.safeParse({ ...validData, costImpact: -100 });
      expect(result.success).toBe(false);
    });

    it('should default severity to MEDIUM', () => {
      const result = createLessonSchema.parse(validData);
      expect(result.severity).toBe('MEDIUM');
    });

    it('should default costImpact to 0', () => {
      const result = createLessonSchema.parse(validData);
      expect(result.costImpact).toBe(0);
    });

    it('should default vendorRelated to false', () => {
      const result = createLessonSchema.parse(validData);
      expect(result.vendorRelated).toBe(false);
    });
  });

  describe('approvalSchema', () => {
    it('should accept APPROVED', () => {
      const result = approvalSchema.safeParse({ status: 'APPROVED' });
      expect(result.success).toBe(true);
    });

    it('should accept REJECTED', () => {
      const result = approvalSchema.safeParse({ status: 'REJECTED' });
      expect(result.success).toBe(true);
    });

    it('should accept with notes', () => {
      const result = approvalSchema.safeParse({ status: 'APPROVED', notes: 'Looks good' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = approvalSchema.safeParse({ status: 'PENDING' });
      expect(result.success).toBe(false);
    });

    it('should reject missing status', () => {
      const result = approvalSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('lessonQuerySchema', () => {
    it('should accept empty query with defaults', () => {
      const result = lessonQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should parse page as number from string', () => {
      const result = lessonQuerySchema.parse({ page: '3' });
      expect(result.page).toBe(3);
    });

    it('should clamp limit to max 100', () => {
      const result = lessonQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });
});

describe('RBAC Permissions', () => {
  describe('canPerform', () => {
    it('ADMIN can do everything', () => {
      for (const perm of Object.keys(Permissions) as Array<keyof typeof Permissions>) {
        expect(canPerform(Role.ADMIN, perm)).toBe(true);
      }
    });

    it('PM can view dashboard', () => {
      expect(canPerform(Role.PM, 'VIEW_DASHBOARD')).toBe(true);
    });

    it('PM can submit lessons', () => {
      expect(canPerform(Role.PM, 'SUBMIT_LESSON')).toBe(true);
    });

    it('PM can approve PM step', () => {
      expect(canPerform(Role.PM, 'APPROVE_PM')).toBe(true);
    });

    it('PM cannot approve PMO step', () => {
      expect(canPerform(Role.PM, 'APPROVE_PMO')).toBe(false);
    });

    it('PM cannot approve department step', () => {
      expect(canPerform(Role.PM, 'APPROVE_DEPARTMENT')).toBe(false);
    });

    it('PMO can approve PMO step', () => {
      expect(canPerform(Role.PMO, 'APPROVE_PMO')).toBe(true);
    });

    it('PMO cannot approve PM step', () => {
      expect(canPerform(Role.PMO, 'APPROVE_PM')).toBe(false);
    });

    it('DEPARTMENT_APPROVER can approve department step', () => {
      expect(canPerform(Role.DEPARTMENT_APPROVER, 'APPROVE_DEPARTMENT')).toBe(true);
    });

    it('DEPARTMENT_APPROVER cannot approve PM step', () => {
      expect(canPerform(Role.DEPARTMENT_APPROVER, 'APPROVE_PM')).toBe(false);
    });

    it('EXECUTIVE_READONLY can view dashboard', () => {
      expect(canPerform(Role.EXECUTIVE_READONLY, 'VIEW_DASHBOARD')).toBe(true);
    });

    it('EXECUTIVE_READONLY cannot submit lessons', () => {
      expect(canPerform(Role.EXECUTIVE_READONLY, 'SUBMIT_LESSON')).toBe(false);
    });

    it('EXECUTIVE_READONLY cannot approve anything', () => {
      expect(canPerform(Role.EXECUTIVE_READONLY, 'APPROVE_PM')).toBe(false);
      expect(canPerform(Role.EXECUTIVE_READONLY, 'APPROVE_PMO')).toBe(false);
      expect(canPerform(Role.EXECUTIVE_READONLY, 'APPROVE_DEPARTMENT')).toBe(false);
    });

    it('STANDARD_CONTRIBUTOR can submit lessons', () => {
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'SUBMIT_LESSON')).toBe(true);
    });

    it('STANDARD_CONTRIBUTOR cannot view dashboard', () => {
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'VIEW_DASHBOARD')).toBe(false);
    });

    it('STANDARD_CONTRIBUTOR cannot approve anything', () => {
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'APPROVE_PM')).toBe(false);
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'APPROVE_PMO')).toBe(false);
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'APPROVE_DEPARTMENT')).toBe(false);
    });

    it('STANDARD_CONTRIBUTOR cannot manage config', () => {
      expect(canPerform(Role.STANDARD_CONTRIBUTOR, 'MANAGE_CONFIG')).toBe(false);
    });

    it('Only ADMIN can manage config', () => {
      expect(canPerform(Role.ADMIN, 'MANAGE_CONFIG')).toBe(true);
      expect(canPerform(Role.PM, 'MANAGE_CONFIG')).toBe(false);
      expect(canPerform(Role.PMO, 'MANAGE_CONFIG')).toBe(false);
    });
  });
});
