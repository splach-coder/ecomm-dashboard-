import React, { useState } from "react";
import supabase from "../lib/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TradeFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [oldImei, setOldImei] = useState("");
  const [oldSale, setOldSale] = useState(null);
  const [newImei, setNewImei] = useState("");
  const [newProduct, setNewProduct] = useState(null);
  const [buybackPrice, setBuybackPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("home");

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);

  const getTimeAgo = (date) => {
    const now = Date.now();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
  };

  const checkOldSale = async () => {
    if (!oldImei) return;
    const { data, error } = await supabase
      .from("sells")
      .select("*, product:product_id(*)")
      .eq("product.imei", oldImei)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data?.length || !data[0].product) {
      setOldSale(null);
      return toast.error(t("trade_flow.toasts.no_sale_found"));
    }
    setOldSale(data[0]);
    toast.success(t("trade_flow.toasts.old_phone_found"));
  };

  const loadNewProduct = async () => {
    if (!newImei || newImei === oldImei) {
      setNewProduct(null);
      return toast.error(t("trade_flow.toasts.imei_must_differ"));
    }
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("imei", newImei)
      .eq("in_stock", 1)
      .single();

    if (error || !data) {
      setNewProduct(null);
      return toast.warning(t("trade_flow.toasts.product_not_found"));
    }
    setNewProduct(data);
    toast.success(t("trade_flow.toasts.new_product_loaded"));
  };

  const bp = parseFloat(buybackPrice) || 0;
  const sp = parseFloat(sellPrice) || 0;
  const buyPrice = parseFloat(newProduct?.price) || 0;
  const userPays = sp - bp;
  const profit = userPays - buyPrice + bp;

  const handleTrade = async () => {
    if (!oldSale || !newProduct || bp <= 0 || sp <= 0 || newImei === oldImei) {
      return toast.error(t("trade_flow.toasts.complete_fields"));
    }
    setSubmitting(true);

    const trade = supabase.from("trades").insert({
      old_product_id: oldSale.product_id,
      new_product_id: newProduct.id,
      buyback_price: bp,
      new_product_price: sp,
      user_paid: userPays,
      profit: profit
    });

    const incOld = supabase
      .from("products")
      .update({ in_stock: (oldSale.product.in_stock || 0) + 1 })
      .eq("id", oldSale.product_id);

    const decNew = supabase
      .from("products")
      .update({ in_stock: newProduct.in_stock - 1 })
      .eq("id", newProduct.id);

    const [r1, r2, r3] = await Promise.all([trade, incOld, decNew]);
    setSubmitting(false);

    if (r1.error || r2.error || r3.error) {
      return toast.error(t("trade_flow.toasts.trade_failed"));
    }

    toast.success(t("trade_flow.toasts.trade_completed"));
    setOldImei("");
    setOldSale(null);
    setNewImei("");
    setNewProduct(null);
    setBuybackPrice("");
    setSellPrice("");
    setTimeout(() => navigate(`/products`), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex mb-24">
      <div className="hidden lg:block fixed h-full">
        <Sidebar
          isOpen={isOpen}
          onToggle={handleToggle}
          onItemClick={handleItemClick}
        />
      </div>
      <div className="block lg:hidden">
        <BottomNavigation
          activeItem={activeItem}
          onItemClick={handleItemClick}
        />
      </div>

      <div className={`flex-1 p-4 lg:p-8 overflow-hidden ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-200`}>
        <div className="max-w-4xl mx-auto">
          <ToastContainer position="top-right" theme="light" />
          
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-tumbleweed rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("trade_flow.title")}</h1>
            <p className="text-gray-600">{t("trade_flow.subtitle")}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Device Selection */}
            <div className="space-y-6">
              {/* Step 1 - Old Device */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-tumbleweed text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t("trade_flow.steps.find_old_device")}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("trade_flow.labels.enter_old_imei")}
                    </label>
                    <div className="relative">
                      <input
                        value={oldImei}
                        onChange={(e) => setOldImei(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && checkOldSale()}
                        placeholder={t("trade_flow.placeholders.imei")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700"
                      />
                      <button
                        onClick={checkOldSale}
                        className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                      >
                        {t("trade_flow.buttons.search")}
                      </button>
                    </div>
                  </div>

                  {oldSale && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-start space-x-4">
                        {oldSale.product.images?.[0] && (
                          <img
                            src={oldSale.product.images[0]}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1">
                            {oldSale.product.title}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{t("trade_flow.product_info.sold", {
                              time: getTimeAgo(oldSale.created_at),
                              name: oldSale.buyer_name
                            })}</p>
                            <p className="font-medium text-green-700">
                              {t("trade_flow.product_info.original_price", { price: oldSale.sell_price })}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 - New Device */}
              {oldSale && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-tumbleweed text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t("trade_flow.steps.select_new_device")}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("trade_flow.labels.enter_new_imei")}
                      </label>
                      <div className="relative">
                        <input
                          value={newImei}
                          onChange={(e) => setNewImei(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadNewProduct()}
                          placeholder={t("trade_flow.placeholders.imei")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700"
                        />
                        <button
                          onClick={loadNewProduct}
                          className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                        >
                          {t("trade_flow.buttons.load")}
                        </button>
                      </div>
                    </div>

                    {newProduct && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start space-x-4">
                          {newProduct.images?.[0] && (
                            <img
                              src={newProduct.images[0]}
                              alt=""
                              className="w-20 h-20 object-cover rounded-lg shadow-sm"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 mb-1">
                              {newProduct.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {t("trade_flow.product_info.available_in_stock")}
                            </p>
                            <p className="font-medium text-blue-700">
                              {t("trade_flow.product_info.buy_price", { price: newProduct.price })}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Pricing & Summary */}
            {oldSale && newProduct && (
              <div className="space-y-6">
                {/* Step 3 - Pricing */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-tumbleweed text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t("trade_flow.steps.set_pricing")}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("trade_flow.labels.buyback_price")}
                      </label>
                      <div className="relative">
                        <input
                          value={buybackPrice}
                          onChange={(e) => setBuybackPrice(e.target.value)}
                          type="number"
                          placeholder={t("trade_flow.placeholders.price")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          {t("trade_flow.currency")}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("trade_flow.labels.sell_price")}
                      </label>
                      <div className="relative">
                        <input
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          type="number"
                          placeholder={t("trade_flow.placeholders.price")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          {t("trade_flow.currency")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="bg-gradient-to-r from-tumbleweed to-oceanblue rounded-2xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t("trade_flow.transaction_summary")}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("trade_flow.labels.new_device_cost")}</span>
                      <span className="font-semibold">{buyPrice.toFixed(2)} {t("trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("trade_flow.labels.buyback_payment")}</span>
                      <span className="font-semibold">{bp.toFixed(2)} {t("trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("trade_flow.labels.client_pays")}</span>
                      <span className="font-semibold">{userPays.toFixed(2)} {t("trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-white bg-opacity-20 rounded-lg px-4 mt-4">
                      <span className="font-semibold text-lg">{t("trade_flow.labels.your_profit")}</span>
                      <span className="font-bold text-xl">{profit.toFixed(2)} {t("trade_flow.currency")}</span>
                    </div>
                  </div>
                </div>

                {/* Complete Trade Button */}
                <button
                  onClick={handleTrade}
                  disabled={submitting || bp <= 0 || sp <= 0}
                  className="w-full bg-gradient-to-r from-tumbleweed to-oceanblue text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("trade_flow.buttons.processing_trade")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("trade_flow.buttons.complete_trade")}
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}