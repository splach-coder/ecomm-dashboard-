import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useNavigate, useLocation } from "react-router-dom";

function CopyProductModal({ show, onClose, product, onCopySuccess }) {
  const { t } = useTranslation();
  const [copyCount, setCopyCount] = useState(1);
  const [imeiInputs, setImeiInputs] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setCopyCount(1);
      setImeiInputs(['']);
    }
  }, [show]);

  useEffect(() => {
    const newInputs = Array(copyCount).fill('').map((_, index) => 
      imeiInputs[index] || ''
    );
    setImeiInputs(newInputs);
  }, [copyCount]);

  const handleCopyCountChange = (value) => {
    const count = Math.max(1, Math.min(10, parseInt(value) || 1));
    setCopyCount(count);
  };

  const handleImeiChange = (index, value) => {
    const newInputs = [...imeiInputs];
    newInputs[index] = value;
    setImeiInputs(newInputs);
  };

  const handleCopyProducts = async () => {
    setIsLoading(true);
    try {
      const emptyImeis = imeiInputs.some(imei => !imei.trim());
      if (emptyImeis) {
        alert(t('product_detail.errors.fill_all_imei'));
        setIsLoading(false);
        return;
      }

      const uniqueImeis = new Set(imeiInputs.map(imei => imei.trim()));
      if (uniqueImeis.size !== imeiInputs.length) {
        alert(t('product_detail.errors.imei_unique'));
        setIsLoading(false);
        return;
      }

      const productCopies = imeiInputs.map((imei) => ({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand,
        condition: product.condition,
        in_stock: 1,
        images: product.images,
        imei: imei.trim(),
        supplier_name: product.supplier_name,
        supplier_phone: product.supplier_phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('products').insert(productCopies);

      if (error) {
        console.error('Error copying products:', error);
        alert(t('product_detail.errors.copy_failed'));
        return;
      }

      alert(t('product_detail.errors.copy_success', { count: copyCount }));
      onCopySuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert(t('product_detail.errors.error_copying'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 lg:items-center">
      <div className="bg-white w-full max-w-md rounded-t-xl lg:rounded-xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-oceanblue">
            {t('product_detail.copy_product')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-1">
              {t('product_detail.copying')}
            </h4>
            <p className="text-sm text-gray-600">{product.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('product_detail.number_of_copies')}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('product_detail.imei_codes')}
            </label>
            <div className="space-y-2">
              {imeiInputs.map((imei, index) => (
                <div key={index}>
                  <input
                    type="text"
                    placeholder={t('product_detail.imei_code', { index: index + 1 })}
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

        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            {t('product_detail.cancel')}
          </button>
          <button
            onClick={handleCopyProducts}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-oceanblue hover:bg-oceanblue/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? t('product_detail.copying_loading')
              : t('product_detail.copy_products', { count: copyCount })}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminProductDetail({ product }) {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const [showSellForm, setShowSellForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const defaultProduct = {
    id: "PRD-2025-001",
    title: "Professional Studio Monitor Headphones",
    description: "High-fidelity studio monitor headphones designed for audio professionals.",
    price: 349.99,
    category: "Audio Equipment",
    brand: "StudioCraft Pro",
    condition: "new",
    in_stock: 12,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop"
    ],
    created_at: "2025-06-13T12:00:00Z",
    updated_at: "2025-06-13T14:30:00Z",
  };

  const productData = product || defaultProduct;
  const isOutOfStock = productData.in_stock <= 0;

  const handleSell = () => {
    if (isOutOfStock) {
      alert(t('product_detail.errors.cannot_sell'));
      return;
    }
    setShowSellForm(true);
  };

  const handleModify = () => setShowUpdateModal(true);
  const handleCopy = () => setShowCopyModal(true);
  const handleCopySuccess = () => window.location.reload();

  async function insertSale(data) {
    const { error } = await supabase.from("sells").insert([
      {
        type: data.type,
        product_id: data.product_id,
        buyer_name: data.buyer_name,
        buyer_phone: data.buyer_phone,
        sell_price: data.sell_price,
        paid_price: data.paid_price,
        rest_price: data.rest_price,
        created_at: new Date().toISOString(),
      },
    ]);
  
    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
  
    await updateProductStock(data.product_id, -1);
    navigate("/products");
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MAD",
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return {
        text: t('product_detail.status.out_of_stock'),
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <Archive className="w-4 h-4" />,
      };
    } else if (stock <= 5) {
      return {
        text: t('product_detail.status.only_x_left', { count: stock }),
        className: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Clock className="w-4 h-4" />,
      };
    } else {
      return {
        text: t('product_detail.status.in_stock'),
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <Package className="w-4 h-4" />,
      };
    }
  };

  const stockStatus = getStockStatus(productData.in_stock);
  const conditionText = productData.condition === "new" 
    ? t(`product_detail.status.${window.innerWidth >= 1024 ? 'brand_new' : 'new'}`)
    : t(`product_detail.status.${window.innerWidth >= 1024 ? 'pre_owned' : 'used'}`);

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

      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => navigate("/products")}
          className="text-sm text-tumbleweed hover:underline flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('product_detail.back_to_products')}
        </button>
      </div>

      <div className="lg:hidden">
        <section className="relative">
          <div className="aspect-square bg-gray-50">
            <img
              src={`${productData.images[currentImageIndex]}`}
              alt={`${productData.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {productData.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
                {currentImageIndex + 1}/{productData.images.length}
              </div>
            )}
          </div>

          {productData.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? "border-tumbleweed" : "border-gray-200"
                  }`}
                >
                  <img src={`${image}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="p-4 space-y-4">
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

          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                productData.condition === "new"
                  ? "bg-fog/20 text-fog border border-fog/30"
                  : "bg-tumbleweed/20 text-moderatelybrown border border-tumbleweed/30"
              }`}
            >
              <Eye className="w-4 h-4" />
              {conditionText}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.className}`}
            >
              {stockStatus.icon}
              {stockStatus.text}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSell}
              disabled={isOutOfStock}
              className={`flex-1 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-oceanblue hover:bg-oceanblue/90 text-white'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOutOfStock ? t('product_detail.out_of_stock') : t('product_detail.sell_product')}
            </button>
            <button
              onClick={handleModify}
              className="bg-tumbleweed hover:bg-tumbleweed/90 text-white font-medium py-3 px-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={handleCopy}
              className="bg-fog hover:bg-fog/90 text-white font-medium py-3 px-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-moderatelybrown mb-2">
              {t('product_detail.description')}
            </h3>
            <p className="text-grey text-sm leading-relaxed">
              {productData.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-moderatelybrown mb-2">
              {t('product_detail.supplier_information')}
            </h3>
            <p className="text-grey text-sm leading-relaxed">
              {t('product_detail.name')} : {productData.supplier_name}
              <br />
              {t('product_detail.phone')} : {productData.supplier_phone}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-grey font-medium">{t('product_detail.quantity')}:</span>
              <span className="bg-fog/20 text-fog border border-fog/30 w-10 h-10 flex justify-center items-center rounded-full font-mono text-lg">
                {productData.in_stock}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-grey" />
              <span className="text-grey">{t('product_detail.created')}:</span>
              <span className="text-oceanblue">
                {formatDate(productData.created_at)}
              </span>
            </div>
            {productData.updated_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-grey" />
                <span className="text-grey">{t('product_detail.last_updated')}:</span>
                <span className="text-oceanblue">
                  {formatDate(productData.updated_at)}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-5 gap-6 p-6">
          <section className="col-span-2">
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
              <img
                src={`${productData.images[currentImageIndex]}`}
                alt={`${productData.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {productData.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? "border-tumbleweed" : "border-gray-200"
                    }`}
                  >
                    <img src={`${image}`} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="col-span-3 space-y-6">
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
                    <span className="text-sm">{t('product_detail.price')}</span>
                  </div>
                  <div className="text-3xl font-bold text-oceanblue">
                    {formatPrice(productData.price)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    productData.condition === "new"
                      ? "bg-fog/20 text-fog border border-fog/30"
                      : "bg-tumbleweed/20 text-moderatelybrown border border-tumbleweed/30"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {conditionText}
                </span>

                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${stockStatus.className}`}
                >
                  {stockStatus.icon}
                  {stockStatus.text}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSell}
                disabled={isOutOfStock}
                className={`font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow-md ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-oceanblue hover:bg-oceanblue/90 text-white'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? t('product_detail.out_of_stock') : t('product_detail.sell_product')}
              </button>
              <button
                onClick={handleModify}
                className="bg-tumbleweed hover:bg-tumbleweed/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopy}
                className="bg-fog hover:bg-fog/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm hover:shadow-md"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-moderatelybrown mb-3">
                {t('product_detail.product_info')}
              </h3>
              <p className="text-grey leading-relaxed">
                {productData.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    {t('product_detail.product_id')}
                  </span>
                  <span className="text-oceanblue font-mono">
                    {productData.id}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    {t('product_detail.stock_quantity')}
                  </span>
                  <span className="text-oceanblue font-semibold">
                    {productData.in_stock} {t('product_detail.units')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-grey mb-1">
                    {t('product_detail.created')}
                  </span>
                  <div className="flex items-center gap-2 text-oceanblue">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(productData.created_at)}</span>
                  </div>
                </div>
                {productData.updated_at && (
                  <div>
                    <span className="block text-sm font-medium text-grey mb-1">
                      {t('product_detail.last_updated')}
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
        productId={product?.id}
        insertSale={insertSale}
      />
    </article>
  );
}

function ProductDetailDashboard() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("products");
  const location = useLocation();
  const navigate = useNavigate();
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
        {t('loading_user_data')}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex pb-24">
      <div className="hidden lg:block fixed h-full">
        <Sidebar
          isOpen={isOpen}
          onToggle={handleToggle}
          activeItem={"/products"}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className="block lg:hidden">
        <BottomNavigation
          activeItem={activeItem}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className={`flex-1 ${isOpen ? "lg:ml-64" : "lg:ml-20"} transition-all duration-200`}>
        <div className="container">
          <AdminProductDetail product={product} />
        </div>
      </div>
    </div>
  );
}

export default ProductDetailDashboard;