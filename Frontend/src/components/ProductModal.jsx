import React, { useState, useEffect } from 'react';
import { X, Loader2, PackagePlus, Edit3, DollarSign, Layers, Hash, AlertCircle } from 'lucide-react';

export const ProductModal = ({ isOpen, onClose, onSave, product, categories = [] }) => {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    category: '',
    lowStockThreshold: 10
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [customCategory, setCustomCategory] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        category: product.category || '',
        lowStockThreshold: product.lowStockThreshold ?? 10
      });
      setCustomCategory(false);
    } else {
      setFormData({
        name: '',
        price: '',
        quantity: '',
        category: categories.length > 0 ? categories[0] : 'Electronics',
        lowStockThreshold: 10
      });
      setCustomCategory(false);
    }
    setErrors({});
  }, [product, isOpen, categories]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Product name is required.';
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errs.price = 'Price must be greater than 0.';
    }

    const qtyNum = parseInt(formData.quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      errs.quantity = 'Quantity must be 0 or greater.';
    }

    if (!formData.category.trim()) {
      errs.category = 'Category is required.';
    }

    const thresholdNum = parseInt(formData.lowStockThreshold, 10);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      errs.lowStockThreshold = 'Low stock threshold cannot be negative.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        category: formData.category.trim(),
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10)
      });
      onClose();
    } catch (err) {
      // Form level error handled by caller toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                {isEditing ? <Edit3 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEditing ? 'Update existing product information' : 'Fill in the details to add to inventory'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ergonomic Office Chair"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Unit Price ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.price
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.quantity
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.quantity}
                  </p>
                )}
              </div>
            </div>

            {/* Category & Low Stock Threshold Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomCategory(!customCategory)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {customCategory ? 'Select existing' : '+ Custom'}
                  </button>
                </div>

                {customCategory ? (
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Enter new category"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {!categories.includes('Electronics') && <option value="Electronics">Electronics</option>}
                    {!categories.includes('Furniture') && <option value="Furniture">Furniture</option>}
                    {!categories.includes('Office Supplies') && <option value="Office Supplies">Office Supplies</option>}
                  </select>
                )}
                {errors.category && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  placeholder="10"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.lowStockThreshold
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-600'
                  }`}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Alert when quantity drops to this or below
                </span>
                {errors.lowStockThreshold && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.lowStockThreshold}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
