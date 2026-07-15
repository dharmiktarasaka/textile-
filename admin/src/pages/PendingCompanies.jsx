import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, MapPin, Clock, Search, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '../api/apiClient';

const PendingCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, VERIFIED, REJECTED, or ALL
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const query = statusFilter === 'PROFILE UPDATES'
        ? '?hasProfileUpdate=true'
        : (statusFilter !== 'ALL' ? `?status=${statusFilter}` : '');
      const res = await apiClient.get(`/admin/companies${query}`);
      setCompanies(res.data.companies);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter]);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Company Registration Queue</h1>
          <p className="text-xs text-slate-500 mt-1">Audit credentials, tax filings, and GST details before unlocking marketplace access.</p>
        </div>
        
        {/* Status filters */}
        <div className="flex bg-white rounded-lg border border-slate-200 p-1.5 self-start">
          {['PENDING', 'VERIFIED', 'REJECTED', 'PROFILE UPDATES', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                statusFilter === status
                  ? 'bg-brand-green text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Search and control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search company name or GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        <button
          onClick={fetchCompanies}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 flex-shrink-0"
          title="Refresh table"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Main Companies Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 text-xs shadow-sm max-w-xl mx-auto space-y-3">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Companies Found</h3>
          <p className="text-slate-400 mt-1">No company profile accounts match the current filters and search values.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">GSTIN ID</th>
                  <th className="px-6 py-4">Sector Type</th>
                  <th className="px-6 py-4">Contact Person</th>
                  <th className="px-6 py-4">Hub Location</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {filteredCompanies.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    {/* Name */}
                    <td className="px-6 py-4 max-w-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </td>

                    {/* GST */}
                    <td className="px-6 py-4 font-mono text-slate-600 font-semibold">{item.gstNumber}</td>

                    {/* Sector */}
                    <td className="px-6 py-4 text-slate-500 font-semibold uppercase">{item.companyType}</td>

                    {/* Contact Person */}
                    <td className="px-6 py-4 space-y-0.5">
                      <p>{item.contactPersonName}</p>
                      <p className="text-[10px] text-slate-400">{item.contactEmail}</p>
                    </td>

                    {/* Hub */}
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.city}, {item.state}</span>
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="px-6 py-4">
                      {item.pendingProfileUpdate?.hasPendingChange ? (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase inline-flex items-center space-x-1 animate-pulse">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Profile Change</span>
                        </span>
                      ) : item.verificationStatus === 'VERIFIED' ? (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase inline-flex items-center space-x-1">
                          <ShieldCheck className="h-3 w-3 text-blue-500" />
                          <span>Verified</span>
                        </span>
                      ) : item.verificationStatus === 'REJECTED' ? (
                        <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase inline-flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase inline-flex items-center space-x-1 animate-pulse">
                          <Clock className="h-3 w-3 text-amber-500" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Review Actions */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/pending-reviews/${item._id}`}
                        className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs"
                      >
                        Inspect details
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
  );
};

export default PendingCompanies;
