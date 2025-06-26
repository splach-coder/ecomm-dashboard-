import React, { useState } from "react";
import supabase from "../lib/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ExternalTradeFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [oldImei, setOldImei] = useState("");
  const [oldProduct, setOldProduct] = useState(null);
  const [newImei, setNewImei] = useState("");
  const [newProduct, setNewProduct] = useState(null);
  const [buybackPrice, setBuybackPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("home");

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);

  const checkOldProduct = async () => {
    if (!oldImei) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("imei", oldImei)
      .eq("in_stock", 1)
      .single();

    if (error || !data) {
      setOldProduct(null);
      return toast.error(t("external_trade_flow.toasts.old_product_not_found"));
    }
    setOldProduct(data);
    toast.success(t("external_trade_flow.toasts.old_product_found"));
  };

  const loadNewProduct = async () => {
    if (!newImei || newImei === oldImei) {
      setNewProduct(null);
      return toast.error(t("external_trade_flow.toasts.imei_must_differ"));
    }
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("imei", newImei)
      .eq("in_stock", 1)
      .single();

    if (error || !data) {
      setNewProduct(null);
      return toast.warning(t("external_trade_flow.toasts.product_not_found"));
    }
    setNewProduct(data);
    toast.success(t("external_trade_flow.toasts.new_product_loaded"));
  };

  const bp = parseFloat(buybackPrice) || 0;
  const sp = parseFloat(sellPrice) || 0;
  const buyPrice = parseFloat(newProduct?.price) || 0;
  const userPays = sp - bp;
  const profit = userPays - buyPrice + bp;

  const handleExternalTrade = async () => {
    if (!oldProduct || !newProduct || bp <= 0 || sp <= 0 || newImei === oldImei) {
      return toast.error(t("external_trade_flow.toasts.complete_fields"));
    }
    setSubmitting(true);

    const trade = supabase.from("trades").insert({
      old_product_id: oldProduct.id,
      new_product_id: newProduct.id,
      buyback_price: bp,
      new_product_price: sp,
      user_paid: userPays,
      profit: profit,
      internal: false // This is an external trade
    });

    // For external trades, both products are from inventory
    // Old product gets removed from stock (we're buying it from customer)
    const decOld = supabase
      .from("products")
      .update({ in_stock: oldProduct.in_stock - 1 })
      .eq("id", oldProduct.id);

    // New product gets removed from stock (customer is buying it)
    const decNew = supabase
      .from("products")
      .update({ in_stock: newProduct.in_stock - 1 })
      .eq("id", newProduct.id);

    const [r1, r2, r3] = await Promise.all([trade, decOld, decNew]);
    setSubmitting(false);

    if (r1.error || r2.error || r3.error) {
      return toast.error(t("external_trade_flow.toasts.trade_failed"));
    }

    toast.success(t("external_trade_flow.toasts.trade_completed"));
    setOldImei("");
    setOldProduct(null);
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("external_trade_flow.title")}</h1>
            <p className="text-gray-600">{t("external_trade_flow.subtitle")}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Device Selection */}
            <div className="space-y-6">
              {/* Step 1 - External Device */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{t("external_trade_flow.steps.find_external_device")}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("external_trade_flow.labels.enter_external_imei")}
                    </label>
                    <div className="relative">
                      <input
                        value={oldImei}
                        onChange={(e) => setOldImei(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && checkOldProduct()}
                        placeholder={t("external_trade_flow.placeholders.imei")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700"
                      />
                      <button
                        onClick={checkOldProduct}
                        className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                      >
                        {t("external_trade_flow.buttons.search")}
                      </button>
                    </div>
                  </div>

                  {oldProduct && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-start space-x-4">
                        {oldProduct.images?.[0] && (
                          <img
                            src={oldProduct.images[0]}
                            alt=""
                            className="w-20 h-20 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 mb-1">
                            {oldProduct.title}
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{t("external_trade_flow.product_info.available_in_stock")}</p>
                            <p className="font-medium text-purple-700">
                              {t("external_trade_flow.product_info.catalog_price", { price: oldProduct.price })}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
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
              {oldProduct && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t("external_trade_flow.steps.select_new_device")}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("external_trade_flow.labels.enter_new_imei")}
                      </label>
                      <div className="relative">
                        <input
                          value={newImei}
                          onChange={(e) => setNewImei(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadNewProduct()}
                          placeholder={t("external_trade_flow.placeholders.imei")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700"
                        />
                        <button
                          onClick={loadNewProduct}
                          className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                        >
                          {t("external_trade_flow.buttons.load")}
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
                              {t("external_trade_flow.product_info.available_in_stock")}
                            </p>
                            <p className="font-medium text-blue-700">
                              {t("external_trade_flow.product_info.buy_price", { price: newProduct.price })}
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
            {oldProduct && newProduct && (
              <div className="space-y-6">
                {/* Step 3 - Pricing */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t("external_trade_flow.steps.set_pricing")}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("external_trade_flow.labels.buyback_price")}
                      </label>
                      <div className="relative">
                        <input
                          value={buybackPrice}
                          onChange={(e) => setBuybackPrice(e.target.value)}
                          type="number"
                          placeholder={t("external_trade_flow.placeholders.price")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          {t("external_trade_flow.currency")}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("external_trade_flow.labels.sell_price")}
                      </label>
                      <div className="relative">
                        <input
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          type="number"
                          placeholder={t("external_trade_flow.placeholders.price")}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          {t("external_trade_flow.currency")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t("external_trade_flow.transaction_summary")}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("external_trade_flow.labels.new_device_cost")}</span>
                      <span className="font-semibold">{buyPrice.toFixed(2)} {t("external_trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("external_trade_flow.labels.buyback_payment")}</span>
                      <span className="font-semibold">{bp.toFixed(2)} {t("external_trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">{t("external_trade_flow.labels.client_pays")}</span>
                      <span className="font-semibold">{userPays.toFixed(2)} {t("external_trade_flow.currency")}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-white bg-opacity-20 rounded-lg px-4 mt-4">
                      <span className="font-semibold text-lg">{t("external_trade_flow.labels.your_profit")}</span>
                      <span className="font-bold text-xl">{profit.toFixed(2)} {t("external_trade_flow.currency")}</span>
                    </div>
                  </div>
                </div>

                {/* Complete Trade Button */}
                <button
                  onClick={handleExternalTrade}
                  disabled={submitting || bp <= 0 || sp <= 0}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("external_trade_flow.buttons.processing_trade")}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("external_trade_flow.buttons.complete_external_trade")}
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