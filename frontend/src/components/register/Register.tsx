import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, ExternalLink, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge, SeverityBadge, formatCurrency, Spinner, EmptyState } from '../common/Badge';
import LessonDetail from './LessonDetail';
import type { Lesson, PaginatedResponse, FilterOptions } from '../../types';

export default function Register() {
  const [data, setData] = useState<PaginatedResponse<Lesson> | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Query state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page, limit: 15, sortBy, sortOrder,
      };
      if (search) params.search = search;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const result = await api.lessons.list(params);
      setData(result);
    } catch (err) {
      console.error('Register fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters, sortBy, sortOrder]);

  useEffect(() => {
    api.lessons.filters().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filters]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortHeader = ({ field, label, className }: { field: string; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none whitespace-nowrap ${className || ''}`}
    >
      {label}
      {sortBy === field && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold text-navy">Lesson Learned Register</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Central repository of all lessons &mdash; search, filter, and manage approvals
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            className="input-field pl-10"
            placeholder="Search lessons by ID, project, description, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${hasFilters ? '!border-accent !text-accent' : ''}`}>
          <SlidersHorizontal size={14} /> Filters
          {hasFilters && <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
            {Object.values(filters).filter(Boolean).length}
          </span>}
        </button>
        {hasFilters && (
          <button onClick={() => setFilters({})} className="btn-secondary flex items-center gap-1.5 text-danger !border-danger/30">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && filterOptions && (
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {([
              { key: 'system', label: 'System', opts: filterOptions.systems },
              { key: 'phase', label: 'Phase', opts: filterOptions.phases },
              { key: 'severity', label: 'Severity', opts: filterOptions.severities },
              { key: 'department', label: 'Department', opts: filterOptions.departments },
              { key: 'projectType', label: 'Project Type', opts: filterOptions.projectTypes },
              { key: 'workflowStatus', label: 'Status', opts: ['SUBMITTED', 'IN_REVIEW', 'APPROVED_REUSABLE', 'REJECTED', 'CLOSED'] },
            ] as const).map(({ key, label, opts }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <select className="select-field text-xs" value={filters[key] || ''}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}>
                  <option value="">All</option>
                  {opts.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <SortHeader field="lessonId" label="Lesson ID" />
                <SortHeader field="workflowStatus" label="Status" />
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">PM</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">PMO</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dept</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Final</th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider min-w-[180px]">Description</th>
                <SortHeader field="projectName" label="Project" />
                <SortHeader field="system" label="System" />
                <SortHeader field="severity" label="Severity" />
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dept</th>
                <SortHeader field="costImpact" label="Cost" />
                <SortHeader field="scheduleImpact" label="Schedule" />
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && !data ? (
                <tr><td colSpan={14}><Spinner /></td></tr>
              ) : data && data.data.length > 0 ? (
                data.data.map((lesson) => (
                  <tr
                    key={lesson.id}
                    onClick={() => setSelectedId(lesson.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs font-semibold text-accent whitespace-nowrap">{lesson.lessonId}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={lesson.workflowStatus} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={lesson.pmApproval} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={lesson.pmoApproval} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={lesson.departmentApproval} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={lesson.finalReusableApproval} /></td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[220px] truncate">{lesson.description}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{lesson.projectName}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{lesson.system}</td>
                    <td className="px-3 py-2.5"><SeverityBadge severity={lesson.severity} /></td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{lesson.primaryResponsibleDepartment}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatCurrency(lesson.costImpact)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">{lesson.scheduleImpact}d</td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {lesson.evidenceLink && (
                          <a href={lesson.evidenceLink} target="_blank" rel="noopener noreferrer"
                            className="text-accent hover:text-accent-dark" title="Evidence">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        {lesson.minutesLink && (
                          <a href={lesson.minutesLink} target="_blank" rel="noopener noreferrer"
                            className="text-teal hover:text-teal-dark" title="Minutes">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={14}><EmptyState message="No lessons found matching your criteria" /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}–
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronLeft size={16} /></button>
              {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, data.pagination.totalPages - 4));
                const p = start + i;
                if (p > data.pagination.totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-medium ${p === page ? 'bg-navy text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              ><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <LessonDetail
          lessonId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={fetchLessons}
        />
      )}
    </div>
  );
}
