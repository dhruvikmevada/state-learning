import React from 'react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber/10 text-amber border-amber/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-danger/10 text-danger border-danger/20',
  SUBMITTED: 'bg-accent/10 text-accent border-accent/20',
  IN_REVIEW: 'bg-teal/10 text-teal border-teal/20',
  APPROVED_REUSABLE: 'bg-success/10 text-success border-success/20',
  CLOSED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-50 text-blue-600 border-blue-200',
  MEDIUM: 'bg-amber/10 text-amber border-amber/20',
  HIGH: 'bg-orange-50 text-orange-600 border-orange-200',
  CRITICAL: 'bg-danger/10 text-danger border-danger/20',
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${color}`}>
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${color}`}>
      {severity}
    </span>
  );
}

export function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
