import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AuditEntry {
  lessonId: string;
  actionType: string;
  oldValue: string | null;
  newValue: string;
  changedByUserId: string;
  changedByRole: string;
  notes?: string;
}

export async function createAuditEntry(entry: AuditEntry) {
  try {
    const record = await prisma.approvalAudit.create({ data: entry });
    logger.info('Audit entry created', {
      auditId: record.id,
      lessonId: entry.lessonId,
      action: entry.actionType,
    });
    return record;
  } catch (error) {
    logger.error('Failed to create audit entry', { entry, error });
    throw error;
  }
}

export async function getAuditTrail(lessonId: string) {
  return prisma.approvalAudit.findMany({
    where: { lessonId },
    include: {
      changedBy: {
        select: { displayName: true, email: true, role: true },
      },
    },
    orderBy: { changedAt: 'desc' },
  });
}
