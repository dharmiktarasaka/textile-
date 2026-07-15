import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, MapPin, Clock, Edit2, Trash2, Check, RefreshCw, Eye, Briefcase, Plus, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/apiClient';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/listings?myListings=true');
      setListings(res.data.listings);
    } catch (err) {
      console.error('Failed to load my listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleMarkSold = async (id) => {
    if (!window.confirm('Are you sure you want to mark this lot as SOLD? This action is irreversible.')) return;
    setActionLoading(id);
    try {
      await apiClient.patch(`/listings/${id}/mark-sold`);
      fetchMyListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update listing status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/listings/${id}`);
      fetchMyListings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and CTA button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 font-sans">My Waste Listings</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track status updates for your posted textile waste lots.</p>
        </div>
        <Link
          to="/create-listing"
          className="bg-sky-500 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow shadow-brand-primary/20"
        >
          <Plus className="h-4 w-4" />
          <span>Post New Waste Lot</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <Briefcase className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-navy-900 text-lg">No Listings Posted Yet</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            You haven't posted any textile waste trade leads. Click the button above to post your first listing.
          </p>
          <Link
            to="/create-listing"
            className="inline-block bg-brand-primary text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
          >
            Post Your First Lot
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Title & Category</th>
                  <th className="px-6 py-4">Quantity & Price</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Views</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {listings.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50">
                    {/* Title */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        <Link to={`/listings/${item._id}`} className="font-bold text-sm text-navy-900 hover:text-sky-600 truncate block">
                          {item.title}
                        </Link>
                        <span className="text-[9px] font-bold text-sky-600 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                          {item.categoryId?.name}
                        </span>
                      </div>
                    </td>

                    {/* Quantity & Price */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-navy-900">
                        <p>{item.fields?.quantityKg} KG</p>
                        <p className="text-[10px] text-slate-400">
                          {item.fields?.priceExpectationPerKg ? `₹${item.fields.priceExpectationPerKg}/KG` : 'Negotiable'}
                        </p>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.fields?.location || 'N/A'}</span>
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      {item.status === 'ACTIVE' ? (
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded uppercase">
                          Active
                        </span>
                      ) : item.status === 'PENDING' ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
                          Pending Approval
                        </span>
                      ) : item.status === 'REJECTED' ? (
                        <div>
                          <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                            Rejected
                          </span>
                          <p className="text-[9px] text-red-500 mt-1 max-w-[150px] truncate" title={item.rejectionReason}>
                            {item.rejectionReason}
                          </p>
                        </div>
                      ) : item.status === 'SOLD' ? (
                        <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                          Sold
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Views */}
                    <td className="px-6 py-4 font-semibold text-navy-900">
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.viewCount}</span>
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/listings/${item._id}`}
                          className="p-1.5 border border-slate-200 text-slate-600 hover:text-navy-900 hover:bg-slate-50 rounded-lg transition-colors"
                          title="View listing details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {item.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleMarkSold(item._id)}
                            disabled={actionLoading !== null}
                            className="px-2.5 py-1.5 border border-slate-200 text-sky-600 hover:text-white hover:bg-sky-600 rounded-lg transition-colors flex items-center space-x-1.5 font-bold text-[9px] uppercase shadow-sm"
                            title="Mark as Sold"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Mark as Sold</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteListing(item._id)}
                          disabled={actionLoading !== null}
                          className="p-1.5 border border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

export default MyListings;
