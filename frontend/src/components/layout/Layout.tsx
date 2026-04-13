import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FilePlus, ClipboardList, LogOut, Menu, X, ChevronRight, Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

type Page = 'dashboard' | 'add' | 'register';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const navItems: Array<{ id: Page; label: string; icon: React.ReactNode; roles?: string[] }> = [
  { id: 'dashboard', label: 'Master Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'add', label: 'Lesson Add Form', icon: <FilePlus size={20} /> },
  { id: 'register', label: 'Lesson Register', icon: <ClipboardList size={20} /> },
];

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, logout, canViewDashboard, canSubmit } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = navItems.filter((item) => {
    if (item.id === 'dashboard' && !canViewDashboard) return false;
    if (item.id === 'add' && !canSubmit) return false;
    return true;
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-white tracking-tight">STATE</h1>
            <p className="text-[11px] text-blue-200/70 uppercase tracking-widest">Lessons Learned</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-100/70 hover:bg-white/8 hover:text-white'
                }`}
            >
              <span className={active ? 'text-blue-200' : 'text-blue-200/50 group-hover:text-blue-200/80'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight size={14} className="text-blue-200/60" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center text-xs font-bold text-white">
              {user.displayName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-[11px] text-blue-200/50 truncate">{user.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-200/60
                       hover:bg-white/8 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-navy z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-navy z-50 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-navy">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-navy" />
            <span className="font-heading font-bold text-navy">STATE</span>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
