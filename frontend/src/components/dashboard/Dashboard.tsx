import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, AlertTriangle, DollarSign, Clock, Users, Shield,
  Truck, FileWarning, CheckCircle2, Filter, X, Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCurrency, Spinner } from '../common/Badge';
import type { KPIs, Breakdowns, Watchouts, TopDrivers, FilterOptions, DashboardFilters } from '../../types';

const COLORS = ['#14395B', '#2F75B5', '#1F6F78', '#2E8B57', '#C58B00', '#C0504D', '#6366f1', '#8b5cf6', '#ec4899', '#f97316'];

function KPICard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card flex items-start gap-3.5"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-heading font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="text-sm font-heading font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function SimpleBarChart({ data }: { data: Array<{ name: string; count: number }> }) {
  if (!data.length) return <p className="text-xs text-gray-400 py-8 text-center">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SimplePieChart({ data }: { data: Array<{ name: string; count: number }> }) {
  if (!data.length) return <p className="text-xs text-gray-400 py-8 text-center">No data</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [breakdowns, setBreakdowns] = useState<Breakdowns | null>(null);
  const [watchouts, setWatchouts] = useState<Watchouts | null>(null);
  const [topDrivers, setTopDrivers] = useState<TopDrivers | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [k, b, w, t] = await Promise.all([
        api.dashboard.kpis(filters),
        api.dashboard.breakdowns(filters),
        api.dashboard.watchouts(filters),
        api.dashboard.topDrivers(filters),
      ]);
      setKpis(k);
      setBreakdowns(b);
      setWatchouts(w);
      setTopDrivers(t);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    api.lessons.filters().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => setFilters({});
  const hasFilters = Object.values(filters).some(Boolean);

  if (loading && !kpis) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-navy">Master Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Executive overview of lessons learned across all projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${hasFilters ? '!border-accent !text-accent' : ''}`}>
            <Filter size={14} />
            Filters {hasFilters && <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
              {Object.values(filters).filter(Boolean).length}
            </span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary flex items-center gap-1.5 text-danger !border-danger/30">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && filterOptions && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
          className="card overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {([
              { key: 'system', label: 'System', opts: filterOptions.systems },
              { key: 'department', label: 'Department', opts: filterOptions.departments },
              { key: 'severity', label: 'Severity', opts: filterOptions.severities },
              { key: 'projectType', label: 'Project Type', opts: filterOptions.projectTypes },
              { key: 'phase', label: 'Phase', opts: filterOptions.phases },
            ] as const).map(({ key, label, opts }) => (
              <div key={key}>
                <label className="label-text">{label}</label>
                <select className="select-field" value={(filters as any)[key] || ''}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value || undefined })}>
                  <option value="">All</option>
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="label-text">Date From</label>
              <input type="date" className="input-field" value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || undefined })} />
            </div>
            <div>
              <label className="label-text">Date To</label>
              <input type="date" className="input-field" value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || undefined })} />
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard icon={<FileWarning size={18} className="text-white" />} label="Total Lessons" value={kpis.total} color="bg-navy" />
          <KPICard icon={<Clock size={18} className="text-white" />} label="Open Lessons" value={kpis.open} sub={`Avg ${kpis.avgDaysOpen} days`} color="bg-amber" />
          <KPICard icon={<CheckCircle2 size={18} className="text-white" />} label="Reusable" value={kpis.reusable} sub={`${kpis.pctReusable}% of total`} color="bg-success" />
          <KPICard icon={<DollarSign size={18} className="text-white" />} label="Cost Impact" value={formatCurrency(kpis.totalCostImpact)} sub={`${formatCurrency(kpis.totalCostAvoided)} avoided`} color="bg-danger" />
          <KPICard icon={<Calendar size={18} className="text-white" />} label="Schedule Days" value={kpis.totalScheduleDays} color="bg-teal" />
          <KPICard icon={<Truck size={18} className="text-white" />} label="Vendor Related" value={kpis.vendorRelated} color="bg-accent" />
          <KPICard icon={<Shield size={18} className="text-white" />} label="Claims Relevant" value={kpis.claimsRelevant} color="bg-navy" />
          <KPICard icon={<TrendingUp size={18} className="text-white" />} label="% Reusable" value={`${kpis.pctReusable}%`} color="bg-success" />
          <KPICard icon={<DollarSign size={18} className="text-white" />} label="Cost Avoided" value={formatCurrency(kpis.totalCostAvoided)} color="bg-teal" />
          <KPICard icon={<Clock size={18} className="text-white" />} label="Avg Days Open" value={kpis.avgDaysOpen} color="bg-amber" />
        </div>
      )}

      {/* Charts */}
      {breakdowns && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChartCard title="Lessons by Severity"><SimplePieChart data={breakdowns.bySeverity} /></ChartCard>
            <ChartCard title="Lessons by Department"><SimpleBarChart data={breakdowns.byDepartment} /></ChartCard>
            <ChartCard title="Lessons by Phase"><SimpleBarChart data={breakdowns.byPhase} /></ChartCard>
            <ChartCard title="Lessons by Category"><SimpleBarChart data={breakdowns.byCategory} /></ChartCard>
            <ChartCard title="Lessons by System"><SimplePieChart data={breakdowns.bySystem} /></ChartCard>
            <ChartCard title="Claims by Department"><SimpleBarChart data={breakdowns.claimsByDepartment} /></ChartCard>
            <ChartCard title="Vendor Issues by Phase"><SimpleBarChart data={breakdowns.vendorByPhase} /></ChartCard>
          </div>
        </>
      )}

      {/* Watchouts */}
      {watchouts && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-navy mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber" /> Watchouts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {([
              { key: 'openOver30', label: 'Open > 30 Days', color: 'text-amber' },
              { key: 'openOver60', label: 'Open > 60 Days', color: 'text-danger' },
              { key: 'highCriticalOpen', label: 'High/Critical Open', color: 'text-danger' },
              { key: 'majorVendorDelays', label: 'Major Vendor Delays', color: 'text-amber' },
              { key: 'highCostVariance', label: 'High Cost Variance', color: 'text-danger' },
            ] as const).map(({ key, label, color }) => (
              <div key={key} className="card text-center">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-3xl font-heading font-bold mt-1 ${(watchouts[key] as any).count > 0 ? color : 'text-gray-300'}`}>
                  {(watchouts[key] as any).count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Drivers */}
      {topDrivers && (
        <div>
          <h2 className="text-lg font-heading font-semibold text-navy mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" /> Top Drivers
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Cost Impact */}
            <div className="card">
              <h3 className="text-sm font-heading font-semibold text-gray-700 mb-3">Top Cost Impact</h3>
              <div className="space-y-2">
                {topDrivers.topCostImpact.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-xs font-semibold text-navy">{d.lessonId}</p>
                      <p className="text-[11px] text-gray-400 truncate">{d.description}</p>
                    </div>
                    <span className="text-sm font-bold text-danger whitespace-nowrap">{formatCurrency(d.costImpact)}</span>
                  </div>
                ))}
                {!topDrivers.topCostImpact.length && <p className="text-xs text-gray-400 text-center py-4">No data</p>}
              </div>
            </div>

            {/* Top Schedule Impact */}
            <div className="card">
              <h3 className="text-sm font-heading font-semibold text-gray-700 mb-3">Top Schedule Impact</h3>
              <div className="space-y-2">
                {topDrivers.topScheduleImpact.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-xs font-semibold text-navy">{d.lessonId}</p>
                      <p className="text-[11px] text-gray-400 truncate">{d.description}</p>
                    </div>
                    <span className="text-sm font-bold text-amber whitespace-nowrap">{d.scheduleImpact} days</span>
                  </div>
                ))}
                {!topDrivers.topScheduleImpact.length && <p className="text-xs text-gray-400 text-center py-4">No data</p>}
              </div>
            </div>

            {/* Recurring Categories */}
            <div className="card">
              <h3 className="text-sm font-heading font-semibold text-gray-700 mb-3">Top Recurring Categories</h3>
              <div className="space-y-2">
                {topDrivers.topRecurringCategories.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-700">{d.name}</span>
                    <span className="text-xs font-bold text-navy bg-navy/5 px-2.5 py-1 rounded-full">{d.count}</span>
                  </div>
                ))}
                {!topDrivers.topRecurringCategories.length && <p className="text-xs text-gray-400 text-center py-4">No data</p>}
              </div>
            </div>

            {/* Vendor Issues */}
            <div className="card">
              <h3 className="text-sm font-heading font-semibold text-gray-700 mb-3">Top Vendor Issues</h3>
              <div className="space-y-2">
                {topDrivers.topVendorIssues.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-xs font-semibold text-gray-700">{d.vendor}</p>
                      <p className="text-[11px] text-gray-400">{d.count} issue(s) &middot; {d.totalDays} days impact</p>
                    </div>
                    <span className="text-sm font-bold text-danger whitespace-nowrap">{formatCurrency(d.totalCost)}</span>
                  </div>
                ))}
                {!topDrivers.topVendorIssues.length && <p className="text-xs text-gray-400 text-center py-4">No data</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
