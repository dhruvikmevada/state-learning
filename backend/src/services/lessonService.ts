import { prisma } from '../utils/prisma';
import { createAuditEntry, getAuditTrail } from './auditService';
import { AppError } from '../middleware/errorHandler';
import { Prisma, ApprovalStatus, WorkflowStatus, Role } from '@prisma/client';
import { CreateLessonInput, LessonQuery, ApprovalInput } from '../utils/validation';
import { AuthUser } from '../middleware/auth';
import { logger } from '../utils/logger';

// Generate lesson ID: LL-[ProjectNumber]-###
async function generateLessonId(projectNumber: string): Promise<string> {
  const existing = await prisma.lesson.count({
    where: { projectNumber },
  });
  const seq = String(existing + 1).padStart(3, '0');
  return `LL-${projectNumber}-${seq}`;
}

// Build Prisma where clause from query filters
function buildWhereClause(query: LessonQuery): Prisma.LessonWhereInput {
  const where: Prisma.LessonWhereInput = {};

  if (query.search) {
    where.OR = [
      { lessonId: { contains: query.search, mode: 'insensitive' } },
      { projectName: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { lessonLearned: { contains: query.search, mode: 'insensitive' } },
      { client: { contains: query.search, mode: 'insensitive' } },
      { vendorName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.system) where.system = query.system;
  if (query.phase) where.phase = query.phase;
  if (query.severity) where.severity = query.severity as any;
  if (query.department) where.primaryResponsibleDepartment = query.department;
  if (query.projectType) where.projectType = query.projectType;
  if (query.workflowStatus) where.workflowStatus = query.workflowStatus as any;
  if (query.vendorRelated === 'true') where.vendorRelated = true;
  if (query.claimsRelevant === 'true') where.claimsRelevant = true;

  if (query.dateFrom || query.dateTo) {
    where.dateIdentified = {};
    if (query.dateFrom) where.dateIdentified.gte = new Date(query.dateFrom);
    if (query.dateTo) where.dateIdentified.lte = new Date(query.dateTo);
  }

  return where;
}

export async function listLessons(query: LessonQuery) {
  const where = buildWhereClause(query);
  const skip = (query.page - 1) * query.limit;

  const orderBy: Prisma.LessonOrderByWithRelationInput = {};
  const validSortFields = [
    'createdAt', 'lessonId', 'severity', 'costImpact', 'scheduleImpact',
    'workflowStatus', 'projectName', 'system', 'phase', 'dateIdentified',
  ];
  const sortField = validSortFields.includes(query.sortBy!) ? query.sortBy! : 'createdAt';
  (orderBy as any)[sortField] = query.sortOrder;

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      skip,
      take: query.limit,
      orderBy,
      include: {
        createdBy: {
          select: { displayName: true, email: true },
        },
      },
    }),
    prisma.lesson.count({ where }),
  ]);

  return {
    data: lessons,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { OR: [{ id }, { lessonId: id }] },
    include: {
      createdBy: {
        select: { displayName: true, email: true, department: true },
      },
    },
  });

  if (!lesson) throw new AppError(404, 'Lesson not found');
  return lesson;
}

export async function createLesson(data: CreateLessonInput, user: AuthUser) {
  const lessonId = await generateLessonId(data.projectNumber);

  const lesson = await prisma.lesson.create({
    data: {
      lessonId,
      projectNumber: data.projectNumber,
      projectName: data.projectName,
      client: data.client || '',
      location: data.location || '',
      projectType: data.projectType || '',
      system: data.system,
      phase: data.phase,
      category: data.category,
      severity: data.severity as any,
      description: data.description,
      rootCause: data.rootCause || '',
      lessonLearned: data.lessonLearned || '',
      preventiveAction: data.preventiveAction || '',
      costImpact: data.costImpact || 0,
      costAvoided: data.costAvoided || 0,
      scheduleImpact: data.scheduleImpact || 0,
      vendorRelated: data.vendorRelated || false,
      vendorName: data.vendorName || null,
      claimsRelevant: data.claimsRelevant || false,
      evidenceLink: data.evidenceLink || '',
      minutesLink: data.minutesLink || '',
      primaryResponsibleDepartment: data.primaryResponsibleDepartment || user.department,
      createdByUserId: user.id,
      createdByDepartment: user.department,
      dateIdentified: data.dateIdentified ? new Date(data.dateIdentified as string) : new Date(),
      targetDate: data.targetDate ? new Date(data.targetDate as string) : null,
      workflowStatus: WorkflowStatus.SUBMITTED,
      pmApproval: ApprovalStatus.PENDING,
      pmoApproval: ApprovalStatus.PENDING,
      departmentApproval: ApprovalStatus.PENDING,
      finalReusableApproval: ApprovalStatus.PENDING,
    },
    include: {
      createdBy: {
        select: { displayName: true, email: true },
      },
    },
  });

  await createAuditEntry({
    lessonId: lesson.id,
    actionType: 'LESSON_CREATED',
    oldValue: null,
    newValue: 'SUBMITTED',
    changedByUserId: user.id,
    changedByRole: user.role,
  });

  logger.info('Lesson created', { lessonId: lesson.lessonId, user: user.email });
  return lesson;
}

export async function updateLesson(id: string, data: Partial<CreateLessonInput>, user: AuthUser) {
  const existing = await getLessonById(id);

  // Build update data, handling date conversions
  const updateData: any = { ...data };
  if (data.dateIdentified) updateData.dateIdentified = new Date(data.dateIdentified as string);
  if (data.targetDate) updateData.targetDate = new Date(data.targetDate as string);

  const lesson = await prisma.lesson.update({
    where: { id: existing.id },
    data: updateData,
    include: {
      createdBy: { select: { displayName: true, email: true } },
    },
  });

  await createAuditEntry({
    lessonId: lesson.id,
    actionType: 'LESSON_UPDATED',
    oldValue: JSON.stringify({ description: existing.description }),
    newValue: JSON.stringify(data),
    changedByUserId: user.id,
    changedByRole: user.role,
  });

  return lesson;
}

// Process approval for a specific step
export async function processApproval(
  lessonId: string,
  approvalType: 'pm' | 'pmo' | 'department',
  input: ApprovalInput,
  user: AuthUser
) {
  const lesson = await getLessonById(lessonId);

  // Verify role authorization
  const roleMap: Record<string, Role[]> = {
    pm: [Role.ADMIN, Role.PM],
    pmo: [Role.ADMIN, Role.PMO],
    department: [Role.ADMIN, Role.DEPARTMENT_APPROVER],
  };

  if (!roleMap[approvalType].includes(user.role as Role)) {
    throw new AppError(403, `Role ${user.role} cannot approve the ${approvalType} step`);
  }

  const fieldMap: Record<string, { approval: string; date: string; by: string }> = {
    pm: { approval: 'pmApproval', date: 'pmApprovalDate', by: 'pmApprovalBy' },
    pmo: { approval: 'pmoApproval', date: 'pmoApprovalDate', by: 'pmoApprovalBy' },
    department: { approval: 'departmentApproval', date: 'departmentApprovalDate', by: 'departmentApprovalBy' },
  };

  const fields = fieldMap[approvalType];
  const oldValue = (lesson as any)[fields.approval];
  const newValue = input.status as ApprovalStatus;

  // Update the approval field
  const updateData: any = {
    [fields.approval]: newValue,
    [fields.date]: new Date(),
    [fields.by]: user.id,
  };

  // Check if all approvals are now approved
  const currentApprovals: Record<string, ApprovalStatus> = {
    pmApproval: approvalType === 'pm' ? newValue : lesson.pmApproval,
    pmoApproval: approvalType === 'pmo' ? newValue : lesson.pmoApproval,
    departmentApproval: approvalType === 'department' ? newValue : lesson.departmentApproval,
  };

  const allApproved = Object.values(currentApprovals).every((s) => s === ApprovalStatus.APPROVED);
  const anyRejected = Object.values(currentApprovals).some((s) => s === ApprovalStatus.REJECTED);

  if (allApproved) {
    updateData.finalReusableApproval = ApprovalStatus.APPROVED;
    updateData.finalApprovalDate = new Date();
    updateData.workflowStatus = WorkflowStatus.APPROVED_REUSABLE;
    updateData.dateClosed = new Date();
  } else if (anyRejected) {
    updateData.finalReusableApproval = ApprovalStatus.REJECTED;
    updateData.workflowStatus = WorkflowStatus.REJECTED;
  } else {
    updateData.workflowStatus = WorkflowStatus.IN_REVIEW;
  }

  const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data: updateData,
    include: {
      createdBy: { select: { displayName: true, email: true } },
    },
  });

  await createAuditEntry({
    lessonId: lesson.id,
    actionType: `${approvalType.toUpperCase()}_APPROVAL`,
    oldValue: oldValue,
    newValue: newValue,
    changedByUserId: user.id,
    changedByRole: user.role,
    notes: input.notes || undefined,
  });

  if (allApproved) {
    await createAuditEntry({
      lessonId: lesson.id,
      actionType: 'FINAL_APPROVAL',
      oldValue: lesson.finalReusableApproval,
      newValue: ApprovalStatus.APPROVED,
      changedByUserId: user.id,
      changedByRole: user.role,
      notes: 'All approvals completed — lesson classified as reusable',
    });
  }

  logger.info('Approval processed', {
    lessonId: lesson.lessonId,
    type: approvalType,
    status: newValue,
    user: user.email,
    allApproved,
  });

  return updated;
}

export async function getLessonAudit(lessonId: string) {
  const lesson = await getLessonById(lessonId);
  return getAuditTrail(lesson.id);
}

// Get unique values for filter dropdowns
export async function getFilterOptions() {
  const [systems, phases, categories, departments, projectTypes] = await Promise.all([
    prisma.lesson.findMany({ select: { system: true }, distinct: ['system'] }),
    prisma.lesson.findMany({ select: { phase: true }, distinct: ['phase'] }),
    prisma.lesson.findMany({ select: { category: true }, distinct: ['category'] }),
    prisma.lesson.findMany({
      select: { primaryResponsibleDepartment: true },
      distinct: ['primaryResponsibleDepartment'],
    }),
    prisma.lesson.findMany({ select: { projectType: true }, distinct: ['projectType'] }),
  ]);

  return {
    systems: systems.map((s) => s.system).filter(Boolean),
    phases: phases.map((p) => p.phase).filter(Boolean),
    categories: categories.map((c) => c.category).filter(Boolean),
    departments: departments.map((d) => d.primaryResponsibleDepartment).filter(Boolean),
    projectTypes: projectTypes.map((p) => p.projectType).filter(Boolean),
    severities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  };
}
