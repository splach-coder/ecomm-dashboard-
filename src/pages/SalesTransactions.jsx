import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { fetchSalesWithProduct, fetchTradesWithProducts, updateSellPaymentStatus } from "../features/updateProductStock";
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';

const SalesTransactions = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [sales, setSales] = useState([]);
  const [trades, setTrades] = useState([]);
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('sales');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'paid', 'all'

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  // Safe format date functions
  const formatDate = (dateString) => {
    try {
      const date = dateString ? new Date(dateString) : new Date();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = dateString ? new Date(dateString) : new Date();
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true);
      setError(null);
      try {
        const [salesData, tradesData] = await Promise.all([
          fetchSalesWithProduct(),
          fetchTradesWithProducts()
        ]);
        
        // Ensure salesData is an array
        const safeSales = Array.isArray(salesData) ? salesData : [];
        setSales(safeSales);
        
        // Transform trades to match sales format for display
        const safeTrades = Array.isArray(tradesData) ? tradesData : [];
        const formattedTrades = safeTrades.map(trade => ({
          id: trade?.id || 'N/A',
          type: 'trade',
          product_id: trade?.new_product_id || 'N/A',
          product: trade?.new_product || { title: 'Unknown Product', price: 0, images: [], sku: 'N/A' },
          sell_price: trade?.new_product_price || 0,
          original_price: trade?.new_product?.price || 0,
          profit: trade?.profit || 0,
          buyer_name: trade?.buyer_name || 'Trade Customer',
          buyer_phone: trade?.buyer_phone || 'N/A',
          created_at: trade?.created_at || new Date().toISOString(),
          trade_details: trade || {}
        }));
        
        setTrades(formattedTrades);
      } catch (err) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Filter sales by search query (case-insensitive, name or phone)
  const filteredSales = useMemo(() => {
    let filtered = sales;
    // Status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(sale => !sale.is_fully_paid);
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(sale => sale.is_fully_paid);
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale =>
        (sale.buyer_name && sale.buyer_name.toLowerCase().includes(query)) ||
        (sale.buyer_phone && sale.buyer_phone.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [sales, searchQuery, statusFilter]);

  // Combine filtered sales and all trades for display
  const allTransactions = useMemo(() => {
    const safeSales = Array.isArray(filteredSales) ? filteredSales : [];
    const safeTrades = Array.isArray(trades) ? trades : [];
    return [...safeSales, ...safeTrades]
      .map(t => ({
        ...t,
        product: t.product || { title: 'Unknown Product', price: 0, images: [], sku: 'N/A' },
        sell_price: t.sell_price || 0,
        created_at: t.created_at || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filteredSales, trades]);

  // Filter transactions based on date range with safe checks
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(allTransactions)) return [];
    
    return allTransactions.filter(transaction => {
      try {
        const transactionDate = new Date(transaction.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && end) {
          return transactionDate >= start && transactionDate <= end;
        } else if (start) {
          return transactionDate >= start;
        } else if (end) {
          return transactionDate >= start && transactionDate <= end; // Adjusted to include transactions on the end date
        }
        return true;
      } catch {
        return false;
      }
    });
  }, [allTransactions, startDate, endDate]);

  // Calculate totals with safe defaults
  const totals = useMemo(() => {
    if (!Array.isArray(filteredTransactions)) {
      return { totalSales: 0, totalProfit: 0, count: 0 };
    }
    
    return filteredTransactions.reduce((acc, transaction) => {
      const productPrice = transaction.product?.price || 0;
      const sellPrice = transaction.sell_price || 0;
      
      const profit = transaction.type === 'trade' 
        ? transaction.profit || 0
        : sellPrice - productPrice;
      
      return {
        totalSales: acc.totalSales + sellPrice,
        totalProfit: acc.totalProfit + profit,
        count: acc.count + 1
      };
    }, { totalSales: 0, totalProfit: 0, count: 0 });
  }, [filteredTransactions]);

  const handleViewSale = (transaction) => {
    if (!transaction) return;
    
    const productPrice = transaction.product?.price || 0;
    const sellPrice = transaction.sell_price || 0;
    
    const profit = transaction.type === 'trade' 
      ? transaction.profit || 0
      : sellPrice - productPrice;
    
    setSelectedSale({
      ...transaction,
      product: transaction.product || { title: 'Unknown Product', price: 0, images: [], sku: 'N/A' },
      profit: profit,
      isTrade: transaction.type === 'trade',
      trade_details: transaction.trade_details || {}
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
  };

  // Payment status toggle handler
  const handlePaymentToggle = async (transaction) => {
    if (transaction.type === 'trade') return;
    setUpdatingPaymentId(transaction.id);
    try {
      await updateSellPaymentStatus(
        transaction.id,
        !transaction.is_fully_paid,
        transaction.paid_price,
        transaction.sell_price
      );
      // Refetch sales data after update
      const updatedSales = await fetchSalesWithProduct();
      setSales(updatedSales);
    } catch (err) {
      alert('Failed to update payment status: ' + (err.message || err));
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Transaction type tag component
  const TransactionTypeTag = ({ type }) => {
    const isTrade = type === 'trade';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isTrade ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
      }`}>
        {isTrade ? t('sales_transactions.summary.trade') : t('sales_transactions.summary.sale')}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-10">
          <BottomNavigation 
            activeItem={activeItem} 
            onItemClick={handleItemClick} 
            onLogout={handleLogout} 
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-500">{t('sales_transactions.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-10">
          <BottomNavigation 
            activeItem={activeItem} 
            onItemClick={handleItemClick} 
            onLogout={handleLogout} 
          />
        </div>
        <div className="flex-1 p-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{t('sales_transactions.error')}: {error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex mb-12">
      {/* Sidebar for larger screens */}
      <div className="hidden lg:block">
        <Sidebar 
          isOpen={isOpen} 
          onToggle={handleToggle} 
          activeItem={"/sales"} 
          onItemClick={handleItemClick} 
          onLogout={handleLogout} 
        />
      </div>

      {/* BottomNavigation for mobile screens */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-10">
        <BottomNavigation 
          activeItem={activeItem} 
          onItemClick={handleItemClick} 
          onLogout={handleLogout} 
        />
      </div>
      
      <div className="flex-1 pb-16 lg:pb-0">
        <div className="container mx-auto p-4 lg:p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-oceanblue mb-4">
              {t('sales_transactions.title')}
            </h1>
            
            {/* Redesigned Filtering Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-end">
              {/* Date Range Filter */}
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales_transactions.start_date')}
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales_transactions.end_date')}
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales_transactions.status_filter')}
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="all">All</option>
                </select>
              </div>

              {/* Search Bar for Sells */}
              <div className="relative">
                <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales_transactions.search_label')}
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pb-1">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search-query"
                  type="text"
                  placeholder={t('sales_transactions.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setStatusFilter('pending');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('sales_transactions.clear_filters')}
              </button>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500 mt-2">
              {t('sales_transactions.showing_results', {
                count: filteredTransactions.length,
                total: allTransactions.length
              })}
            </div>
          </div>

          {/* Summary Cards - Mobile */}
          <div className="lg:hidden flex-col gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg p-4 mb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('sales_transactions.summary.transactions')}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">{totals.count}</dd>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-2">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {t('sales_transactions.summary.total_profit')}
                  </dt>
                  <dd className={`text-lg font-semibold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.totalProfit >= 0 ? '+' : ''}{totals.totalProfit.toFixed(2)} MAD
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards - Desktop */}
          <div className="hidden lg:grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('sales_transactions.summary.transactions')}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">{totals.count}</dd>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('sales_transactions.summary.total_sales')}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">{totals.totalSales.toFixed(2)} MAD</dd>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {t('sales_transactions.summary.total_profit')}
                    </dt>
                    <dd className={`text-2xl font-semibold ${totals.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totals.totalProfit >= 0 ? '+' : ''}{totals.totalProfit.toFixed(2)} MAD
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('sales_transactions.no_transactions.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {allTransactions.length === 0
                  ? t('sales_transactions.no_transactions.description')
                  : t('sales_transactions.no_transactions.filtered_description')}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Desktop Table */}
              <table className="min-w-full divide-y divide-gray-200 hidden lg:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.product')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.buyer')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.date')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.sale_price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.profit')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.type')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.payment_status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('sales_transactions.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const product = transaction.product || {};
                    const productPrice = product.price || 0;
                    const sellPrice = transaction.sell_price || 0;
                    
                    const profit = transaction.type === 'trade' 
                      ? transaction.profit || 0
                      : sellPrice - productPrice;
                    const isProfit = profit >= 0;

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                                alt={product.title}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.title || 'Unknown Product'}</div>
                              <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.buyer_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sellPrice.toFixed(2)} MAD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isProfit ? '+' : ''}{profit.toFixed(2)} MAD
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TransactionTypeTag type={transaction.type} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {transaction.type !== 'trade' ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.is_fully_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {transaction.is_fully_paid ? 'Paid' : 'Pending'}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewSale(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {t('sales_transactions.summary.view')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile List */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => {
                  const product = transaction.product || {};
                  const productPrice = product.price || 0;
                  const sellPrice = transaction.sell_price || 0;
                  
                  const profit = transaction.type === 'trade' 
                    ? transaction.profit || 0
                    : sellPrice - productPrice;
                  const isProfit = profit >= 0;

                  return (
                    <div 
                      key={transaction.id} 
                      className="p-4 hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => handleViewSale(transaction)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <img
                            className="h-16 w-16 rounded-md object-cover"
                            src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                            alt={product.title}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {product.title || 'Unknown Product'}
                              </div>
                              <div className="text-xs text-gray-500">{formatDate(transaction.created_at)}</div>
                              <div className="mt-1">
                                <TransactionTypeTag type={transaction.type} />
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {isProfit ? '+' : ''}{profit.toFixed(2)} MAD
                            </span>
                          </div>
                          {/* Payment Status badge for sells only */}
                          {transaction.type !== 'trade' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.is_fully_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} mt-1`}>
                              {transaction.is_fully_paid ? 'Paid' : 'Pending'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for transaction details */}
      {selectedSale && (
        <>
          {/* Desktop Modal */}
          <div className={`hidden lg:block fixed inset-0 overflow-y-auto ${showModal ? '' : 'hidden'}`}>
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {selectedSale.isTrade 
                      ? t('sales_transactions.details.title.trade') 
                      : t('sales_transactions.details.title.sale')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('sales_transactions.details.product')}
                      </label>
                      <div className="mt-1 flex items-center">
                        <img
                          className="h-16 w-16 rounded-md object-cover mr-4"
                          src={selectedSale.product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                          alt={selectedSale.product.title}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.product.title || 'Unknown Product'}</p>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.original_price')}: {selectedSale.product.price?.toFixed(2) || '0.00'} MAD
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedSale.isTrade && selectedSale.trade_details && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('sales_transactions.details.traded_product')}
                        </label>
                        <div className="mt-1 flex items-center">
                          {selectedSale.trade_details.old_product ? (
                            <>
                              <img
                                className="h-16 w-16 rounded-md object-cover mr-4"
                                src={selectedSale.trade_details.old_product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                                alt={selectedSale.trade_details.old_product.title}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedSale.trade_details.old_product.title || 'Unknown Product'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {t('sales_transactions.details.buyback_price')}: {selectedSale.trade_details.buyback_price?.toFixed(2) || '0.00'} MAD
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No product details available</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('sales_transactions.details.buyer_info')}
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.name')}
                          </p>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.phone')}
                          </p>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {!selectedSale.isTrade && (
                      <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-gray-500">Paid Price:</span>
                          <span className="text-sm font-medium text-gray-900">{selectedSale.paid_price?.toFixed(2) || '0.00'} MAD</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-gray-500">Rest Price:</span>
                          <span className="text-sm font-medium text-gray-900">{selectedSale.rest_price?.toFixed(2) || '0.00'} MAD</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <label htmlFor="payment-toggle-desktop" className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                id="payment-toggle-desktop"
                                type="checkbox"
                                className="sr-only"
                                checked={selectedSale.is_fully_paid}
                                disabled={updatingPaymentId === selectedSale.id}
                                onChange={async () => {
                                  setUpdatingPaymentId(selectedSale.id);
                                  try {
                                    await updateSellPaymentStatus(
                                      selectedSale.id,
                                      !selectedSale.is_fully_paid,
                                      selectedSale.paid_price,
                                      selectedSale.sell_price
                                    );
                                    const updatedSales = await fetchSalesWithProduct();
                                    setSales(updatedSales);
                                    const updated = updatedSales.find(s => s.id === selectedSale.id);
                                    if (updated) setSelectedSale({ ...selectedSale, ...updated });
                                  } catch (err) {
                                    alert('Failed to update payment status: ' + (err.message || err));
                                  } finally {
                                    setUpdatingPaymentId(null);
                                  }
                                }}
                              />
                              <div className={`block ${selectedSale.is_fully_paid ? 'bg-green-500' : 'bg-gray-300'} w-14 h-8 rounded-full transition`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${selectedSale.is_fully_paid ? 'translate-x-full border-green-500' : 'border-gray-300'}`}></div>
                            </div>
                            <span className={`ml-3 text-sm font-medium ${selectedSale.is_fully_paid ? 'text-green-800' : 'text-yellow-800'}`}>
                              {selectedSale.is_fully_paid ? 'Paid' : 'Pending'}
                            </span>
                          </label>
                          {updatingPaymentId === selectedSale.id && (
                            <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="4"/><path d="M4 12a8 8 0 018-8" stroke="#3B82F6" strokeWidth="4"/></svg>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('sales_transactions.details.transaction_details')}
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.sale_price')}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedSale.sell_price?.toFixed(2) || '0.00'} MAD
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.profit')}
                          </p>
                          <p className={`text-sm font-medium ${selectedSale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedSale.profit >= 0 ? '+' : ''}{selectedSale.profit?.toFixed(2) || '0.00'} MAD
                          </p>
                        </div>
                        {selectedSale.isTrade && selectedSale.trade_details && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">
                                {t('sales_transactions.details.user_paid')}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedSale.trade_details.user_paid?.toFixed(2) || '0.00'} MAD
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                {t('sales_transactions.details.trade_value')}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedSale.trade_details.buyback_price?.toFixed(2) || '0.00'} MAD
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.date')}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedSale.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            {t('sales_transactions.details.transaction_id')}
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {selectedSale.id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closeModal}
                  >
                    {t('sales_transactions.details.close')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Slide-in Panel */}
          <div className={`lg:hidden fixed inset-0 overflow-hidden ${showModal ? '' : 'hidden'}`}>
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                onClick={closeModal}
              ></div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md">
                  <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                    <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <h2 className="text-lg font-medium text-gray-900">
                          {selectedSale.isTrade 
                            ? t('sales_transactions.details.title.trade') 
                            : t('sales_transactions.details.title.sale')}
                        </h2>
                        <button
                          type="button"
                          className="-mr-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={closeModal}
                        >
                          <span className="sr-only">Close panel</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('sales_transactions.details.product')}
                              </label>
                              <div className="flex items-center">
                                <img
                                  className="h-20 w-20 rounded-md object-cover mr-4"
                                  src={selectedSale.product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                                  alt={selectedSale.product.title}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {selectedSale.product.title || 'Unknown Product'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {t('sales_transactions.details.original_price')}: {selectedSale.product.price?.toFixed(2) || '0.00'} MAD
                                  </p>
                                </div>
                              </div>
                            </div>

                            {selectedSale.isTrade && selectedSale.trade_details && (
                              <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {t('sales_transactions.details.traded_product')}
                                </label>
                                <div className="flex items-center">
                                  {selectedSale.trade_details.old_product ? (
                                    <>
                                      <img
                                        className="h-20 w-20 rounded-md object-cover mr-4"
                                        src={selectedSale.trade_details.old_product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                                        alt={selectedSale.trade_details.old_product.title}
                                        onError={(e) => {
                                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                        }}
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {selectedSale.trade_details.old_product.title || 'Unknown Product'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {t('sales_transactions.details.buyback_price')}: {selectedSale.trade_details.buyback_price?.toFixed(2) || '0.00'} MAD
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500">No product details available</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('sales_transactions.details.buyer_info')}
                              </label>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.name')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {selectedSale.buyer_name || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.phone')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {selectedSale.buyer_phone || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {!selectedSale.isTrade && (
                              <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-sm text-gray-500">Paid Price:</span>
                                  <span className="text-sm font-medium text-gray-900">{selectedSale.paid_price?.toFixed(2) || '0.00'} MAD</span>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-sm text-gray-500">Rest Price:</span>
                                  <span className="text-sm font-medium text-gray-900">{selectedSale.rest_price?.toFixed(2) || '0.00'} MAD</span>
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                  <label htmlFor="payment-toggle-mobile" className="flex items-center cursor-pointer">
                                    <div className="relative">
                                      <input
                                        id="payment-toggle-mobile"
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedSale.is_fully_paid}
                                        disabled={updatingPaymentId === selectedSale.id}
                                        onChange={async () => {
                                          setUpdatingPaymentId(selectedSale.id);
                                          try {
                                            await updateSellPaymentStatus(
                                              selectedSale.id,
                                              !selectedSale.is_fully_paid,
                                              selectedSale.paid_price,
                                              selectedSale.sell_price
                                            );
                                            const updatedSales = await fetchSalesWithProduct();
                                            setSales(updatedSales);
                                            const updated = updatedSales.find(s => s.id === selectedSale.id);
                                            if (updated) setSelectedSale({ ...selectedSale, ...updated });
                                          } catch (err) {
                                            alert('Failed to update payment status: ' + (err.message || err));
                                          } finally {
                                            setUpdatingPaymentId(null);
                                          }
                                        }}
                                      />
                                      <div className={`block ${selectedSale.is_fully_paid ? 'bg-green-500' : 'bg-gray-300'} w-14 h-8 rounded-full transition`}></div>
                                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${selectedSale.is_fully_paid ? 'translate-x-full border-green-500' : 'border-gray-300'}`}></div>
                                    </div>
                                    <span className={`ml-3 text-sm font-medium ${selectedSale.is_fully_paid ? 'text-green-800' : 'text-yellow-800'}`}>
                                      {selectedSale.is_fully_paid ? 'Paid' : 'Pending'}
                                    </span>
                                  </label>
                                  {updatingPaymentId === selectedSale.id && (
                                    <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="4"/><path d="M4 12a8 8 0 018-8" stroke="#3B82F6" strokeWidth="4"/></svg>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('sales_transactions.details.transaction_details')}
                              </label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.sale_price')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {selectedSale.sell_price?.toFixed(2) || '0.00'} MAD
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.profit')}
                                  </p>
                                  <p className={`text-sm font-medium ${selectedSale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedSale.profit >= 0 ? '+' : ''}{selectedSale.profit?.toFixed(2) || '0.00'} MAD
                                  </p>
                                </div>
                                {selectedSale.isTrade && selectedSale.trade_details && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        {t('sales_transactions.details.user_paid')}
                                      </p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedSale.trade_details.user_paid?.toFixed(2) || '0.00'} MAD
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        {t('sales_transactions.details.trade_value')}
                                      </p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedSale.trade_details.buyback_price?.toFixed(2) || '0.00'} MAD
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.date')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatDateTime(selectedSale.created_at)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {t('sales_transactions.details.transaction_id')}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {selectedSale.id || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                        onClick={closeModal}
                      >
                        {t('sales_transactions.details.close')}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesTransactions;