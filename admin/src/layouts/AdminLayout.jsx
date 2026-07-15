import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  FolderLock,
  Eye,
  History,
  LogOut,
  Menu,
  X,
  UserCheck,
  Lightbulb,
} from 'lucide-react';
import useAdminAuthStore from '../store/adminAuthStore';

const AdminLayout = ({ children }) => {
  const { logout, admin } = useAdminAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleAdminLogout = () => {
      logout();
      navigate('/login');
    };

    window.addEventListener('admin-logout', handleAdminLogout);
    return () => {
      window.removeEventListener('admin-logout', handleAdminLogout);
    };
  }, [logout, navigate]);

  const navigationItems = [
    { name: 'Admin Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Pending Reviews', path: '/pending-reviews', icon: UserCheck },
    { name: 'Product Approvals', path: '/listing-approvals', icon: Eye },
    { name: 'Category Management', path: '/categories', icon: FolderLock },
    { name: 'Category Requests', path: '/category-requests', icon: Lightbulb },
    { name: 'Monitor Listings', path: '/listings', icon: LayoutDashboard },
    { name: 'Audit Logs', path: '/audit-logs', icon: History },
  ];

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  // Close mobile drawer when route changes
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ═══════════════════════════════════════════════════
          TOP HEADER — Brand / Status / User Actions
      ═══════════════════════════════════════════════════ */}
      <header className="bg-white text-slate-800 z-30 shadow-sm border-b border-slate-200 sticky top-0">
        
        {/* ── Row 1: Brand + actions ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-slate-900">TextileWasteHub</span>
              <span className="text-[8px] uppercase tracking-widest text-blue-600 font-bold mt-0.5">Admin Console</span>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Profile info (Desktop) */}
            <div className="hidden sm:flex items-center space-x-3 mr-4">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Administrator</p>
                <p className="text-xs font-semibold text-slate-700">{admin?.email}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-extrabold text-white border-2 border-slate-200">
                A
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleLogoutClick}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            Row 2: Navigation strip (desktop)
        ══════════════════════════════════════════════════ */}
        <nav className="hidden md:block border-t border-slate-100 bg-sky-500">
          <div className="max-w-7xl mx-auto px-6 flex items-center space-x-1 py-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════
          Mobile Menu Drawer
      ══════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 shadow-lg absolute w-full z-40">
          <nav className="px-4 pt-2 pb-6 flex flex-col space-y-1 h-[calc(100vh-64px)] overflow-y-auto">
            
            <div className="py-4 px-2 mb-2 border-b border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-500">Administrator</p>
              <p className="text-sm font-semibold text-white">{admin?.email}</p>
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════ */}
      <main className="flex-1 w-full bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
