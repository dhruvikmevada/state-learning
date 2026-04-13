import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, History, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge, SeverityBadge, formatCurrency, formatDate, Spinner } from '../common/Badge';
import type { Lesson, AuditEntry } from '../../types';

interface Props {
  lessonId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LessonDetail({ lessonId, onClose, onUpdated }: Props) {
  const { user, canApprove } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [tab, setTab] = useState<'details' | 'audit'>('details');

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    setTab('details');
    Promise.all([
      api.lessons.get(lessonId),
      api.lessons.getAudit(lessonId),
    ])
      .then(([l, a]) => { setLesson(l); setAudit(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleApproval = async (type: 'pm' | 'pmo' | 'department', status: 'APPROVED' | 'REJECTED') => {
    if (!lesson) return;
    setApproving(`${type}-${status}`);
    try {
      const fn = type === 'pm' ? api.lessons.approvePM : type === 'pmo' ? api.lessons.approvePMO : api.lessons.approveDepartment;
      const updated = await fn(lesson.id, status);
      setLesson(updated);
      const newAudit = await api.lessons.getAudit(lesson.id);
      setAudit(newAudit);
      onUpdated();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setApproving(null);
    }
  };

  if (!lessonId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <Spinner />
          ) : lesson ? (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-heading font-bold text-navy">{lesson.lessonId}</h2>
                  <p className="text-xs text-gray-400">{lesson.projectName}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-6">
                <button onClick={() => setTab('details')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                    tab === 'details' ? 'border-accent text-accent' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>Details</button>
                <button onClick={() => setTab('audit')}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    tab === 'audit' ? 'border-accent text-accent' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}><History size={14} /> Audit Trail ({audit.length})</button>
              </div>

              <div className="px-6 py-5">
                {tab === 'details' ? (
                  <div className="space-y-6">
                    {/* Status + Approvals */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <StatusBadge status={lesson.workflowStatus} />
                        <SeverityBadge severity={lesson.severity} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {(['pm', 'pmo', 'department'] as const).map((type) => {
                          const statusKey = `${type}Approval` as keyof Lesson;
                          const status = lesson[statusKey] as string;
                          const canAct = canApprove(type) && status === 'PENDING';
                          return (
                            <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">
                                {type === 'department' ? 'Dept' : type.toUpperCase()}
                              </p>
                              <StatusBadge status={status} />
                              {canAct && (
                                <div className="flex gap-1 mt-2 justify-center">
                                  <button
                                    onClick={() => handleApproval(type, 'APPROVED')}
                                    disabled={!!approving}
                                    className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                                    title="Approve"
                                  ><CheckCircle2 size={14} /></button>
                                  <button
                                    onClick={() => handleApproval(type, 'REJECTED')}
                                    disabled={!!approving}
                                    className="p-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                                    title="Reject"
                                  ><XCircle size={14} /></button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Final</p>
                          <StatusBadge status={lesson.finalReusableApproval} />
                        </div>
                      </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      {([
                        ['Project', lesson.projectName],
                        ['Project #', lesson.projectNumber],
                        ['Client', lesson.client],
                        ['Location', lesson.location],
                        ['Project Type', lesson.projectType],
                        ['System', lesson.system],
                        ['Phase', lesson.phase],
                        ['Category', lesson.category],
                        ['Department', lesson.primaryResponsibleDepartment],
                        ['Created By', lesson.createdBy?.displayName || ''],
                        ['Date Identified', formatDate(lesson.dateIdentified)],
                        ['Target Date', formatDate(lesson.targetDate)],
                        ['Cost Impact', formatCurrency(lesson.costImpact)],
                        ['Cost Avoided', formatCurrency(lesson.costAvoided)],
                        ['Schedule Impact', `${lesson.scheduleImpact} days`],
                        ['Vendor Related', lesson.vendorRelated ? `Yes — ${lesson.vendorName || ''}` : 'No'],
                        ['Claims Relevant', lesson.claimsRelevant ? 'Yes' : 'No'],
                      ] as const).map(([label, value]) => (
                        <div key={label}>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
                          <p className="text-gray-700">{value || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Narrative */}
                    {([
                      ['Description', lesson.description],
                      ['Root Cause', lesson.rootCause],
                      ['Lesson Learned', lesson.lessonLearned],
                      ['Preventive Action', lesson.preventiveAction],
                    ] as const).map(([label, text]) => text ? (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
                      </div>
                    ) : null)}

                    {/* Links */}
                    <div className="flex flex-wrap gap-3">
                      {lesson.evidenceLink && (
                        <a href={lesson.evidenceLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                          <ExternalLink size={12} /> Evidence
                        </a>
                      )}
                      {lesson.minutesLink && (
                        <a href={lesson.minutesLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                          <ExternalLink size={12} /> Minutes
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Audit Trail */
                  <div className="space-y-3">
                    {audit.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No audit records</p>}
                    {audit.map((entry) => (
                      <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-navy">{entry.actionType.replace(/_/g, ' ')}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {entry.changedBy?.displayName || 'System'} &middot; {entry.changedByRole.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-400">{formatDate(entry.changedAt)}</p>
                        </div>
                        <div className="flex gap-4 mt-2 text-[11px]">
                          {entry.oldValue && (
                            <span className="text-gray-400">From: <span className="text-gray-600">{entry.oldValue}</span></span>
                          )}
                          <span className="text-gray-400">To: <span className="font-medium text-navy">{entry.newValue}</span></span>
                        </div>
                        {entry.notes && <p className="text-[11px] text-gray-500 mt-1 italic">{entry.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-gray-400">Lesson not found</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
