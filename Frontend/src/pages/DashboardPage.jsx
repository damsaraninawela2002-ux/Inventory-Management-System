import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  Plus, 
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { error: toastError } = useToast();

  const loadData = async () => {
    try {
      const [statsData, productsData] = await Promise.all([
        productsApi.getStats(),
        productsApi.getAll()
      ]);
      setStats(statsData);
      setProducts(productsData.slice(0, 5)); // recent 5 products
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
          <div className="h-9 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: 'Active items in inventory'
    },
    {
      title: 'Total Stock Value',
      value: formatCurrency(stats?.totalStockValue ?? 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      description: 'Cumulative asset valuation'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: (stats?.lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-600',
      bg: (stats?.lowStockCount ?? 0) > 0 ? 'bg-amber-50' : 'bg-slate-100',
      description: (stats?.lowStockCount ?? 0) > 0 ? 'Requires attention' : 'Healthy inventory level',
      isWarning: (stats?.lowStockCount ?? 0) > 0
    },
    {
      title: 'Categories',
      value: stats?.categoriesCount ?? 0,
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      description: 'Classification groups'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time overview of inventory stock, valuation, and threshold alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${
                card.isWarning ? 'border-amber-200 ring-2 ring-amber-500/10' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                  {card.value}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Low Stock Alert List & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Alert Section (Left 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low-Stock Watchlist</h3>
                <p className="text-xs text-slate-500">Products requiring immediate restocking</p>
              </div>
            </div>
            <Link
              to="/low-stock"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              View All ({stats?.lowStockCount ?? 0})
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-center">
            {(!stats?.recentLowStock || stats.recentLowStock.length === 0) ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Healthy Inventory</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  All products are currently well above their defined minimum threshold.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.recentLowStock.map((prod) => {
                  const status = getStockStatus(prod.quantity, prod.lowStockThreshold);
                  const percent = Math.min(
                    100,
                    Math.round((prod.quantity / (prod.lowStockThreshold || 1)) * 100)
                  );

                  return (
                    <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{prod.name}</p>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {prod.category}
                          </span>
                        </div>
                        {/* Threshold Bar */}
                        <div className="mt-2 flex items-center gap-3">
                          <div className="w-36 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prod.quantity === 0 ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(5, percent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {prod.quantity} / {prod.lowStockThreshold} threshold
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                        <Link
                          to="/products"
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                          Restock
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Inventory Overview (Right 1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Category Breakdown</h3>
                <p className="text-xs text-slate-500">Registered product classes</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-4">
              {stats?.categories && stats.categories.length > 0 ? (
                stats.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-700">{cat}</span>
                    <Link
                      to={`/products?category=${encodeURIComponent(cat)}`}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      Filter <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No categories recorded yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link
              to="/products"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Explore Complete Inventory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
