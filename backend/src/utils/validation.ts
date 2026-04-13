import { z } from 'zod';

export const createLessonSchema = z.object({
  projectNumber: z.string().min(1, 'Project Number is required'),
  projectName: z.string().min(1, 'Project Name is required'),
  client: z.string().optional().default(''),
  location: z.string().optional().default(''),
  projectType: z.string().optional().default(''),
  system: z.string().min(1, 'System is required'),
  phase: z.string().min(1, 'Phase is required'),
  category: z.string().min(1, 'Category is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1, 'Description is required'),
  rootCause: z.string().optional().default(''),
  lessonLearned: z.string().optional().default(''),
  preventiveAction: z.string().optional().default(''),
  costImpact: z.number().min(0).default(0),
  costAvoided: z.number().min(0).default(0),
  scheduleImpact: z.number().default(0),
  vendorRelated: z.boolean().default(false),
  vendorName: z.string().optional().nullable(),
  claimsRelevant: z.boolean().default(false),
  evidenceLink: z.string().optional().default(''),
  minutesLink: z.string().optional().default(''),
  primaryResponsibleDepartment: z.string().optional().default(''),
  dateIdentified: z.string().or(z.date()).optional(),
  targetDate: z.string().or(z.date()).optional().nullable(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const lessonQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  system: z.string().optional(),
  phase: z.string().optional(),
  severity: z.string().optional(),
  department: z.string().optional(),
  projectType: z.string().optional(),
  workflowStatus: z.string().optional(),
  vendorRelated: z.string().optional(),
  claimsRelevant: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const approvalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional().default(''),
});

export const dashboardQuerySchema = z.object({
  system: z.string().optional(),
  department: z.string().optional(),
  severity: z.string().optional(),
  projectType: z.string().optional(),
  phase: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type LessonQuery = z.infer<typeof lessonQuerySchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
