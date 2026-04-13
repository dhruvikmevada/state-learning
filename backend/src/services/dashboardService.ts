import { prisma } from '../utils/prisma';
import { Prisma, WorkflowStatus, ApprovalStatus, Severity } from '@prisma/client';
import { DashboardQuery } from '../utils/validation';

function buildDashboardFilter(query: DashboardQuery): Prisma.LessonWhereInput {
  const where: Prisma.LessonWhereInput = {};
  if (query.system) where.system = query.system;
  if (query.department) where.primaryResponsibleDepartment = query.department;
  if (query.severity) where.severity = query.severity as Severity;
  if (query.projectType) where.projectType = query.projectType;
  if (query.phase) where.phase = query.phase;
  if (query.dateFrom || query.dateTo) {
    where.dateIdentified = {};
    if (query.dateFrom) where.dateIdentified.gte = new Date(query.dateFrom);
    if (query.dateTo) where.dateIdentified.lte = new Date(query.dateTo);
  }
  return where;
}

export async function getKPIs(query: DashboardQuery) {
  const where = buildDashboardFilter(query);
  const lessons = await prisma.lesson.findMany({ where });

  const total = lessons.length;
  const openLessons = lessons.filter(
    (l) => l.workflowStatus === WorkflowStatus.SUBMITTED || l.workflowStatus === WorkflowStatus.IN_REVIEW
  );
  const reusable = lessons.filter((l) => l.finalReusableApproval === ApprovalStatus.APPROVED);
  const pctReusable = total > 0 ? Math.round((reusable.length / total) * 100) : 0;

  const now = new Date();
  const avgDaysOpen =
    openLessons.length > 0
      ? Math.round(
          openLessons.reduce((sum, l) => {
            const days = Math.floor((now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / openLessons.length
        )
      : 0;

  const totalCostImpact = lessons.reduce((sum, l) => sum + (l.costImpact || 0), 0);
  const totalCostAvoided = lessons.reduce((sum, l) => sum + (l.costAvoided || 0), 0);
  const totalScheduleDays = lessons.reduce((sum, l) => sum + Math.abs(l.scheduleImpact || 0), 0);
  const vendorRelated = lessons.filter((l) => l.vendorRelated).length;
  const claimsRelevant = lessons.filter((l) => l.claimsRelevant).length;

  return {
    total,
    open: openLessons.length,
    reusable: reusable.length,
    pctReusable,
    avgDaysOpen,
    totalCostImpact,
    totalCostAvoided,
    totalScheduleDays,
    vendorRelated,
    claimsRelevant,
  };
}

export async function getBreakdowns(query: DashboardQuery) {
  const where = buildDashboardFilter(query);
  const lessons = await prisma.lesson.findMany({ where });

  const groupBy = (field: keyof typeof lessons[0]) => {
    const map: Record<string, number> = {};
    for (const l of lessons) {
      const key = String(l[field] || 'Unknown');
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Claims by department
  const claimsByDept: Record<string, number> = {};
  for (const l of lessons.filter((l) => l.claimsRelevant)) {
    const key = l.primaryResponsibleDepartment || 'Unknown';
    claimsByDept[key] = (claimsByDept[key] || 0) + 1;
  }

  // Vendor by phase
  const vendorByPhase: Record<string, number> = {};
  for (const l of lessons.filter((l) => l.vendorRelated)) {
    const key = l.phase || 'Unknown';
    vendorByPhase[key] = (vendorByPhase[key] || 0) + 1;
  }

  return {
    bySeverity: groupBy('severity'),
    byDepartment: groupBy('primaryResponsibleDepartment'),
    byPhase: groupBy('phase'),
    byCategory: groupBy('category'),
    bySystem: groupBy('system'),
    claimsByDepartment: Object.entries(claimsByDept)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    vendorByPhase: Object.entries(vendorByPhase)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getWatchouts(query: DashboardQuery) {
  const where = buildDashboardFilter(query);
  const now = new Date();

  // Fetch thresholds
  const thresholds = await prisma.configThreshold.findMany();
  const thresholdMap: Record<string, number> = {};
  for (const t of thresholds) {
    thresholdMap[t.key] = parseFloat(t.value);
  }

  const vendorDelayThreshold = thresholdMap['vendor_delay_threshold_days'] || 14;
  const costVarianceThreshold = thresholdMap['cost_variance_threshold'] || 25000;

  const openLessons = await prisma.lesson.findMany({
    where: {
      ...where,
      workflowStatus: { in: [WorkflowStatus.SUBMITTED, WorkflowStatus.IN_REVIEW] },
    },
    select: {
      id: true,
      lessonId: true,
      projectName: true,
      severity: true,
      costImpact: true,
      scheduleImpact: true,
      vendorRelated: true,
      vendorName: true,
      createdAt: true,
      description: true,
    },
  });

  const openOver30: typeof openLessons = [];
  const openOver60: typeof openLessons = [];
  const highCriticalOpen: typeof openLessons = [];
  const majorVendorDelays: typeof openLessons = [];
  const highCostVariance: typeof openLessons = [];

  for (const l of openLessons) {
    const daysOpen = Math.floor((now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOpen > 30) openOver30.push(l);
    if (daysOpen > 60) openOver60.push(l);
    if (l.severity === Severity.HIGH || l.severity === Severity.CRITICAL) {
      highCriticalOpen.push(l);
    }
    if (l.vendorRelated && l.scheduleImpact >= vendorDelayThreshold) {
      majorVendorDelays.push(l);
    }
    if (l.costImpact >= costVarianceThreshold) {
      highCostVariance.push(l);
    }
  }

  return {
    openOver30: { count: openOver30.length, lessons: openOver30.slice(0, 10) },
    openOver60: { count: openOver60.length, lessons: openOver60.slice(0, 10) },
    highCriticalOpen: { count: highCriticalOpen.length, lessons: highCriticalOpen.slice(0, 10) },
    majorVendorDelays: { count: majorVendorDelays.length, lessons: majorVendorDelays.slice(0, 10) },
    highCostVariance: { count: highCostVariance.length, lessons: highCostVariance.slice(0, 10) },
  };
}

export async function getTopDrivers(query: DashboardQuery) {
  const where = buildDashboardFilter(query);
  const lessons = await prisma.lesson.findMany({ where });

  const topCostImpact = [...lessons]
    .sort((a, b) => (b.costImpact || 0) - (a.costImpact || 0))
    .slice(0, 5)
    .map((l) => ({
      lessonId: l.lessonId,
      projectName: l.projectName,
      description: l.description.substring(0, 120),
      costImpact: l.costImpact,
    }));

  const topScheduleImpact = [...lessons]
    .sort((a, b) => Math.abs(b.scheduleImpact || 0) - Math.abs(a.scheduleImpact || 0))
    .slice(0, 5)
    .map((l) => ({
      lessonId: l.lessonId,
      projectName: l.projectName,
      description: l.description.substring(0, 120),
      scheduleImpact: l.scheduleImpact,
    }));

  // Recurring categories
  const catCount: Record<string, number> = {};
  for (const l of lessons) {
    catCount[l.category] = (catCount[l.category] || 0) + 1;
  }
  const topRecurringCategories = Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Vendor issues
  const vendorIssues = lessons
    .filter((l) => l.vendorRelated && l.vendorName)
    .reduce<Record<string, { count: number; totalCost: number; totalDays: number }>>((acc, l) => {
      const key = l.vendorName!;
      if (!acc[key]) acc[key] = { count: 0, totalCost: 0, totalDays: 0 };
      acc[key].count++;
      acc[key].totalCost += l.costImpact || 0;
      acc[key].totalDays += Math.abs(l.scheduleImpact || 0);
      return acc;
    }, {});

  const topVendorIssues = Object.entries(vendorIssues)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([vendor, data]) => ({ vendor, ...data }));

  return {
    topCostImpact,
    topScheduleImpact,
    topRecurringCategories,
    topVendorIssues,
  };
}
