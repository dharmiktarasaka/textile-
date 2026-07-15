import React, { useEffect, useState } from 'react';
import { FolderLock, Plus, Edit, Check, X, Trash2, ListPlus, Loader2, Info } from 'lucide-react';
import apiClient from '../api/apiClient';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  // New Category form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic schema fields builder state
  const [schemaFields, setSchemaFields] = useState([
    { name: 'quantityKg', type: 'number', required: true, enumValues: '' },
    { name: 'location', type: 'string', required: true, enumValues: '' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldEnumValues, setNewFieldEnumValues] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddSchemaField = () => {
    if (!newFieldName.trim()) {
      alert('Field Name is required');
      return;
    }
    
    // Convert fieldName to camelCase to avoid key space errors
    const camelCasedName = newFieldName
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
      .replace(/\s+/g, '');

    // Check duplicate
    if (schemaFields.some(f => f.name === camelCasedName)) {
      alert('Field with this name already exists in schema');
      return;
    }

    setSchemaFields(prev => [
      ...prev,
      {
        name: camelCasedName,
        type: newFieldType,
        required: newFieldRequired,
        enumValues: newFieldEnumValues,
      }
    ]);

    // Reset inputs
    setNewFieldName('');
    setNewFieldType('string');
    setNewFieldRequired(false);
    setNewFieldEnumValues('');
  };

  const handleRemoveSchemaField = (index) => {
    setSchemaFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug || schemaFields.length === 0) {
      alert('Name, Slug and at least one schema field is required');
      return;
    }

    setSubmitting(true);
    try {
      // Build fieldSchema object matching mongoose Category requirements
      const fieldSchema = {};
      schemaFields.forEach(f => {
        fieldSchema[f.name] = {
          type: f.type,
          required: f.required,
          ...(f.type === 'enum' && {
            values: f.enumValues.split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
          })
        };
      });

      await apiClient.post('/admin/categories', {
        name: newCatName,
        slug: newCatSlug.toLowerCase().trim().replace(/\s+/g, '-'),
        description: newCatDesc,
        fieldSchema,
      });

      // Reset Create Form
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setSchemaFields([
        { name: 'quantityKg', type: 'number', required: true, enumValues: '' },
        { name: 'location', type: 'string', required: true, enumValues: '' }
      ]);
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategoryActive = async (cat) => {
    try {
      await apiClient.patch(`/admin/categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category state');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Waste Category Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure waste trade classifications and custom schema forms for trade inputs.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-green hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center space-x-1 shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? 'Hide Form' : 'Create Category'}</span>
        </button>
      </div>

      {showAddForm && (
        /* CREATE CATEGORY SCHEMA FORM */
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-3xl animate-scale-up space-y-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-100 pb-2">
            New Category & Schema Configurator
          </h3>

          <form onSubmit={handleCategoryCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Category Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Cuttings Waste"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Slug URL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cotton-cuttings-waste"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs bg-slate-50 font-mono"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of category waste parameters..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Dynamic fields schema builder */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">Configure Schema attributes</span>
              
              {/* Added attributes list */}
              <div className="flex flex-wrap gap-2 mb-4">
                {schemaFields.map((field, idx) => (
                  <div key={idx} className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-slate-700">{field.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded py-0.5">{field.type}</span>
                    {field.required && (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">req</span>
                    )}
                    {field.type === 'enum' && (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 rounded py-0.5" title={field.enumValues}>enum</span>
                    )}
                    
                    {/* Don't allow deleting base quantity and location defaults for safety */}
                    {!['quantityKg', 'location'].includes(field.name) && (
                      <button type="button" onClick={() => handleRemoveSchemaField(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Fields inputs row */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                {/* Field name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Field Key/Name</label>
                  <input
                    type="text"
                    placeholder="e.g. fabricType"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 focus:outline-none rounded-lg text-xs"
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 focus:outline-none rounded-lg text-xs bg-white"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="array">Array</option>
                    <option value="enum">Enum</option>
                  </select>
                </div>

                {/* Required checkbox */}
                <div className="flex items-center space-x-2 pb-2.5">
                  <input
                    type="checkbox"
                    id="required_chk"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="required_chk" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer">Required</label>
                </div>

                {/* Submit row button */}
                <button
                  type="button"
                  onClick={handleAddSchemaField}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  Add Field
                </button>

                {/* Enum values parameters (only visible if enum selected) */}
                {newFieldType === 'enum' && (
                  <div className="col-span-4">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Enum Values (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. cotton, polyester, rayon, blend"
                      value={newFieldEnumValues}
                      onChange={(e) => setNewFieldEnumValues(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 focus:outline-none rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex justify-end space-x-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-brand-green hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Category</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories table list */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Category Detail</th>
                  <th className="px-6 py-4">Slug URL</th>
                  <th className="px-6 py-4">Custom Attributes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50/50">
                    {/* Name */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-sm">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{cat.description || 'No description provided.'}</p>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4 font-mono font-semibold text-slate-500">{cat.slug}</td>

                    {/* Custom Attributes schema counts */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {Object.entries(cat.fieldSchema || {}).map(([key, value]) => (
                          <span key={key} className="text-[9px] bg-slate-100 border border-slate-150 px-2 py-0.5 rounded text-slate-600">
                            {key}: {value.type}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {cat.isActive ? (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleCategoryActive(cat)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                          cat.isActive
                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {cat.isActive ? 'Deactivate' : 'Activate'}
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

export default CategoryManagement;
