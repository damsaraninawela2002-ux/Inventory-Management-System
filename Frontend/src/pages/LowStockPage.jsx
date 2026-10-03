import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2, 
  Package, 
  SlidersHorizontal 
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { StockModal } from '../components/StockModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export const LowStockPage = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { success, error: toastError } = useToast();

  const loadLowStock = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getLowStock();
      setLowStockProducts(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load low stock inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLowStock();
  }, []);

  const handleUpdateStock = async (id, stockData) => {
    try {
      await productsApi.updateStock(id, stockData);
      success('Inventory replenished successfully.');
      loadLowStock();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update stock');
      throw err;
    }
  };

  const outOfStockCount = lowStockProducts.filter((p) => p.quantity === 0).length;
  const criticalCount = lowStockProducts.length - outOfStockCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Low Stock Alerts</h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {lowStockProducts.length} Attention Needed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Items that have dropped below safety thresholds or are completely depleted
          </p>
        </div>

        <button
          onClick={loadLowStock}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alert List</span>
        </button>
      </div>

      {/* Warning Alert Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Out of Stock</p>
            <p className="text-xl font-bold text-red-900">{outOfStockCount} Products</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Low Safety Stock</p>
            <p className="text-xl font-bold text-amber-900">{criticalCount} Products</p>
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All Stock Levels Healthy!</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              There are currently no products at or below their low-stock thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Product Info</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Current Qty</th>
                  <th className="py-3.5 px-4 text-center">Safety Threshold</th>
                  <th className="py-3.5 px-4 text-center">Shortfall</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-5 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {lowStockProducts.map((p) => {
                  const status = getStockStatus(p.quantity, p.lowStockThreshold);
                  const isOutOfStock = p.quantity === 0;
                  const shortfall = Math.max(0, p.lowStockThreshold - p.quantity);

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isOutOfStock
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : 'bg-amber-50/30 hover:bg-amber-50/60'
                      }`}
                    >
                      {/* Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                            isOutOfStock ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <span className="text-[11px] text-slate-400">Unit: {formatCurrency(p.price)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        <span className={`text-sm px-2.5 py-1 rounded-lg ${
                          isOutOfStock ? 'bg-red-100 text-red-700 font-extrabold' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.quantity}
                        </span>
                      </td>

                      {/* Threshold */}
                      <td className="py-4 px-4 text-center font-medium text-slate-600">
                        {p.lowStockThreshold}
                      </td>

                      {/* Shortfall */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-rose-600">
                          +{shortfall} needed
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setStockModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Restock Now</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StockModal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setSelectedProduct(null);
        }}
        onUpdateStock={handleUpdateStock}
        product={selectedProduct}
      />
    </div>
  );
};
