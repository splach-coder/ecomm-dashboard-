import React, { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import UpdateProductModal from "../components/UpdateProductModal";
import SellTradeFormPanel from "../components/selltradeform/SellTradeFormPanel";
import supabase from "../lib/supabaseClient";
import { updateProductStock } from "../features/updateProductStock";
import {
  ChevronLeft,
  Package,
  Calendar,
  Clock,
  Eye,
  Tag,
  DollarSign,
  Archive,
  ShoppingCart,
  Edit3,
  Copy,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

// Copy Product Modal Component
function CopyProductModal({ show, onClose, product, onCopySuccess }) {
  const [copyCount, setCopyCount] = useState(1);
  const [imeiInputs, setImeiInputs] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

  // Reset inputs when modal opens/closes
  useEffect(() => {
    if (show) {
      setCopyCount(1);
      setImeiInputs(['']);
    }
  }, [show]);

  // Update IMEI inputs when count changes
  useEffect(() => {
    const newInputs = Array(copyCount).fill('').map((_, index) => 
      imeiInputs[index] || ''
    );
    setImeiInputs(newInputs);
  }, [copyCount]);

  const handleCopyCountChange = (value) => {
    const count = Math.max(1, Math.min(10, parseInt(value) || 1)); // Limit between 1-10
    setCopyCount(count);
  };

  const handleImeiChange = (index, value) => {
    const newInputs = [...imeiInputs];
    newInputs[index] = value;
    setImeiInputs(newInputs);
  };

  const generateProductId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PRD-${timestamp}-${random}`;
  };

  const handleCopyProducts = async () => {
    setIsLoading(true);
    try {
      // Validate IMEI inputs
      const emptyImeis = imeiInputs.some(imei => !imei.trim());
      if (emptyImeis) {
        alert('Please fill all IMEI codes');
        setIsLoading(false);
        return;
      }

      // Check for duplicate IMEIs
      const uniqueImeis = new Set(imeiInputs.map(imei => imei.trim()));
      if (uniqueImeis.size !== imeiInputs.length) {
        alert('IMEI codes must be unique');
        setIsLoading(false);
        return;
      }

      // Create product copies
      const productCopies = imeiInputs.map((imei, index) => ({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand,
        condition: product.condition,
        in_stock: 1,
        images: product.images,
        imei: imei.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert into Supabase
      const { error } = await supabase
        .from('products')
        .insert(productCopies);

      if (error) {
        console.error('Error copying products:', error);
        alert('Failed to copy products. Please try again.');
        return;
      }

      alert(`Successfully created ${copyCount} product copies!`);
      onCopySuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while copying products.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
      <div className="bg-white w-full max-w-md rounded-t-xl lg:rounded-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-oceanblue">Copy Product</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Product Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Copying:</h4>
            <p className="text-sm text-gray-600">{product.title}</p>
          </div>

          {/* Copy Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Copies
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={copyCount}
              onChange={(e) => handleCopyCountChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oceanblue focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {/* IMEI Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IMEI Codes
            </label>
            <div className="space-y-2">
              {imeiInputs.map((imei, index) => (
                <div key={index}>
                  <input
                    type="text"
                    placeholder={`IMEI Code ${index + 1}`}
                    value={imei}
                    onChange={(e) => handleImeiChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oceanblue focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCopyProducts}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-oceanblue hover:bg-oceanblue/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Copying...' : `Copy ${copyCount} Products`}
          </button>
        </div>
      </div>
    </div>
  );
}

// AdminProductDetail Component (integrated within the dashboard)
function AdminProductDetail({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const [showSellForm, setShowSellForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Default product data for demo purposes
  const defaultProduct = {
    id: "PRD-2025-001",
    title: "Professional Studio Monitor Headphones",
    description:
      "High-fidelity studio monitor headphones designed for audio professionals. Features precision-tuned 50mm drivers, comfortable over-ear design, and detachable cable system. Ideal for mixing, mastering, and critical listening applications.",
    price: 349.99,
    category: "Audio Equipment",
    brand: "StudioCraft Pro",
    condition: "new",
    in_stock: 12,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
    ],
    created_at: "2025-06-13T12:00:00Z",
    updated_at: "2025-06-13T14:30:00Z",
  };

  const productData = product || defaultProduct;

  // Check if product is out of stock
  const isOutOfStock = productData.in_stock <= 0;

  // Action button handlers
  const handleSell = () => {
    // Check if product is out of stock
    if (isOutOfStock) {
      alert('Cannot sell product - Out of stock!');
      return;
    }
    setShowSellForm(true);
  };

  const handleModify = () => {
    setShowUpdateModal(true);
  };

  const handleCopy = () => {
    setShowCopyModal(true);
  };

  const handleCopySuccess = () => {
    // Refresh the page or update the product list
    window.location.reload(); // Simple refresh - you might want to implement a more sophisticated update
  };

  async function insertSale(data) {
    console.log("📦 Inserting sale:", data);

    const { error } = await supabase.from("sells").insert([
      {
        type: data.type,
        product_id: data.productId,
        buyer_name: data.buyerName,
        buyer_phone: data.buyerPhone,
        sell_price: data.price,
        created_at: data.timestamp,
      },
    ]);

    if (error) {
      console.error("❌ Insert error:", error);
      throw error;
    }

    updateProductStock(data.productId, -1);

    alert("📦 Congrats for the sale");

    navigate("/products");
  }

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
    }).format(price);
  };

  // Format date for admin display
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  // Get stock status configuration
  const getStockStatus = (stock) => {
    if (stock === 0) {
      return {
        text: "Out of Stock",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <Archive className="w-4 h-4" />,
      };
    } else if (stock <= 5) {
      return {
        text: `Only ${stock} left`,
        className: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Clock className="w-4 h-4" />,
      };
    } else {
      return {
        text: "In Stock",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <Package className="w-4 h-4" />,
      };
    }
  };

  const stockStatus = getStockStatus(productData.in_stock);

  return (
    <article className="bg-white overflow-hidden">
      {showUpdateModal && (
        <UpdateProductModal
          show={showUpdateModal}
          setShow={setShowUpdateModal}
          product={product}
        />
      )}

      <CopyProductModal
        show={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        product={productData}
        onCopySuccess={handleCopySuccess}
      />

      {/* Add back button at the top */}
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => navigate("/products")}
          className="text-sm text-tumbleweed hover:underline flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Products
        </button>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden">
        {/* Image Gallery - Mobile */}
        <section className="relative">
          <div className="aspect-square bg-gray-50">
            <img
              src={`${productData.images[currentImageIndex]}`}
              alt={`${productData.title} - View ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {productData.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
                {currentImageIndex + 1}/{productData.images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip - Mobile */}
          {productData.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? "border-tumbleweed"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={`${image}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product Info - Mobile */}
        <section className="p-4 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-oceanblue leading-tight mb-1">
                {productData.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-grey">
                <Tag className="w-4 h-4" />
                <span>{productData.brand}</span>
                <span>•</span>
                <span>{productData.category}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-oceanblue">
                {formatPrice(productData.price)}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                productData.condition === "new"
                  ? "bg-fog/20 text-fog border border-fog/30"
                  : "bg-tumbleweed/20 text-moderatelybrown border border-tumbleweed/30"
              }`}
            >
              <Eye className="w-4 h-4" />
              {productData.condition === "new" ? "New" : "Used"}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.className}`}
            >
              {stockStatus.icon}
              {stockStatus.text}
            </span>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSell}
              disabled={isOutOfStock}
              className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-oceanblue hover:bg-oceanblue/90 text-white'
              }`}
              title={isOutOfStock ? 'Product is out of stock' : 'Sell Product'}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOutOfStock ? 'Out of Stock' : 'Sell Product'}
            </button>
            <button
              onClick={handleModify}
              className="bg-tumbleweed hover:bg-tumbleweed/90 text-white font-medium py-3 px-3 rounded-lg transition-colors flex items-center justify-center"
              title="Modify Product"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="bg-fog hover:bg-fog/90 text-white font-medium py-3 px-3 rounded-lg transition-colors flex items-center justify-center"
              title="Copy Product"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-moderatelybrown mb-2">
              Description
            </h3>
            <p className="text-grey text-sm leading-relaxed">
              {productData.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-grey font-medium">Quantity:</span>
              <span className="bg-fog/20 text-fog border border-fog/30 w-10 h-10 flex justify-center items-center rounded-full font-mono text-lg">
                {productData.in_stock}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-grey" />
              <span className="text-grey">Created:</span>
              <span className="text-oceanblue">
                {formatDate(productData.created_at)}
              </span>
            </div>
            {productData.updated_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-grey" />
                <span className="text-grey">Updated:</span>
                <span className="text-oceanblue">
                  {formatDate(productData.updated_at)}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-5 gap-6 p-6">
          {/* Image Gallery - Desktop */}
          <section className="col-span-2">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
              <img
                src={`${productData.images[currentImageIndex]}`}
                alt={`${productData.title} - View ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Thumbnail Grid - Desktop */}
            {productData.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-tumbleweed"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={`${image}`}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Product Information - Desktop */}
          <section className="col-span-3 space-y-6">
            {/* Header Section */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-3xl font-bold text-oceanblue mb-2">
                    {productData.title}
                  </h2>
                  <div className="flex items-center gap-3 text-grey">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span className="font-medium">{productData.brand}</span>
                    </div>
                    <span>•</span>
                    <span>{productData.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-grey mb-1">
                    MAD
                    <span className="text-sm">Price</span>
                  </div>
                  <div className="text-3xl font-bold text-oceanblue">
                    {formatPrice(productData.price)}
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    productData.condition === "new"
                      ? "bg-fog/20 text-fog border border-fog/30"
                      : "bg-tumbleweed/20 text-moderatelybrown border border-tumbleweed/30"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {productData.condition === "new" ? "Brand New" : "Pre-owned"}
                </span>

                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${stockStatus.className}`}
                >
                  {stockStatus.icon}
                  {stockStatus.text}
                </span>
              </div>
            </div>

            {/* Action Buttons - Desktop */}
            <div className="flex gap-4">
              <button
                onClick={handleSell}
                disabled={isOutOfStock}
                className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow-md ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-oceanblue hover:bg-oceanblue/90 text-white'
                }`}
                title={isOutOfStock ? 'Product is out of stock' : 'Sell Product'}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? 'Out of Stock' : 'Sell Product'}
              </button>
              <button
                onClick={handleModify}
                className="bg-tumbleweed hover:bg-tumbleweed/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
                title="Modify Product"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopy}
                className="bg-fog hover:bg-fog/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
                title="Copy Product"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            {/* Description Section */}
            <div>
              <h3 className="text-lg font-semibold text-moderatelybrown mb-3">
                Product Description
              </h3>
              <p className="text-grey leading-relaxed">
                {productData.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    Product ID
                  </span>
                  <span className="text-oceanblue font-mono">
                    {productData.id}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    Stock Quantity
                  </span>
                  <span className="text-oceanblue font-semibold">
                    {productData.in_stock} units
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    Created
                  </span>
                  <div className="flex items-center gap-2 text-oceanblue">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(productData.created_at)}</span>
                  </div>
                </div>
                {productData.updated_at && (
                  <div>
                    <span className="block text-sm font-medium text-grey mb-1">
                      Last Updated
                    </span>
                    <div className="flex items-center gap-2 text-oceanblue">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(productData.updated_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <SellTradeFormPanel
        isOpen={showSellForm}
        onClose={() => setShowSellForm(false)}
        onSuccess={(data) => {
          console.log("Sale completed:", data);
        }}
        productId={product.id}
        insertSale={insertSale} // Your Supabase function
      />
    </article>
  );
}

// Main Dashboard Component
function ProductDetailDashboard() {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("products"); // Changed to 'products' since this is product detail
  const location = useLocation();
  const navigate = useNavigate();

  // Get product from location state or use default
  const product = location.state?.product;

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  useEffect(() => {
    if (user) {
      setUserData({
        email: user.email,
        id: user.id,
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
      });
    }
  }, [user]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex pb-24">
      {/* Sidebar for larger screens */}
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

      <div
        className={`flex-1 ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-200`}
      >
        <div className="container">
          {/* Product Detail Component */}
          <AdminProductDetail product={product} />
        </div>
      </div>
    </div>
  );
}

export default ProductDetailDashboard;