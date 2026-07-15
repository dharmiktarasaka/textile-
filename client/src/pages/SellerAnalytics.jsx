import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Layers, FileText, CheckCircle2, ShieldCheck, PieChart, Star } from 'lucide-react';
import apiClient from '../api/apiClient';

const SellerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics/seller');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load seller analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const summary = data?.summary || {
    overallViews: 0,
    overallRequests: 0,
    overallAccepted: 0,
    totalActive: 0,
    totalSold: 0,
    listingCount: 0,
  };

  const listings = data?.listings || [];

  // Calculate inquiry conversion rate (percentage of requests accepted)
  const conversionRate = summary.overallRequests > 0
    ? Math.round((summary.overallAccepted / summary.overallRequests) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 font-sans">Seller Trading Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Review views, connections, and trade success rates for your posted waste lots.</p>
      </div>

      {/* Analytics Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Lot Views</p>
            <p className="text-2xl font-extrabold text-navy-900">{summary.overallViews}</p>
            <p className="text-[10px] text-slate-400">Unique business visitors</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connection Inquiries</p>
            <p className="text-2xl font-extrabold text-navy-900">{summary.overallRequests}</p>
            <p className="text-[10px] text-slate-400">Total contact requests</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <FileText className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Connections Accepted */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connections Opened</p>
            <p className="text-2xl font-extrabold text-navy-900">{summary.overallAccepted}</p>
            <p className="text-[10px] text-slate-400">Approved inquiries</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-blue-50 text-sky-600 flex items-center justify-center">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inquiry Conversion</p>
            <p className="text-2xl font-extrabold text-navy-900">{conversionRate}%</p>
            <p className="text-[10px] text-slate-400">Acceptance success rate</p>
          </div>
          <div className="h-11 w-11 rounded-lg bg-sky-50 text-brand-primary flex items-center justify-center">
            <PieChart className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Detailed listing performance breakdown */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-navy-800 uppercase tracking-wider">Detailed Listing Breakdown</h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm">
            <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold">No listing metrics to display.</p>
            <p className="text-slate-400 mt-1">Publish waste lots first to collect marketplace views and buyer leads.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Trade Lot Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Unique Views</th>
                    <th className="px-6 py-4">Pending leads</th>
                    <th className="px-6 py-4">Accepted leads</th>
                    <th className="px-6 py-4">Declined leads</th>
                    <th className="px-6 py-4">Created On</th>
                    <th className="px-6 py-4">Sold Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-navy-900">
                  {listings.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50">
                      {/* Title */}
                      <td className="px-6 py-4 font-bold text-navy-900 max-w-xs truncate">
                        {item.title}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                            Active
                          </span>
                        ) : item.status === 'SOLD' ? (
                          <span className="text-[9px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                            Sold
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Unique Views */}
                      <td className="px-6 py-4 font-semibold">{item.viewCount}</td>

                      {/* Pending leads */}
                      <td className="px-6 py-4 text-amber-600 font-semibold">{item.pendingRequests}</td>

                      {/* Accepted leads */}
                      <td className="px-6 py-4 text-blue-600 font-semibold">{item.acceptedRequests}</td>

                      {/* Declined leads */}
                      <td className="px-6 py-4 text-slate-400">{item.declinedRequests}</td>

                      {/* Created On */}
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Sold Date */}
                      <td className="px-6 py-4 text-slate-500">
                        {item.soldAt ? new Date(item.soldAt).toLocaleDateString() : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerAnalytics;
