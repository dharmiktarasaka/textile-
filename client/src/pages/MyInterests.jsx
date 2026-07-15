import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Heart, Trash2, Loader2, AlertCircle, Plus, BellRing, Layers, MapPin } from 'lucide-react';
import apiClient from '../api/apiClient';

const MyInterests = () => {
  const [interests, setInterests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [interestsRes, categoriesRes] = await Promise.all([
        apiClient.get('/interests/me'),
        apiClient.get('/categories'),
      ]);
      setInterests(interestsRes.data.interests);
      setCategories(categoriesRes.data.categories);
    } catch (err) {
      console.error('Failed to load trade interests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateInterest = async (data) => {
    setError(null);
    setSubmitting(true);

    try {
      const { categoryId, minQty, location } = data;
      const subFilters = {};
      if (minQty) subFilters.minQty = Number(minQty);
      if (location) subFilters.location = location;

      await apiClient.post('/interests', {
        categoryId,
        subFilters,
      });

      reset();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register interest profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this alert? You will stop receiving match notifications for this setup.')) return;
    try {
      await apiClient.delete(`/interests/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove interest');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 font-sans">Trade Alert Interests</h1>
        <p className="text-xs text-slate-500 mt-1">Register specific scrap properties to receive automatic email/notification alerts when matching lots are published.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Interest Alert Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm self-start lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center space-x-1.5">
            <BellRing className="h-4.5 w-4.5 text-sky-600" />
            <span>Create New Trade Alert</span>
          </h3>

          <form onSubmit={handleSubmit(onCreateInterest)} className="space-y-4">
            {/* Category select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Waste Category</label>
              <select
                required
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs bg-slate-50 font-medium"
                {...register('categoryId')}
              >
                <option value="">-- Choose Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum quantity */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Min Quantity (KG)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                {...register('minQty')}
              />
            </div>

            {/* Location filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location / City Hub</label>
              <input
                type="text"
                placeholder="e.g. Surat (Case Insensitive)"
                className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                {...register('location')}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-500 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-lg flex items-center justify-center space-x-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating alert...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Activate Alert</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Active alerts list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-navy-800 uppercase tracking-wider">Active Notification Feeds</h2>

          {loading ? (
            <div className="flex items-center justify-center min-h-[200px] bg-white rounded-xl border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : interests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs shadow-sm">
              <Heart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold">No trade alerts registered.</p>
              <p className="text-slate-400 mt-1">Configure parameters on the left to receive matches instantly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {interests.map((item) => (
                <div key={item._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sky-600 font-bold text-xs uppercase">
                      <Layers className="h-4 w-4 flex-shrink-0" />
                      <span>{item.categoryId?.name}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>Min Quantity:</span>
                        <span className="text-navy-900 font-bold">
                          {item.subFilters?.minQty ? `${item.subFilters.minQty} KG` : 'No Limit'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>Location Hub:</span>
                        <span className="text-navy-900 font-bold flex items-center space-x-1.5">
                          {item.subFilters?.location ? (
                            <>
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{item.subFilters.location}</span>
                            </>
                          ) : (
                            'Any Location'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Feed</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInterests;
