import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  PlusCircle, Loader2, AlertCircle, ChevronRight, Info,
  CheckCircle2, Layers, Scissors, Store, Settings, Truck, RefreshCw,
  Send, X, Package, Lightbulb,
} from 'lucide-react';
import apiClient from '../api/apiClient';

// Icon map for category cards
const CATEGORY_ICONS = [Layers, Scissors, Store, Settings, Truck, RefreshCw, Package, Lightbulb];

const getCategoryIcon = (index) => {
  const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
  return <Icon className="h-6 w-6" />;
};

const CreateListing = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState([null, null, null, null]);
  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  const triggerSlotUpload = (index) => {
    setActiveSlot(index);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSlotFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotos((prev) => {
        const next = [...prev];
        next[activeSlot] = file;
        return next;
      });
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleBulkUpload = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotos((prev) => {
        const next = [...prev];
        let fileIdx = 0;
        for (let i = 0; i < 4; i++) {
          if (!next[i] && fileIdx < files.length) {
            next[i] = files[fileIdx];
            fileIdx++;
          }
        }
        return next;
      });
    }
    e.target.value = '';
  };

  // Suggest category state
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestDesc, setSuggestDesc] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  // Form hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        const res = await apiClient.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    reset({ categoryId: cat._id });
    setShowSuggestForm(false);
  };

  const onSubmit = async (data) => {
    if (!selectedCategory) {
      setError('Please select a waste category before publishing.');
      return;
    }
    const activePhotos = photos.filter(Boolean);
    if (activePhotos.length !== 4) {
      setError('You must upload exactly 4 photos of the product. Please upload a photo for all 4 slots.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const { title, expiresAt, ...fieldsInput } = data;

      const fields = {};
      Object.entries(selectedCategory.fieldSchema).forEach(([key, rules]) => {
        const val = fieldsInput[key];
        if (rules.type === 'number') {
          fields[key] = val !== undefined && val !== '' ? Number(val) : null;
        } else if (rules.type === 'array') {
          fields[key] = typeof val === 'string'
            ? val.split(',').map(x => x.trim()).filter(Boolean)
            : val || [];
        } else {
          fields[key] = val || null;
        }
      });

      const formData = new FormData();
      formData.append('categoryId', selectedCategory._id);
      formData.append('title', title);
      formData.append('fields', JSON.stringify(fields));
      if (expiresAt) {
        formData.append('expiresAt', new Date(expiresAt).toISOString());
      }
      
      activePhotos.forEach(photo => {
        formData.append('photos', photo);
      });

      await apiClient.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/my-listings');
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    if (!suggestName.trim()) {
      setSuggestError('Category name is required.');
      return;
    }
    setSuggestError('');
    setSuggestLoading(true);
    try {
      await apiClient.post('/category-requests', {
        name: suggestName.trim(),
        description: suggestDesc.trim(),
      });
      setSuggestSuccess(true);
      setSuggestName('');
      setSuggestDesc('');
    } catch (err) {
      setSuggestError(err.response?.data?.message || 'Failed to submit category suggestion.');
    } finally {
      setSuggestLoading(false);
    }
  };

  if (loadingCats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post Waste Lot Offer</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit scrap and surplus stocklots. Verified buyers matching details will receive notifications.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start space-x-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* ── STEP 1: Category Selection ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">
          Step 1 — Select Waste Category
        </h3>

        {categories.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No categories available yet. Use the suggestion form below to request one.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat, i) => {
              const isSelected = selectedCategory?._id === cat._id;
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all duration-150 group ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50 shadow-md shadow-sky-100'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-sky-500" />
                    </span>
                  )}
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600'
                  }`}>
                    {getCategoryIcon(i)}
                  </div>
                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-sky-700' : 'text-slate-800'}`}>
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{cat.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Suggest a new category */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {!showSuggestForm ? (
            <button
              type="button"
              onClick={() => { setShowSuggestForm(true); setSuggestSuccess(false); setSuggestError(''); }}
              className="flex items-center space-x-2 text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>My category is not listed — Suggest a new one</span>
            </button>
          ) : (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-sky-600" />
                  <p className="text-xs font-bold text-sky-800">Suggest a New Category</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowSuggestForm(false); setSuggestSuccess(false); setSuggestError(''); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {suggestSuccess ? (
                <div className="flex items-start space-x-2 bg-white border border-sky-200 rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-sky-800">Suggestion Submitted!</p>
                    <p className="text-[11px] text-sky-600 mt-0.5 leading-relaxed">
                      Your category suggestion is pending admin review. Once approved, it will appear in the listing form for all sellers.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSuggestSubmit} className="space-y-3">
                  {suggestError && (
                    <p className="text-[11px] text-red-600 font-medium">{suggestError}</p>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={suggestName}
                      onChange={e => setSuggestName(e.target.value)}
                      placeholder="e.g. Jute Waste, Leather Scrap, Rubber Waste"
                      className="w-full px-3 py-2 border border-slate-200 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-100 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={suggestDesc}
                      onChange={e => setSuggestDesc(e.target.value)}
                      placeholder="Briefly describe the type of waste material this category covers..."
                      className="w-full px-3 py-2 border border-slate-200 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-100 rounded-lg text-xs bg-white resize-none"
                    />
                  </div>
                  <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Your suggestion goes to admin review. Once approved, the category will be live on the marketplace for all sellers.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={suggestLoading}
                      className="flex items-center space-x-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {suggestLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Submitting...</span></>
                      ) : (
                        <><Send className="h-3.5 w-3.5" /><span>Submit Suggestion</span></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 2: Listing Details (only shown after category selected) ── */}
      {selectedCategory && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
              Step 2 — Listing Details ({selectedCategory.name})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Trade Post Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 800 KG Cotton Fabric Cuttings for recycling"
                  className="w-full px-3 py-2.5 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs font-medium"
                  {...register('title')}
                />
              </div>
            </div>

            {/* Dynamic fields */}
            <div className="border-t border-slate-100 pt-5 space-y-6">
              <div className="flex items-center space-x-1 text-xs text-sky-600 font-bold uppercase tracking-wider mb-2">
                <ChevronRight className="h-4 w-4" />
                <span>{selectedCategory.name} Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(selectedCategory.fieldSchema).map(([fieldName, rules]) => {
                  const label = fieldName.replace(/([A-Z])/g, ' $1').trim();
                  const isRequired = rules.required;

                  if (rules.type === 'enum') {
                    return (
                      <div key={fieldName}>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {label} {isRequired && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          required={isRequired}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs bg-slate-50"
                          {...register(fieldName)}
                        >
                          <option value="">-- Choose {label} --</option>
                          {rules.values.map(val => (
                            <option key={val} value={val}>
                              {val.replace(/_/g, ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (rules.type === 'array') {
                    return (
                      <div key={fieldName}>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {label} {isRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          required={isRequired}
                          placeholder="e.g. White, Grey, Navy (comma separated)"
                          className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                          {...register(fieldName)}
                        />
                      </div>
                    );
                  }

                  if (rules.type === 'number') {
                    return (
                      <div key={fieldName}>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          {label} {isRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="number"
                          required={isRequired}
                          placeholder={fieldName === 'gsm' ? 'e.g. 180' : 'Enter numeric value'}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                          {...register(fieldName)}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={fieldName}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        required={isRequired}
                        placeholder={fieldName === 'location' ? 'e.g. Surat Industrial Area' : 'Enter details'}
                        className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs"
                        {...register(fieldName)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Product Photos <span className="text-red-500">* (Exactly 4 Required)</span>
                </label>
                {photos.filter(Boolean).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotos([null, null, null, null])}
                    className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Hidden file input for individual slot upload */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleSlotFileChange}
              />

              {/* Bulk upload option */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBulkUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 border border-slate-200 p-2 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 whitespace-nowrap hidden sm:inline">
                  (Or choose bulk select)
                </span>
              </div>

              {/* 4 slots layout with previews & options to remove/change */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                {photos.map((photo, index) => {
                  const previewUrl = photo ? URL.createObjectURL(photo) : null;
                  return (
                    <div
                      key={index}
                      className={`relative h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all bg-slate-50 ${
                        photo ? 'border-slate-200 shadow-sm' : 'border-slate-300 hover:border-sky-400 cursor-pointer'
                      }`}
                      onClick={() => !photo && triggerSlotUpload(index)}
                    >
                      {photo ? (
                        <div className="relative w-full h-full group">
                          <img src={previewUrl} className="w-full h-full object-cover" alt={`Preview ${index + 1}`} />
                          
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center space-y-1.5 transition-all duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerSlotUpload(index);
                              }}
                              className="bg-white hover:bg-slate-100 text-slate-800 text-[9px] font-bold px-2 py-1 rounded-md shadow"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(index);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-md text-[9px] font-bold px-2 py-1 shadow"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-2 pointer-events-none select-none">
                          <PlusCircle className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                            Photo {index + 1}
                          </span>
                          <span className="text-[8px] text-slate-400 block mt-0.5">Click to add</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-400 font-medium">
                You have configured {photos.filter(Boolean).length} of 4 required product photo(s).
              </p>
            </div>

            {/* Expiry date */}
            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Listing Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg text-xs bg-slate-50"
                  {...register('expiresAt')}
                />
                <p className="text-[10px] text-slate-400 mt-1">Optional. Default: 30 days from creation.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg flex items-start space-x-2 text-[10px] text-slate-500">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="leading-relaxed">
                  Upon publishing, our system compares these parameters against saved alerts. An automated matching notification email will be dispatched to interested buyers.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/my-listings')}
                className="px-5 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>Submitting...</span></>
                ) : (
                  <span>Submit for Verification</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateListing;
