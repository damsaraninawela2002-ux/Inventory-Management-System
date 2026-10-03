import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Layers,
  SlidersHorizontal,
  Package,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';
import { productsApi } from '../api/productsApi';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { ProductModal } from '../components/ProductModal';
import { StockModal } from '../components/StockModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchCategories = async () => {
    try {
      const cats = await productsApi.getCategories();
      setCategories(cats);
    } catch {
      // ignore
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({
        search: searchTerm,
        category: selectedCategory
      });
      setProducts(data);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, toastError]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleCreateOrUpdate = async (productData) => {
    try {
      if (selectedProduct) {
        await productsApi.update(selectedProduct.id, productData);
        success(`Product "${productData.name}" updated successfully.`);
      } else {
        await productsApi.create(productData);
        success(`Product "${productData.name}" added to inventory.`);
      }
      loadProducts();
      fetchCategories();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save product');
      throw err;
    }
  };

  const handleUpdateStock = async (id, stockData) => {
    try {
      await productsApi.updateStock(id, stockData);
      success('Stock level updated successfully.');
      loadProducts();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update stock');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(deleteProduct.id);
      success(`Product "${deleteProduct.name}" removed from inventory.`);
      setConfirmModalOpen(false);
      setDeleteProduct(null);
      loadProducts();
      fetchCategories();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products Inventory</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor, edit, restock, and manage all your catalog items
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProduct(null);
            setProductModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSearchParams(e.target.value === 'All' ? {} : { category: e.target.value });
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadProducts}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Reload table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description={
              searchTerm || selectedCategory !== 'All'
                ? 'Try broadening your search query or category filter.'
                : 'Your inventory is currently empty. Get started by adding your first product!'
            }
            action={
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setProductModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Product Info</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Stock Level</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((p) => {
                  const status = getStockStatus(p.quantity, p.lowStockThreshold);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Name */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 font-semibold text-xs flex-shrink-0">
                            <Package className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Threshold: {p.lowStockThreshold} units
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Quantity & Bar */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-bold text-slate-900">
                          {p.quantity}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Stock Adjust button */}
                          <button
                            onClick={() => {
                              setStockProduct(p);
                              setStockModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                            title="Adjust quantity"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Stock</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              setDeleteProduct(p);
                              setConfirmModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleCreateOrUpdate}
        product={selectedProduct}
        categories={categories}
      />

      <StockModal
        isOpen={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false);
          setStockProduct(null);
        }}
        onUpdateStock={handleUpdateStock}
        product={stockProduct}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDeleteProduct(null);
        }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${deleteProduct?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        loading={deleteLoading}
      />
    </div>
  );
};
