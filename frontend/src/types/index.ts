export type Role = 'ADMIN' | 'PM' | 'PMO' | 'DEPARTMENT_APPROVER' | 'EXECUTIVE_READONLY' | 'STANDARD_CONTRIBUTOR';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WorkflowStatus = 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED_REUSABLE' | 'REJECTED' | 'CLOSED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  department: string;
}

export interface Lesson {
  id: string;
  lessonId: string;
  workflowStatus: WorkflowStatus;
  pmApproval: ApprovalStatus;
  pmoApproval: ApprovalStatus;
  departmentApproval: ApprovalStatus;
  finalReusableApproval: ApprovalStatus;
  pmApprovalDate: string | null;
  pmoApprovalDate: string | null;
  departmentApprovalDate: string | null;
  finalApprovalDate: string | null;
  pmApprovalBy: string | null;
  pmoApprovalBy: string | null;
  departmentApprovalBy: string | null;
  projectNumber: string;
  projectName: string;
  client: string;
  location: string;
  projectType: string;
  system: string;
  phase: string;
  category: string;
  severity: Severity;
  description: string;
  rootCause: string;
  lessonLearned: string;
  preventiveAction: string;
  costImpact: number;
  costAvoided: number;
  scheduleImpact: number;
  vendorRelated: boolean;
  vendorName: string | null;
  claimsRelevant: boolean;
  evidenceLink: string;
  minutesLink: string;
  createdByUserId: string;
  createdByDepartment: string;
  primaryResponsibleDepartment: string;
  dateIdentified: string;
  targetDate: string | null;
  dateClosed: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { displayName: string; email: string; department?: string };
}

export interface AuditEntry {
  id: string;
  lessonId: string;
  actionType: string;
  oldValue: string | null;
  newValue: string;
  changedByUserId: string;
  changedByRole: string;
  changedAt: string;
  notes: string | null;
  changedBy?: { displayName: string; email: string; role: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KPIs {
  total: number;
  open: number;
  reusable: number;
  pctReusable: number;
  avgDaysOpen: number;
  totalCostImpact: number;
  totalCostAvoided: number;
  totalScheduleDays: number;
  vendorRelated: number;
  claimsRelevant: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
}

export interface Breakdowns {
  bySeverity: BreakdownItem[];
  byDepartment: BreakdownItem[];
  byPhase: BreakdownItem[];
  byCategory: BreakdownItem[];
  bySystem: BreakdownItem[];
  claimsByDepartment: BreakdownItem[];
  vendorByPhase: BreakdownItem[];
}

export interface WatchoutGroup {
  count: number;
  lessons: Array<{
    id: string;
    lessonId: string;
    projectName: string;
    severity: Severity;
    costImpact: number;
    scheduleImpact: number;
    vendorRelated: boolean;
    vendorName: string | null;
    createdAt: string;
    description: string;
  }>;
}

export interface Watchouts {
  openOver30: WatchoutGroup;
  openOver60: WatchoutGroup;
  highCriticalOpen: WatchoutGroup;
  majorVendorDelays: WatchoutGroup;
  highCostVariance: WatchoutGroup;
}

export interface TopDrivers {
  topCostImpact: Array<{ lessonId: string; projectName: string; description: string; costImpact: number }>;
  topScheduleImpact: Array<{ lessonId: string; projectName: string; description: string; scheduleImpact: number }>;
  topRecurringCategories: Array<{ name: string; count: number }>;
  topVendorIssues: Array<{ vendor: string; count: number; totalCost: number; totalDays: number }>;
}

export interface FilterOptions {
  systems: string[];
  phases: string[];
  categories: string[];
  departments: string[];
  projectTypes: string[];
  severities: string[];
}

export interface DashboardFilters {
  system?: string;
  department?: string;
  severity?: string;
  projectType?: string;
  phase?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LessonFormData {
  projectNumber: string;
  projectName: string;
  client: string;
  location: string;
  projectType: string;
  system: string;
  phase: string;
  category: string;
  severity: Severity;
  description: string;
  rootCause: string;
  lessonLearned: string;
  preventiveAction: string;
  costImpact: number;
  costAvoided: number;
  scheduleImpact: number;
  vendorRelated: boolean;
  vendorName: string;
  claimsRelevant: boolean;
  evidenceLink: string;
  minutesLink: string;
  primaryResponsibleDepartment: string;
  dateIdentified: string;
  targetDate: string;
}
