import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Filter,
  Search,
  Grid3X3,
  Table,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  DollarSign,
  FileText,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import supabase from "../lib/supabaseClient";
import Sidebar from "../components/sidebar/Sidebar";
import AddProductModal from "../components/AddProductModal";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import { useNavigate } from "react-router-dom";

const ProductManagement = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("products");
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    condition: "all",
    priceRange: "all",
    brand: "all",
    stockStatus: "in_stock",
  });
  const navigate = useNavigate();

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error.message);
      } else {
        setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  const categories = ["all", "Phone", "Pc", "Accessory", "Tablet"];
  const conditions = ["all", "new", "used"];
  const brands = ["all", "Apple","Samsung","Google","Huawei","Xiaomi","OnePlus","Sony",
  "LG","Nokia","Oppo","Vivo","Motorola","Asus","HTC","Lenovo"
  ];
  
  const stockStatuses = [
    { label: t("product_management.stock_status.in_stock"), value: "in_stock" },
    { label: t("product_management.stock_status.out_of_stock"), value: "out_of_stock" },
    { label: t("product_management.stock_status.all"), value: "all" },
  ];
  
  const priceRanges = [
    { label: t("product_management.price_ranges.all"), value: "all" },
    { label: t("product_management.price_ranges.0-500"), value: "0-500" },
    { label: t("product_management.price_ranges.500-2000"), value: "500-2000" },
    { label: t("product_management.price_ranges.2000-5000"), value: "2000-5000" },
    { label: t("product_management.price_ranges.5000+"), value: "5000+" },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.imei && product.imei.includes(searchQuery));

    const matchesCategory =
      filters.category === "all" || product.category === filters.category;
    const matchesCondition =
      filters.condition === "all" || product.condition === filters.condition;
    const matchesBrand =
      filters.brand === "all" || product.brand === filters.brand;

    const matchesStockStatus = (() => {
      if (filters.stockStatus === "all") return true;
      if (filters.stockStatus === "in_stock") return product.in_stock > 0;
      if (filters.stockStatus === "out_of_stock") return product.in_stock === 0;
      return true;
    })();

    let matchesPrice = true;
    if (filters.priceRange !== "all") {
      const [min, max] = filters.priceRange
        .split("-")
        .map((p) => p.replace("+", ""));
      if (max) {
        matchesPrice =
          product.price >= parseInt(min) && product.price <= parseInt(max);
      } else {
        matchesPrice = product.price >= parseInt(min);
      }
    }

    return (
      matchesSearch &&
      matchesCategory &&
      matchesCondition &&
      matchesBrand &&
      matchesStockStatus &&
      matchesPrice
    );
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetFilters = () => {
    setFilters({
      category: "all",
      condition: "all",
      priceRange: "all",
      brand: "all",
      stockStatus: "in_stock",
    });
  };

  const ProductCard = ({ product }) => {
    return (
      <div
        className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() =>
          navigate(`/product/${product.id}`, { state: { product } })
        }
      >
        <div className="aspect-square bg-gray-50 rounded-lg mb-3 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <img
              src={`${product.images[0]}`}
              alt={`${product.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-oceanblue text-sm leading-tight line-clamp-2">
            {product.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{product.category}</span>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                product.condition === "new"
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {t(`product_management.conditions.${product.condition}`)}
            </span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-bold text-tumbleweed">
              {product.price} MAD
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  product.in_stock > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.in_stock > 0 
                  ? t("product_management.stock_status.count", { count: product.in_stock })
                  : t("product_management.stock_status.out_of_stock")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TableView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Object.values(t("product_management.table.headers", { returnObjects: true })).map((header) => (
                <th key={header} className="text-left p-4 font-semibold text-oceanblue">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedProducts.map((product) => (
              <tr
                key={product.id}
                className="border-b border-gray-100 hover:bg-gray-50"
                onClick={() =>
                  navigate(`/product/${product.id}`, { state: { product } })
                }
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <img
                          src={`${product.images[0]}`}
                          alt={`${product.title}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-oceanblue">
                        {product.title}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-700">{product.category}</td>
                <td className="p-4 text-gray-700">{product.brand}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      product.condition === "new"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {t(`product_management.conditions.${product.condition}`)}
                  </span>
                </td>
                <td className="p-4 font-semibold text-tumbleweed">
                  {product.price} MAD
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      product.in_stock > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.in_stock > 0 
                      ? t("product_management.stock_status.count", { count: product.in_stock })
                      : t("product_management.stock_status.out_of_stock")}
                  </span>
                </td>
                <td className="p-4 text-gray-700">{product.imei || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const FilterModal = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
        showFilter ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform ${
          showFilter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-oceanblue">
              {t("product_management.filters.title")}
            </h3>
            <button
              onClick={() => setShowFilter(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                {t("product_management.filters.stock_status")}
              </label>
              <select
                value={filters.stockStatus}
                onChange={(e) =>
                  setFilters({ ...filters, stockStatus: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {stockStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                {t("product_management.filters.category")}
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? t("product_management.filters.all_categories") : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                {t("product_management.filters.condition")}
              </label>
              <select
                value={filters.condition}
                onChange={(e) =>
                  setFilters({ ...filters, condition: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond === "all" ? t("product_management.filters.all_conditions") : t(`product_management.conditions.${cond}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                {t("product_management.filters.brand")}
              </label>
              <select
                value={filters.brand}
                onChange={(e) =>
                  setFilters({ ...filters, brand: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === "all" ? t("product_management.filters.all_brands") : brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-oceanblue mb-2">
                {t("product_management.filters.price_range")}
              </label>
              <select
                value={filters.priceRange}
                onChange={(e) =>
                  setFilters({ ...filters, priceRange: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tumbleweed"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={resetFilters}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("product_management.filters.reset")}
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="flex-1 px-4 py-2 bg-tumbleweed text-white rounded-lg hover:bg-moderatelybrown"
            >
              {t("product_management.filters.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {t("product_management.pagination.show")}
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-tumbleweed"
        >
          <option value={8}>8</option>
          <option value={12}>12</option>
          <option value={16}>16</option>
        </select>
        <span className="text-sm text-gray-600">
          {t("product_management.pagination.per_page")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(
          (page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-tumbleweed text-white"
                  : "border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
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
          activeItem={"/products"}
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
      <div
        className={`flex-1 ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-200`}
      >
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-oceanblue">
                  {t("product_management.title")}
                </h1>
                <p className="text-gray-600 mt-1">
                  {t("product_management.subtitle")}
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-tumbleweed hover:bg-moderatelybrown text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={20} />
                {t("product_management.add_product")}
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              {/* Left side - Results info */}
              <div className="text-sm text-gray-600">
                {t("product_management.pagination.showing", {
                  current: displayedProducts.length,
                  total: filteredProducts.length
                })}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle - Only show table option on larger screens */}
                <div className="hidden md:flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === "table" ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                    aria-label={t("product_management.view.table")}
                  >
                    <Table size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors duration-200 ${
                      viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                    aria-label={t("product_management.view.grid")}
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
                  <span className="hidden sm:inline">
                    {t("product_management.filters.title")}
                  </span>
                </button>

                {/* Simple Search Input */}
                <div className="relative w-full sm:w-64">
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                      placeholder={t("product_management.search.placeholder")}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-tumbleweed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Display */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedProducts.map((product) => (
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
            <AddProductModal
              showAddModal={showAddModal}
              setShowAddModal={setShowAddModal}
            />

            {/* Bottom spacing for mobile navigation */}
            <div className="h-36 lg:h-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;