import React, { useEffect, useState } from 'react';
import { Trash2, Search, MapPin, Eye, Calendar, Layers } from 'lucide-react';
import apiClient from '../api/apiClient';

const ListingMonitoring = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/listings');
      setListings(res.data.listings);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing? This action is logged.')) return;
    try {
      await apiClient.delete(`/admin/listings/${id}`);
      fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.companyId?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Marketplace Lot Monitoring</h1>
        <p className="text-xs text-slate-500 mt-1">Audit active trades, search titles, check parameters, or delete violating entries.</p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search title or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        {/* Status filters */}
        <div className="flex bg-slate-50 rounded-lg border border-slate-200 p-1 self-start">
          {['ALL', 'ACTIVE', 'SOLD', 'EXPIRED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Monitor table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm max-w-xl mx-auto space-y-3">
          <Layers className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Listings Found</h3>
          <p className="text-slate-400 mt-1">No listing trade entries found matching current query parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Trade Lot Title</th>
                  <th className="px-6 py-4">Seller Company</th>
                  <th className="px-6 py-4">Trade Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Views</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {filteredListings.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    {/* Title */}
                    <td className="px-6 py-4 max-w-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">{item.companyId?.name || 'N/A'}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Hub: {item.companyId?.city || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Trade details */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{item.fields?.quantityKg} KG</p>
                        <p className="text-[10px] text-slate-400">
                          {item.fields?.priceExpectationPerKg ? `₹${item.fields.priceExpectationPerKg}/KG` : 'Negotiable'}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {item.status === 'ACTIVE' ? (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                          Active
                        </span>
                      ) : item.status === 'SOLD' ? (
                        <span className="text-[9px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                          Sold
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* View Count */}
                    <td className="px-6 py-4 text-slate-500 font-semibold">{item.viewCount}</td>

                    {/* Created */}
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteListing(item._id)}
                        className="p-2 border border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                        title="Delete trade lot"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingMonitoring;
