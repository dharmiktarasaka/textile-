import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Layers,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  Building,
  MapPin,
  Clock
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiClient from '../api/apiClient';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    contactRequests: 0,
    unreadAlerts: 0,
  });
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch seller stats/analytics
      const analyticsRes = await apiClient.get('/analytics/seller');
      const { summary } = analyticsRes.data;

      // Fetch unread notifications
      const notifyRes = await apiClient.get('/notifications/me');
      const unreadAlertsCount = notifyRes.data.notifications.filter(n => !n.isRead).length;

      // Fetch recent listings (scoped to current user's own products)
      const listingsRes = await apiClient.get('/listings?myListings=true&limit=4');

      setStats({
        activeListings: summary?.totalActive || 0,
        totalViews: summary?.overallViews || 0,
        contactRequests: summary?.overallRequests || 0,
        unreadAlerts: unreadAlertsCount,
      });
      setRecentListings(listingsRes.data.listings);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-2xl p-8 border border-blue-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] hidden md:block"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold text-sky-600 uppercase bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
            B2B Enterprise Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.contactPersonName}!</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Manage listing offers, browse raw scraps and rolls posted by mills, and response to buyer contact requests for <strong>{user?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Grid Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active listings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Listings</p>
            <p className="text-2xl font-extrabold text-navy-900">{stats.activeListings}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-sky-600 flex items-center justify-center">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* View Counts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unique views</p>
            <p className="text-2xl font-extrabold text-navy-900">{stats.totalViews}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Contact Requests */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trade Enquiries</p>
            <p className="text-2xl font-extrabold text-navy-900">{stats.contactRequests}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Unread alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unread Alerts</p>
            <p className="text-2xl font-extrabold text-navy-900">{stats.unreadAlerts}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <Bell className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main content sections split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent listings from the marketplace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">Your Recent Listings</h2>
            <Link to="/my-listings" className="text-xs font-semibold text-sky-600 hover:underline flex items-center space-x-1">
              <span>View All Listings</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentListings.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                You have not created any listings yet.
              </div>
            ) : (
              recentListings.map((listing) => (
                <div key={listing._id} className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl overflow-hidden shadow-sm hover:shadow transition-all group flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {listing.categoryId?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 inline-flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-navy-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                      {listing.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{listing.companyId?.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>{listing.fields?.location || listing.companyId?.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Lot Qty</p>
                      <p className="text-xs font-bold text-navy-900">{listing.fields?.quantityKg || 'N/A'} KG</p>
                    </div>
                    <Link
                      to={`/listings/${listing._id}`}
                      className="bg-brand-primary hover:bg-navy-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Profile summary card */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-navy-900">Enterprise Profile</h2>
          
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-navy-100 rounded-lg flex items-center justify-center font-bold text-navy-900 text-lg">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-navy-900 truncate">{user?.name}</h4>
                <p className="text-xs text-slate-500 font-semibold uppercase">{user?.companyType}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registration ID / GST:</span>
                <span className="font-semibold text-navy-900">{user?.gstNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-medium text-navy-900">{user?.contactPersonName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hub Location:</span>
                <span className="font-medium text-navy-900">{user?.city}, {user?.state}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Compliance Status:</span>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 inline-flex items-center space-x-1">
                  <ShieldCheck className="h-3 w-3 text-blue-500" />
                  <span>VERIFIED</span>
                </span>
              </div>
            </div>

            <Link
              to="/profile"
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
            >
              Manage Business Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
