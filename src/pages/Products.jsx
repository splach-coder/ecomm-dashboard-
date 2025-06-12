import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  Grid3X3, 
  Table, 
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Upload,
  DollarSign,
  FileText
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';
import { BrowserMultiFormatReader } from '@zxing/browser';

const ProductManagement = () => {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('products');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showIMEIScanner, setShowIMEIScanner] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    condition: 'all',
    priceRange: 'all',
    brand: 'all'
  });

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  // Mock data with IMEI field
  const mockProducts = [
    {
      id: '1',
      title: 'Xiaomi Monitor 27 Inch',
      description: 'High-quality 4K monitor with excellent color accuracy',
      price: 2500,
      category: 'Monitor',
      brand: 'Xiaomi',
      condition: 'new',
      in_stock: 15,
      imei: null,
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-15',
      updated_at: '2024-01-15'
    },
    {
      id: '2',
      title: 'Xiaomi 14T',
      description: 'Latest smartphone with advanced camera system',
      price: 4500,
      category: 'Phone',
      brand: 'Xiaomi',
      condition: 'new',
      in_stock: 8,
      imei: '123456789012345',
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-16',
      updated_at: '2024-01-16'
    },
    {
      id: '3',
      title: 'Xiaomi 14T Pro', 
      description: 'Premium smartphone with pro features',
      price: 5200,
      category: 'Phone',
      brand: 'Xiaomi',
      condition: 'new',
      in_stock: 5,
      imei: '234567890123456',
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-17',
      updated_at: '2024-01-17'
    },
    {
      id: '4',
      title: 'Philips Monitor 24Inch',
      description: 'Professional monitor for office use',
      price: 1400,
      category: 'Monitor',
      brand: 'Philips',
      condition: 'used',
      in_stock: 3,
      imei: null,
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-18',
      updated_at: '2024-01-18'
    },
    {
      id: '5',
      title: 'Samsung Galaxy A35',
      description: 'Mid-range smartphone with great battery life',
      price: 2740,
      category: 'Phone',
      brand: 'Samsung',
      condition: 'new',
      in_stock: 12,
      imei: '345678901234567',
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-19',
      updated_at: '2024-01-19'
    },
    {
      id: '6',
      title: 'iPhone Case Premium',
      description: 'Premium protective case for iPhone',
      price: 150,
      category: 'Accessory',
      brand: 'Apple',
      condition: 'new',
      in_stock: 50,
      imei: null,
      images: ['/api/placeholder/280/200'],
      created_at: '2024-01-20',
      updated_at: '2024-01-20'
    }
  ];

  const categories = ['all', 'Phone', 'Monitor', 'Accessory'];
  const conditions = ['all', 'new', 'used'];
  const brands = ['all', 'Xiaomi', 'Samsung', 'Apple', 'Philips'];
  const priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Under 500 MAD', value: '0-500' },
    { label: '500-2000 MAD', value: '500-2000' },
    { label: '2000-5000 MAD', value: '2000-5000' },
    { label: 'Above 5000 MAD', value: '5000+' }
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.imei && product.imei.includes(searchQuery));
    
    const matchesCategory = filters.category === 'all' || product.category === filters.category;
    const matchesCondition = filters.condition === 'all' || product.condition === filters.condition;
    const matchesBrand = filters.brand === 'all' || product.brand === filters.brand;
    
    let matchesPrice = true;
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
      if (max) {
        matchesPrice = product.price >= parseInt(min) && product.price <= parseInt(max);
      } else {
        matchesPrice = product.price >= parseInt(min);
      }
    }
    
    return matchesSearch && matchesCategory && matchesCondition && matchesBrand && matchesPrice;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const resetFilters = () => {
    setFilters({
      category: 'all',
      condition: 'all',
      priceRange: 'all',
      brand: 'all'
    });
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-oceanblue text-sm leading-tight line-clamp-2">{product.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{product.category}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            product.condition === 'new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {product.condition}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-tumbleweed">{product.price} MAD</span>
          <span className="text-xs text-gray-500">Stock: {product.in_stock}</span>
        </div>
        {product.imei && (
          <div className="text-xs text-gray-400">
            IMEI: {product.imei}
          </div>
        )}
        <div className="text-xs text-gray-400">
          Brand: {product.brand}
        </div>
      </div>
    </div>
  );

  const TableView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-semibold text-oceanblue">Product</th>
              <th className="text-left p-4 font-semibold text-oceanblue">Category</th>
              <th className="text-left p-4 font-semibold text-oceanblue">Brand</th>
              <th className="text-left p-4 font-semibold text-oceanblue">Condition</th>
              <th className="text-left p-4 font-semibold text-oceanblue">Price</th>
              <th className="text-left p-4 font-semibold text-oceanblue">Stock</th>
              <th className="text-left p-4 font-semibold text-oceanblue">IMEI</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.map(product => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <div>
                      <p className="font-medium text-oceanblue">{product.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-700">{product.category}</td>
                <td className="p-4 text-gray-700">{product.brand}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.condition === 'new' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {product.condition}
                  </span>
                </td>
                <td className="p-4 font-semibold text-tumbleweed">{product.price} MAD</td>
                <td className="p-4 text-gray-700">{product.in_stock}</td>
                <td className="p-4 text-gray-700">{product.imei || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const FilterModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform ${showFilter ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-oceanblue">Filters</h3>
            <button onClick={() => setShowFilter(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">Category</label>
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">Condition</label>
              <select 
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond === 'all' ? 'All Conditions' : cond}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">Brand</label>
              <select 
                value={filters.brand}
                onChange={(e) => setFilters({...filters, brand: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand === 'all' ? 'All Brands' : brand}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">Price Range</label>
              <select 
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button 
              onClick={resetFilters}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              onClick={() => setShowFilter(false)}
              className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded-lg hover:bg-moderatelybrown"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddProductModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showAddModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-2xl md:rounded-2xl md:w-[700px] md:max-h-[90vh] transition-transform ${showAddModal ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-oceanblue">Add New Product</h2>
          <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">Title</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="Enter product title" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">IMEI (for phones)</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="Enter IMEI number" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                <FileText size={16} className="inline mr-1" />
                Description
              </label>
              <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="Enter product description"></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">
                  <DollarSign size={16} className="inline mr-1" />
                  Price (MAD)
                </label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="0" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">Stock</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="0" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed">
                  <option>Phone</option>
                  <option>Monitor</option>
                  <option>Accessory</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-oceanblue mb-2">Brand</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed" placeholder="Enter brand" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">Condition</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="condition" value="new" className="mr-2" defaultChecked />
                  New
                </label>
                <label className="flex items-center">
                  <input type="radio" name="condition" value="used" className="mr-2" />
                  Used
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                <Upload size={16} className="inline mr-1" />
                Product Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button 
            onClick={() => setShowAddModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded-lg hover:bg-moderatelybrown">
            Add Product
          </button>
        </div>
      </div>
    </div>
  );

  const IMEIScannerModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showIMEIScanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-2xl md:rounded-2xl md:w-[400px] transition-transform ${showIMEIScanner ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:scale-95'}`}>
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-oceanblue">Scan IMEI</h2>
          <button onClick={() => setShowIMEIScanner(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 text-center">
          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Camera size={48} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">Position the IMEI barcode within the frame</p>
          <div className="space-y-3">
            <button className="w-full px-4 py-2 bg-tumbleweed text-white rounded-lg hover:bg-moderatelybrown">
              Start Camera
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Enter IMEI Manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show</span>
        <select 
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-tumbleweed"
        >
          <option value={8}>8</option>
          <option value={12}>12</option>
          <option value={16}>16</option>
        </select>
        <span className="text-sm text-gray-600">per page</span>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({length: Math.min(totalPages, 6)}, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-tumbleweed text-white'
                : 'border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for larger screens - fixed position */}
      <div className="hidden lg:block fixed h-full">
        <Sidebar 
          isOpen={isOpen} 
          onToggle={handleToggle} 
          activeItem={activeItem} 
          onItemClick={handleItemClick} 
          onLogout={handleLogout} 
        />
      </div>

      {/* BottomNavigation for mobile screens */}
      <div className="block lg:hidden">
        <BottomNavigation 
          activeItem={activeItem} 
          onItemClick={handleItemClick} 
          onLogout={handleLogout} 
        />
      </div>
      
      {/* Main content area with scroll */}
      <div className={`flex-1 ${isOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-200`}>
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-oceanblue">Product Management</h1>
                <p className="text-gray-600 mt-1">Manage your store inventory</p>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-tumbleweed hover:bg-moderatelybrown text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              
              {/* Left side - Results info */}
              <div className="text-sm text-gray-600">
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle - Only show table option on larger screens */}
                <div className="hidden md:flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === 'table' ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Table size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                </div>

                {/* Filter Button */}
                <button 
                  onClick={() => setShowFilter(true)}
                  className="bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                >
                  <Filter size={18} />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                {/* Replace the search input with ProductSearchWithScanner */}
                <ProductSearchWithScanner 
                  onSearch={(query) => setSearchQuery(query)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
            </div>

            {/* Products Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="hidden md:block">
                <TableView />
              </div>
            )}

            {/* Pagination */}
            <Pagination />

            {/* Modals */}
            <FilterModal />
            <AddProductModal />
            {/* IMEIScannerModal is removed as it's replaced by the ProductSearchWithScanner */}

            {/* Bottom spacing for mobile navigation */}
            <div className="h-20 lg:h-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;

// IMEScanner component for real barcode scanning
const IMEScanner = ({ onScan, onClose }) => { 
  const videoRef = useRef(null); 
  const [error, setError] = useState(null); 
  const codeReader = useRef(new BrowserMultiFormatReader()); 

  const startCamera = async () => { 
    try { 
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      }); 
      videoRef.current.srcObject = stream; 
      
      // Start barcode scanning 
      codeReader.current.decodeFromVideoElement(videoRef.current, (result, error) => { 
        if (result) { 
          handleBarcodeDetected(result.getText()); 
        } 
        if (error && !(error instanceof BrowserMultiFormatReader.NotFoundException)) { 
          console.error('Scan error:', error); 
        } 
      }); 
    } catch (err) { 
      setError(err.message || 'Could not access camera'); 
      console.error('Camera error:', err); 
    } 
  }; 

  const stopCamera = () => {
    if (codeReader.current) {
      // Check if codeReader has a stop method before calling it
      if (typeof codeReader.current.stop === 'function') {
        codeReader.current.stop();
      }
      codeReader.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  }; 

  const handleBarcodeDetected = (code) => { 
    // Validate IMEI format (15-17 digits) 
    if (/^\d{15,17}$/.test(code)) { 
      onScan(code); 
      stopCamera(); 
      onClose(); 
    } else { 
      setError('Invalid IMEI format. Please scan a valid IMEI barcode.'); 
    } 
  }; 

  useEffect(() => { 
    startCamera(); 
    return () => stopCamera(); 
  }, []); 

  return ( 
    <div className="fixed inset-0 bg-black z-50 flex flex-col"> 
      <button 
        onClick={() => { 
          stopCamera(); 
          onClose(); 
        }} 
        className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full" 
      > 
        <X size={24} /> 
      </button> 
      
      <div className="flex-1 relative"> 
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover" 
        /> 
        
        {/* Scanner overlay */} 
        <div className="absolute inset-0 flex items-center justify-center"> 
          <div className="border-2 border-white rounded-lg w-64 h-32 relative"> 
            <div className="absolute -top-8 left-0 right-0 text-center text-white"> 
              Scan IMEI barcode 
            </div> 
          </div> 
        </div> 
      </div> 

      {error && ( 
        <div className="bg-red-500 text-white p-4 text-center"> 
          {error} 
        </div> 
      )} 
    </div> 
  ); 
}; 

// ProductSearchWithScanner component for enhanced search with barcode scanning
const ProductSearchWithScanner = ({ onSearch, searchQuery, setSearchQuery }) => { 
  const [showScanner, setShowScanner] = useState(false); 
  const searchInputRef = useRef(null); 

  const handleScan = (imei) => { 
    setSearchQuery(imei); 
    onSearch(imei); 
    setTimeout(() => { 
      searchInputRef.current?.focus(); 
    }, 100); 
  }; 

  return ( 
    <div className="relative w-full sm:w-64"> 
      {showScanner && ( 
        <IMEScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        /> 
      )} 

      <div className="relative flex items-center"> 
        <Search className="absolute left-3 text-gray-400" size={18} /> 
        <input 
          ref={searchInputRef} 
          type="text" 
          value={searchQuery} 
          onChange={(e) => { 
            setSearchQuery(e.target.value); 
            onSearch(e.target.value); 
          }} 
          placeholder="Search products or scan IMEI..." 
          className="pl-10 pr-12 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-tumbleweed" 
        /> 
        <button 
          onClick={() => setShowScanner(true)} 
          className="absolute right-3 p-1 text-gray-600 hover:text-tumbleweed" 
          title="Scan IMEI" 
        > 
          <Camera size={20} /> 
        </button> 
      </div> 
    </div> 
  ); 
};