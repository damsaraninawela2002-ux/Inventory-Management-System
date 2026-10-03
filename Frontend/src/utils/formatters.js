export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
};

export const getStockStatus = (quantity, threshold = 10) => {
  const qty = Number(quantity);
  const thr = Number(threshold);

  if (qty <= 0) {
    return {
      status: 'out_of_stock',
      label: 'Out of Stock',
      badgeClass: 'bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-500/10',
      dotClass: 'bg-red-500'
    };
  }

  if (qty <= thr) {
    return {
      status: 'low_stock',
      label: 'Low Stock',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-500/10',
      dotClass: 'bg-amber-500'
    };
  }

  return {
    status: 'in_stock',
    label: 'In Stock',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/10',
    dotClass: 'bg-emerald-500'
  };
};
