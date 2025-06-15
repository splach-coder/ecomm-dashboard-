import React, { useState, useMemo, useEffect } from 'react';
import { fetchSalesWithProduct, fetchTradesWithProducts } from "../features/updateProductStock";
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';

const SalesTransactions = () => {
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

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true);
      try {
        const [salesData, tradesData] = await Promise.all([
          fetchSalesWithProduct(),
          fetchTradesWithProducts()
        ]);
        
        setSales(salesData);
        
        // Transform trades to match sales format for display
        const formattedTrades = tradesData.map(trade => ({
          id: trade.id,
          type: 'trade',
          product_id: trade.new_product_id,
          product: trade.new_product, // The product given to the client
          sell_price: trade.new_product_price, // The price of the new product
          original_price: trade.new_product.price, // Original price of the new product
          profit: trade.profit, // Already calculated in the trade
          buyer_name: trade.buyer_name || 'Trade Customer',
          buyer_phone: trade.buyer_phone || 'N/A',
          created_at: trade.created_at,
          trade_details: trade // Keep all trade details for the modal
        }));
        
        setTrades(formattedTrades);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Combine sales and trades for display
  const allTransactions = useMemo(() => {
    return [...sales, ...trades].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [sales, trades]);

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return allTransactions;
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && end) {
        return transactionDate >= start && transactionDate <= end;
      } else if (start) {
        return transactionDate >= start;
      } else if (end) {
        return transactionDate <= end;
      }
      return true;
    });
  }, [allTransactions, startDate, endDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, transaction) => {
      const profit = transaction.type === 'trade' 
        ? transaction.profit 
        : transaction.sell_price - transaction.product.price;
      
      return {
        totalSales: acc.totalSales + transaction.sell_price,
        totalProfit: acc.totalProfit + profit,
        count: acc.count + 1
      };
    }, { totalSales: 0, totalProfit: 0, count: 0 });
  }, [filteredTransactions]);

  const handleViewSale = (transaction) => {
    const profit = transaction.type === 'trade' 
      ? transaction.profit 
      : transaction.sell_price - transaction.product.price;
    
    setSelectedSale({
      ...transaction,
      profit: profit,
      isTrade: transaction.type === 'trade'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSale(null);
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
            <p className="text-gray-500">Loading transactions...</p>
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
                <p className="text-sm text-red-700">{error}</p>
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
            <h1 className="text-2xl font-bold text-oceanblue mb-4">Sales & Trade Transactions</h1>
            
            {/* Date Range Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
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
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Profit</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Profit</dt>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
              <p className="mt-1 text-sm text-gray-500">
                {allTransactions.length === 0
                  ? "You haven't made any transactions yet."
                  : "No transactions match your selected date range."}
              </p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Desktop Table */}
              <table className="min-w-full divide-y divide-gray-200 hidden lg:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const profit = transaction.type === 'trade' 
                      ? transaction.profit 
                      : transaction.sell_price - transaction.product.price;
                    const isProfit = profit >= 0;

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-md object-cover"
                                src={`${transaction.product.images[0]}`}
                                alt={transaction.product.title}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{transaction.product.title}</div>
                              <div className="text-sm text-gray-500">SKU: {transaction.product.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.buyer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.sell_price.toFixed(2)} MAD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isProfit ? '+' : ''}{profit.toFixed(2)} MAD
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.type === 'trade' ? 'Trade' : 'Sale'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewSale(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
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
                  const profit = transaction.type === 'trade' 
                    ? transaction.profit 
                    : transaction.sell_price - transaction.product.price;
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
                            src={`${transaction.product.images[0]}`}
                            alt={transaction.product.title}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">{transaction.product.title}</div>
                              <div className="text-xs text-gray-500">{formatDate(transaction.created_at)}</div>
                              <div className="text-xs text-gray-500">{transaction.type === 'trade' ? 'Trade' : 'Sale'}</div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isProfit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {isProfit ? '+' : ''}{profit.toFixed(2)} MAD
                            </span>
                          </div>
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

      {/* Modal for desktop view */}
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
                    {selectedSale.isTrade ? 'Trade Details' : 'Sale Details'}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product</label>
                      <div className="mt-1 flex items-center">
                        <img
                          className="h-16 w-16 rounded-md object-cover mr-4"
                          src={`${selectedSale.product.images[0]}`}
                          alt={selectedSale.product.title}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.product.title}</p>
                          <p className="text-sm text-gray-500">Original Price: {selectedSale.product.price.toFixed(2)} MAD</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedSale.isTrade && selectedSale.trade_details && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Traded Product</label>
                        <div className="mt-1 flex items-center">
                          {selectedSale.trade_details.old_product ? (
                            <>
                              <img
                                className="h-16 w-16 rounded-md object-cover mr-4"
                                src={`${selectedSale.trade_details.old_product.images[0]}`}
                                alt={selectedSale.trade_details.old_product.title}
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                }}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{selectedSale.trade_details.old_product.title}</p>
                                <p className="text-sm text-gray-500">Buyback Price: {selectedSale.trade_details.buyback_price.toFixed(2)} MAD</p>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No product details available</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Buyer Information</label>
                      <div className="mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_phone}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Details</label>
                      <div className="mt-1 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Sale Price</p>
                          <p className="text-sm font-medium text-gray-900">{selectedSale.sell_price.toFixed(2)} MAD</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Profit</p>
                          <p className={`text-sm font-medium ${selectedSale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedSale.profit >= 0 ? '+' : ''}{selectedSale.profit.toFixed(2)} MAD
                          </p>
                        </div>
                        {selectedSale.isTrade && selectedSale.trade_details && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">User Paid</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedSale.trade_details.user_paid.toFixed(2)} MAD
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Trade Value</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedSale.trade_details.buyback_price.toFixed(2)} MAD
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedSale.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Transaction ID</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedSale.id}</p>
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
                    Close
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
                          {selectedSale.isTrade ? 'Trade Details' : 'Sale Details'}
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                              <div className="flex items-center">
                                <img
                                  className="h-20 w-20 rounded-md object-cover mr-4"
                                  src={`${selectedSale.product.images[0]}`}
                                  alt={selectedSale.product.title}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{selectedSale.product.title}</p>
                                  <p className="text-sm text-gray-500">Original Price: {selectedSale.product.price.toFixed(2)} MAD</p>
                                </div>
                              </div>
                            </div>

                            {selectedSale.isTrade && selectedSale.trade_details && (
                              <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Traded Product</label>
                                <div className="flex items-center">
                                  {selectedSale.trade_details.old_product ? (
                                    <>
                                      <img
                                        className="h-20 w-20 rounded-md object-cover mr-4"
                                        src={`${selectedSale.trade_details.old_product.images[0]}`}
                                        alt={selectedSale.trade_details.old_product.title}
                                        onError={(e) => {
                                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                        }}
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{selectedSale.trade_details.old_product.title}</p>
                                        <p className="text-sm text-gray-500">Buyback Price: {selectedSale.trade_details.buyback_price.toFixed(2)} MAD</p>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="text-sm text-gray-500">No product details available</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Information</label>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-gray-500">Name</p>
                                  <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm font-medium text-gray-900">{selectedSale.buyer_phone}</p>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Details</label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Sale Price</p>
                                  <p className="text-sm font-medium text-gray-900">{selectedSale.sell_price.toFixed(2)} MAD</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Profit</p>
                                  <p className={`text-sm font-medium ${selectedSale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedSale.profit >= 0 ? '+' : ''}{selectedSale.profit.toFixed(2)} MAD
                                  </p>
                                </div>
                                {selectedSale.isTrade && selectedSale.trade_details && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-500">User Paid</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedSale.trade_details.user_paid.toFixed(2)} MAD
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Trade Value</p>
                                      <p className="text-sm font-medium text-gray-900">
                                        {selectedSale.trade_details.buyback_price.toFixed(2)} MAD
                                      </p>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedSale.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Transaction ID</p>
                                  <p className="text-sm font-medium text-gray-900 truncate">{selectedSale.id}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                      <button
                        onClick={closeModal}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Close
                      </button>
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