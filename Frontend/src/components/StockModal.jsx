import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';

export const StockModal = ({ isOpen, onClose, onUpdateStock, product }) => {
  const [action, setAction] = useState('add'); // 'add', 'remove', 'set'
  const [amount, setAmount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAction('add');
    setAmount(1);
    setError('');
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentStock = product.quantity || 0;
  const numAmount = parseInt(amount, 10) || 0;

  let calculatedNewStock = currentStock;
  if (action === 'add') {
    calculatedNewStock = currentStock + numAmount;
  } else if (action === 'remove') {
    calculatedNewStock = currentStock - numAmount;
  } else if (action === 'set') {
    calculatedNewStock = numAmount;
  }

  const isInvalid = calculatedNewStock < 0 || numAmount < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount < 0) {
      setError('Amount must be 0 or greater.');
      return;
    }
    if (calculatedNewStock < 0) {
      setError(`Cannot remove ${numAmount} items. Current stock is only ${currentStock}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onUpdateStock(product.id, {
        action,
        amount: numAmount
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div>
              <h3 className="text-base font-bold text-slate-900">Adjust Stock Level</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Current Stock Indicator */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Stock</span>
              <span className="text-lg font-bold text-slate-800">{currentStock} units</span>
            </div>

            {/* Action Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Operation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('add')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    action === 'add'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 mb-1 text-emerald-600" />
                  Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAction('remove')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    action === 'remove'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 mb-1 text-rose-600" />
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setAction('set')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    action === 'set'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 mb-1 text-blue-600" />
                  Set Exact
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {action === 'set' ? 'New Total Quantity' : 'Quantity To Apply'}
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Preview Calculation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Calculated Stock After Update</span>
              <span className={`text-base font-bold ${calculatedNewStock < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {calculatedNewStock} units
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-medium text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                disabled={submitting || isInvalid}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
