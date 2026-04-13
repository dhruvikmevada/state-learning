import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, LogIn, AlertCircle } from 'lucide-react';
import { useAuth, AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import LessonForm from './components/forms/LessonForm';
import Register from './components/register/Register';
import { Spinner } from './components/common/Badge';

type Page = 'dashboard' | 'add' | 'register';

function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const DEMO_USERS = [
    { email: 'admin@stateconstruction.com', label: 'Admin', role: 'Full access' },
    { email: 'jmartin@stateconstruction.com', label: 'PM', role: 'PM approvals' },
    { email: 'lthompson@stateconstruction.com', label: 'PMO', role: 'PMO approvals' },
    { email: 'mrodriguez@stateconstruction.com', label: 'Dept Approver', role: 'Field Team' },
    { email: 'pnguyen@stateconstruction.com', label: 'Executive', role: 'Read-only' },
    { email: 'dkumar@stateconstruction.com', label: 'Contributor', role: 'Submit only' },
  ];

  const handleLogin = async (loginEmail?: string) => {
    const target = loginEmail || email;
    if (!target) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await login(target);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-teal p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white">STATE</h1>
          <p className="text-blue-200/60 text-sm mt-1">Lessons Learned System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-heading font-semibold text-navy mb-4">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 bg-danger/10 text-danger text-sm rounded-lg px-3 py-2 mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="space-y-3 mb-5">
            <input
              type="email"
              className="input-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={() => handleLogin()} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Dev Quick Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleLogin(u.email)}
                  disabled={loading}
                  className="text-left p-2.5 rounded-lg border border-gray-100 hover:border-accent/30 hover:bg-accent/5 transition-colors"
                >
                  <p className="text-xs font-semibold text-navy">{u.label}</p>
                  <p className="text-[10px] text-gray-400">{u.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200/40 text-[11px] mt-6">
          In production, sign in via Microsoft Entra ID
        </p>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading, canViewDashboard, canSubmit } = useAuth();
  const [page, setPage] = useState<Page>(() => {
    // Default page based on likely role
    return 'dashboard';
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  // If user can't view dashboard, default to what they can see
  const effectivePage = page === 'dashboard' && !canViewDashboard
    ? (canSubmit ? 'add' : 'register')
    : page === 'add' && !canSubmit
    ? 'register'
    : page;

  return (
    <Layout currentPage={effectivePage} onNavigate={setPage}>
      {effectivePage === 'dashboard' && <Dashboard />}
      {effectivePage === 'add' && <LessonForm />}
      {effectivePage === 'register' && <Register />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
