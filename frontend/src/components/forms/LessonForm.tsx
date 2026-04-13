import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { LessonFormData, FilterOptions, Severity } from '../../types';

const DEPARTMENTS = [
  'Project Team', 'Field Team', 'Drafting/Engineer', 'R&D', 'Building Science',
  'Breakdown', 'Purchasing', 'Production', 'Shipping/Receiving', 'Servicing',
];

const SYSTEMS = ['Curtain Wall', 'Window Wall', 'Storefront', 'Entrance Systems', 'Aluminum Framing', 'Skylights', 'Cladding', 'Other'];
const PHASES = ['Estimating', 'Engineering', 'Shop Drawing', 'Breakdown', 'Procurement', 'Production', 'Shipping', 'Installation', 'Servicing', 'Closeout'];
const CATEGORIES = ['Quality', 'Safety', 'Design', 'Coordination', 'Vendor Management', 'Estimating', 'Process Improvement', 'Logistics', 'Warranty', 'Other'];
const PROJECT_TYPES = ['Commercial High-Rise', 'Commercial Low-Rise', 'Residential High-Rise', 'Institutional', 'Mixed Use', 'Industrial', 'Renovation', 'Other'];
const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const emptyForm: LessonFormData = {
  projectNumber: '', projectName: '', client: '', location: '', projectType: '',
  system: '', phase: '', category: '', severity: 'MEDIUM',
  description: '', rootCause: '', lessonLearned: '', preventiveAction: '',
  costImpact: 0, costAvoided: 0, scheduleImpact: 0,
  vendorRelated: false, vendorName: '', claimsRelevant: false,
  evidenceLink: '', minutesLink: '', primaryResponsibleDepartment: '',
  dateIdentified: new Date().toISOString().split('T')[0], targetDate: '',
};

type FormErrors = Partial<Record<keyof LessonFormData, string>>;

export default function LessonForm({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<LessonFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof LessonFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.projectNumber.trim()) e.projectNumber = 'Required';
    if (!form.projectName.trim()) e.projectName = 'Required';
    if (!form.system) e.system = 'Required';
    if (!form.phase) e.phase = 'Required';
    if (!form.category) e.category = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const lesson = await api.lessons.create(form);
      setSuccess(`Lesson ${lesson.lessonId} created successfully`);
      setForm(emptyForm);
      onCreated?.();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm(emptyForm);
    setErrors({});
    setSuccess(null);
    setSubmitError(null);
  };

  const Field = ({ label, field, required, children }: {
    label: string; field: keyof LessonFormData; required?: boolean; children?: React.ReactNode;
  }) => (
    <div>
      <label className="label-text">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {errors[field] && <p className="text-[11px] text-danger mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-navy">Submit Lesson Learned</h1>
        <p className="text-sm text-gray-400 mt-0.5">Capture issues, successes, and recommendations from project experience</p>
      </div>

      {/* Success / Error banners */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-success/10 border border-success/20 text-success rounded-lg px-4 py-3">
          <CheckCircle2 size={18} />
          <p className="text-sm font-medium">{success}</p>
        </motion.div>
      )}
      {submitError && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-danger/10 border border-danger/20 text-danger rounded-lg px-4 py-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{submitError}</p>
        </motion.div>
      )}

      <div className="card">
        {/* Core Identity */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">Project Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Field label="Project Number" field="projectNumber" required>
            <input className="input-field" placeholder="e.g. 2025-401" value={form.projectNumber}
              onChange={(e) => set('projectNumber', e.target.value)} />
          </Field>
          <Field label="Project Name" field="projectName" required>
            <input className="input-field" placeholder="e.g. Waterfront Condo Phase 2" value={form.projectName}
              onChange={(e) => set('projectName', e.target.value)} />
          </Field>
          <Field label="Client" field="client">
            <input className="input-field" placeholder="Client name" value={form.client}
              onChange={(e) => set('client', e.target.value)} />
          </Field>
          <Field label="Site / Location" field="location">
            <input className="input-field" placeholder="e.g. Toronto, ON" value={form.location}
              onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Project Type" field="projectType">
            <select className="select-field" value={form.projectType}
              onChange={(e) => set('projectType', e.target.value)}>
              <option value="">Select type</option>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Date Identified" field="dateIdentified">
            <input type="date" className="input-field" value={form.dateIdentified}
              onChange={(e) => set('dateIdentified', e.target.value)} />
          </Field>
        </div>

        {/* Classification */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">Classification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Field label="System" field="system" required>
            <select className="select-field" value={form.system}
              onChange={(e) => set('system', e.target.value)}>
              <option value="">Select system</option>
              {SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Phase" field="phase" required>
            <select className="select-field" value={form.phase}
              onChange={(e) => set('phase', e.target.value)}>
              <option value="">Select phase</option>
              {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Category" field="category" required>
            <select className="select-field" value={form.category}
              onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Severity" field="severity">
            <select className="select-field" value={form.severity}
              onChange={(e) => set('severity', e.target.value)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Primary Responsible Department" field="primaryResponsibleDepartment">
            <select className="select-field" value={form.primaryResponsibleDepartment}
              onChange={(e) => set('primaryResponsibleDepartment', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <div>
            <label className="label-text">Created By</label>
            <input className="input-field bg-gray-50" value={user?.displayName || ''} disabled />
          </div>
        </div>

        {/* Narrative */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">Narrative</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <Field label="Issue / Success Description" field="description" required>
            <textarea className="input-field min-h-[100px] resize-y" rows={4}
              placeholder="Describe the issue or success observed..."
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Root Cause Detail" field="rootCause">
            <textarea className="input-field min-h-[100px] resize-y" rows={4}
              placeholder="What caused this issue?"
              value={form.rootCause} onChange={(e) => set('rootCause', e.target.value)} />
          </Field>
          <Field label="Lesson Learned" field="lessonLearned">
            <textarea className="input-field min-h-[100px] resize-y" rows={4}
              placeholder="What was the key takeaway?"
              value={form.lessonLearned} onChange={(e) => set('lessonLearned', e.target.value)} />
          </Field>
          <Field label="Recommended Preventive Action" field="preventiveAction">
            <textarea className="input-field min-h-[100px] resize-y" rows={4}
              placeholder="Recommendations to prevent recurrence..."
              value={form.preventiveAction} onChange={(e) => set('preventiveAction', e.target.value)} />
          </Field>
        </div>

        {/* Impact */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">Impact Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Field label="Cost Impact ($)" field="costImpact">
            <input type="number" className="input-field" min={0} value={form.costImpact || ''}
              onChange={(e) => set('costImpact', parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="Cost Avoided ($)" field="costAvoided">
            <input type="number" className="input-field" min={0} value={form.costAvoided || ''}
              onChange={(e) => set('costAvoided', parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="Schedule Impact (Days)" field="scheduleImpact">
            <input type="number" className="input-field" value={form.scheduleImpact || ''}
              onChange={(e) => set('scheduleImpact', parseInt(e.target.value) || 0)} />
          </Field>
        </div>

        {/* Vendor / Claims */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">Vendor & Claims</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                checked={form.vendorRelated} onChange={(e) => set('vendorRelated', e.target.checked)} />
              <span className="text-sm text-gray-700">Vendor Related</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                checked={form.claimsRelevant} onChange={(e) => set('claimsRelevant', e.target.checked)} />
              <span className="text-sm text-gray-700">Claims Relevant</span>
            </label>
          </div>
          {form.vendorRelated && (
            <Field label="Vendor Name" field="vendorName">
              <input className="input-field" placeholder="Vendor name" value={form.vendorName}
                onChange={(e) => set('vendorName', e.target.value)} />
            </Field>
          )}
        </div>

        {/* References & Dates */}
        <h2 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">References & Target</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Field label="Evidence Link" field="evidenceLink">
            <input className="input-field" placeholder="URL to evidence / photos" value={form.evidenceLink}
              onChange={(e) => set('evidenceLink', e.target.value)} />
          </Field>
          <Field label="Email / Minutes Link" field="minutesLink">
            <input className="input-field" placeholder="URL to meeting minutes / email" value={form.minutesLink}
              onChange={(e) => set('minutesLink', e.target.value)} />
          </Field>
          <Field label="Target Date" field="targetDate">
            <input type="date" className="input-field" value={form.targetDate}
              onChange={(e) => set('targetDate', e.target.value)} />
          </Field>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleClear} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={14} /> Clear
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="btn-primary flex items-center gap-2">
            <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}
