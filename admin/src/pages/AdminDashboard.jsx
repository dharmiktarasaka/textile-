import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Layers, FileText, ArrowRight, ShieldCheck, Clock, MapPin } from 'lucide-react';
import apiClient from '../api/apiClient';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    pendingApprovals: 0,
    activeListings: 0,
    auditCount: 0,
  });
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [companiesRes, pendingRes, listingsRes, logsRes] = await Promise.all([
        apiClient.get('/admin/companies'),
        apiClient.get('/admin/companies?status=PENDING'),
        apiClient.get('/admin/listings'),
        apiClient.get('/admin/audit-logs'),
      ]);

      const companiesList = companiesRes.data.companies;
      const pendingList = pendingRes.data.companies;
      const listingsList = listingsRes.data.listings;
      const logsList = logsRes.data.logs;

      setMetrics({
        totalCompanies: companiesList.length,
        pendingApprovals: pendingList.length,
        activeListings: listingsList.filter(l => l.status === 'ACTIVE').length,
        auditCount: logsList.length,
      });

      // Show top 5 pending companies
      setPendingCompanies(pendingList.slice(0, 5));
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
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
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Compliance Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">Review metrics and process registration audits for TextileWasteHub marketplace.</p>
      </div>

      {/* Admin stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total companies */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Companies</p>
            <p className="text-2xl font-extrabold text-slate-900">{metrics.totalCompanies}</p>
            <p className="text-[10px] text-slate-400">Total B2B accounts</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Pending approvals */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-amber-600">{metrics.pendingApprovals}</p>
            <p className="text-[10px] text-slate-400">GST/identity checks due</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Active listings */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Listings</p>
            <p className="text-2xl font-extrabold text-slate-900">{metrics.activeListings}</p>
            <p className="text-[10px] text-slate-400">Live trade offers</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Audit actions */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit logs</p>
            <p className="text-2xl font-extrabold text-slate-900">{metrics.auditCount}</p>
            <p className="text-[10px] text-slate-400">Total admin tasks logged</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileText className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main dashboard columns split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Pending companies list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Awaiting Verification Review</h2>
            <Link to="/pending-reviews" className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1">
              <span>View All Pending</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-sm">
              <ShieldCheck className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-pulse" />
              <p className="font-bold text-slate-800">Clear Compliance Queue!</p>
              <p className="mt-1">All registered companies have been audited.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Company Details</th>
                      <th className="px-6 py-4">GSTIN</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Submitted On</th>
                      <th className="px-6 py-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                    {pendingCompanies.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        {/* Company */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.companyType}
                            </span>
                          </div>
                        </td>

                        {/* GST */}
                        <td className="px-6 py-4 text-slate-600 font-mono font-semibold">{item.gstNumber}</td>

                        {/* Location */}
                        <td className="px-6 py-4 text-slate-500">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span>{item.city}, {item.state}</span>
                          </span>
                        </td>

                        {/* Submitted On */}
                        <td className="px-6 py-4 text-slate-400 inline-flex items-center space-x-1.5 pt-6">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </td>

                        {/* Review Action */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/pending-reviews/${item._id}`}
                            className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm hover:shadow"
                          >
                            Review Doc
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Console settings card */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Console Shortcuts</h2>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="space-y-3">
              <Link
                to="/categories"
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
              >
                Manage Waste Categories
              </Link>
              <Link
                to="/listings"
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
              >
                Monitor Marketplace Lots
              </Link>
              <Link
                to="/audit-logs"
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center"
              >
                Inspect Audit History Logs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
