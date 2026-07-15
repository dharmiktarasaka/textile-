import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Briefcase,
  FileText,
  BarChart3,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Store,
  Package,
  ClipboardList,
  Clock,
  CheckSquare,
  Archive,
  Zap,
  Search,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';

// ----- Navigation config -----
const BUYER_NAV = [
  { name: 'Explore', path: '/marketplace', icon: Search },
];

const SELLER_DASHBOARD_ITEMS = [
  { name: 'Add Product',        path: '/create-listing',    icon: PlusCircle },
  { name: 'My Products',        path: '/my-listings',       icon: Package },
  { name: 'Product Requests',   path: '/contact-requests',  icon: ClipboardList },
  { name: 'Pending Orders',     path: '/my-interests',      icon: Clock },
  { name: 'Accepted Orders',    path: '/accepted-orders',   icon: CheckSquare },
  { name: 'Sold Products',      path: '/sold-products',     icon: Archive },
  { name: 'Seller Analytics',   path: '/seller-analytics',  icon: BarChart3 },
  { name: 'Profile & Status',   path: '/profile',           icon: User },
];

// ---- Helper: check if any seller dashboard path is active ----
const isSellerDashboardActive = (pathname) =>
  SELLER_DASHBOARD_ITEMS.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );

const DashboardLayout = ({ children }) => {
  const { user, activeRole, setActiveRole, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const [sellerDropOpen, setSellerDropOpen]   = useState(false);
  const [unreadCount, setUnreadCount]         = useState(0);

  const dropRef = useRef(null);

  const isSeller   = user?.role === 'SELLER' || user?.role === 'BOTH';
  const inSeller   = activeRole === 'SELLER' && isSeller;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setSellerDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch unread notifications badge
  const fetchUnread = async () => {
    try {
      const res = await apiClient.get('/notifications/me');
      setUnreadCount(res.data.notifications.filter((n) => !n.isRead).length);
    } catch (_) {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const handleGlobalLogout = () => { logout(); navigate('/login'); };
    window.addEventListener('auth-logout', handleGlobalLogout);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, [logout, navigate]);

  const handleLogout = () => {
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

        {/* ── Row 1: Brand + status + actions ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Brand logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight leading-none text-slate-900">TextileWasteHub</span>
              <span className="text-[8px] uppercase tracking-widest text-brand-primary font-bold mt-0.5">B2B Directory</span>
            </div>
          </Link>

          {/* Status badge (desktop) */}
          <div className="hidden md:flex items-center space-x-3 border-l border-slate-200 pl-6 ml-6">
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
              GST: {user?.gstNumber}
            </span>
            {user?.verificationStatus === 'VERIFIED' ? (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3 text-sky-600" />
                <span>Verified</span>
              </span>
            ) : user?.verificationStatus === 'REJECTED' ? (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span>Rejected</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3 text-amber-600 animate-pulse" />
                <span>Pending</span>
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Notification bell */}
            <Link
              to="/notifications"
              className="relative p-2 text-slate-500 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Profile avatar */}
            <Link
              to="/profile"
              className="hidden sm:flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-extrabold text-sky-600 border-2 border-sky-200">
                {user?.contactPersonName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-semibold max-w-[90px] truncate text-slate-700">
                {user?.contactPersonName}
              </span>
            </Link>

            {/* Sign out */}
            <button
              onClick={handleLogout}
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
            Row 2: Role-aware navigation strip (desktop)
        ══════════════════════════════════════════════════ */}
        <nav className="hidden md:block border-t border-slate-100 bg-sky-500">
          <div className="max-w-7xl mx-auto px-6 flex items-center space-x-1 py-1">

            {/* Always-visible: Explore */}
            <Link
              to="/marketplace"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                location.pathname === '/marketplace'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explore</span>
            </Link>

            {/* Dashboard link (always visible for logged in) */}
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                location.pathname === '/dashboard'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {/* ── SELLER: Dropdown ── */}
            {inSeller && (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setSellerDropOpen(!sellerDropOpen)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isSellerDashboardActive(location.pathname)
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>Seller Dashboard</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sellerDropOpen ? 'rotate-180' : ''}`} />
                </button>

                {sellerDropOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in">
                    {SELLER_DASHBOARD_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setSellerDropOpen(false)}
                          className={`flex items-center space-x-2.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-sky-50 text-sky-600 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { setSellerDropOpen(false); setActiveRole('BUYER'); }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        <span>Switch to Buyer Mode</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BUYER: "Become a Seller" button ── */}
            {!inSeller && isSeller && (
              <button
                onClick={() => setActiveRole('SELLER')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-primary hover:bg-sky-600 text-white transition-colors ml-2 shadow-sm"
              >
                <Store className="h-4 w-4" />
                <span>Switch to Seller</span>
              </button>
            )}

            {!inSeller && !isSeller && (
              <Link
                to="/become-seller"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-primary hover:bg-sky-600 text-white transition-colors ml-2 shadow-sm"
              >
                <Store className="h-4 w-4" />
                <span>Become a Seller</span>
              </Link>
            )}

          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white z-20 py-4 px-6 space-y-4">

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase">GST: {user?.gstNumber}</span>
            {user?.verificationStatus === 'VERIFIED' ? (
              <span className="text-[9px] bg-sky-950/50 text-sky-400 px-2.5 py-0.5 rounded border border-sky-900 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified</span>
              </span>
            ) : (
              <span className="text-[9px] bg-amber-950/50 text-amber-400 px-2.5 py-0.5 rounded border border-amber-900 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3 animate-pulse" />
                <span>Pending</span>
              </span>
            )}
            {inSeller && (
              <span className="text-[9px] bg-sky-950/50 text-sky-400 px-2.5 py-0.5 rounded border border-sky-900 flex items-center space-x-1">
                <Store className="h-3 w-3" />
                <span>Seller Mode</span>
              </span>
            )}
          </div>

          {/* Core nav */}
          <nav className="flex flex-col space-y-1">
            <Link
              to="/marketplace"
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === '/marketplace' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                location.pathname === '/dashboard' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </nav>

          {/* Seller section */}
          {inSeller && (
            <div className="border-t border-slate-800 pt-3">
              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 px-4 mb-2">Seller Dashboard</p>
              <nav className="flex flex-col space-y-1">
                {SELLER_DASHBOARD_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Role toggle */}
          <div className="border-t border-slate-800 pt-3 space-y-2">
            {inSeller ? (
              <button
                onClick={() => setActiveRole('BUYER')}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-sky-400 hover:bg-sky-950/30 transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Switch to Buyer Mode</span>
              </button>
            ) : isSeller ? (
              <button
                onClick={() => setActiveRole('SELLER')}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-sky-400 hover:bg-sky-950/30 transition-colors"
              >
                <Store className="h-4 w-4" />
                <span>Switch to Seller Mode</span>
              </button>
            ) : (
              <Link
                to="/become-seller"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-sky-400 hover:bg-sky-950/30 transition-colors"
              >
                <Store className="h-4 w-4" />
                <span>Become a Seller</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PAGE CONTENT
      ═══════════════════════════════════════════ */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
