// TradeFlow.jsx
import React, { useState } from "react";
import supabase from "../lib/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";
import { useNavigate } from "react-router-dom";

export default function TradeFlow() {
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
      return toast.error("❌ No sale found for this IMEI");
    }
    setOldSale(data[0]);
    toast.success("✅ Old phone found");
  };

  const loadNewProduct = async () => {
    if (!newImei || newImei === oldImei) {
      setNewProduct(null);
      return toast.error("⚠️ New IMEI must be different");
    }
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("imei", newImei)
      .eq("in_stock", 1)
      .single();

    if (error || !data) {
      setNewProduct(null);
      return toast.warning("📦 New product not found or out of stock");
    }
    setNewProduct(data);
    toast.success("✅ New product loaded");
  };

  const bp = parseFloat(buybackPrice) || 0;
  const sp = parseFloat(sellPrice) || 0;
  const buyPrice = parseFloat(newProduct?.price) || 0;
  const userPays = sp - bp;
  const profit = userPays - buyPrice + bp;

  const handleTrade = async () => {
    if (
      !oldSale ||
      !newProduct ||
      bp <= 0 ||
      sp <= 0 ||
      newImei === oldImei
    ) {
      return toast.error("🚫 Complete all fields correctly");
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
      return toast.error("❌ Trade failed, try again");
    }

    toast.success("🎉 Trade completed!");
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Trade-In Center</h1>
            <p className="text-gray-600">Exchange old devices for new ones seamlessly</p>
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
                  <h3 className="text-lg font-semibold text-gray-800">Find Old Device</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Old Phone IMEI
                    </label>
                    <div className="relative">
                      <input
                        value={oldImei}
                        onChange={(e) => setOldImei(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && checkOldSale()}
                        placeholder="Enter IMEI number..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700"
                      />
                      <button
                        onClick={checkOldSale}
                        className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                      >
                        Search
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
                            <p>Sold {getTimeAgo(oldSale.created_at)} to {oldSale.buyer_name}</p>
                            <p className="font-medium text-green-700">
                              Original Price: {oldSale.sell_price} dh
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
                    <h3 className="text-lg font-semibold text-gray-800">Select New Device</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter New Phone IMEI
                      </label>
                      <div className="relative">
                        <input
                          value={newImei}
                          onChange={(e) => setNewImei(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && loadNewProduct()}
                          placeholder="Enter new IMEI number..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700"
                        />
                        <button
                          onClick={loadNewProduct}
                          className="absolute right-2 top-2 px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
                        >
                          Load
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
                              Available in stock
                            </p>
                            <p className="font-medium text-blue-700">
                              Buy Price: {newProduct.price} dh
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
                    <h3 className="text-lg font-semibold text-gray-800">Set Pricing</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buyback Price (What you pay for old device)
                      </label>
                      <div className="relative">
                        <input
                          value={buybackPrice}
                          onChange={(e) => setBuybackPrice(e.target.value)}
                          type="number"
                          placeholder="e.g. 1500"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          DH
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sell Price (What client pays for new device)
                      </label>
                      <div className="relative">
                        <input
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          type="number"
                          placeholder="e.g. 2500"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tumbleweed focus:border-transparent transition-all duration-200 text-gray-700 pr-12"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm font-medium">
                          DH
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
                    Transaction Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">New device cost:</span>
                      <span className="font-semibold">{buyPrice.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">Buyback payment:</span>
                      <span className="font-semibold">{bp.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white border-opacity-20">
                      <span className="text-white text-opacity-90">Client pays:</span>
                      <span className="font-semibold">{userPays.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-white bg-opacity-20 rounded-lg px-4 mt-4">
                      <span className="font-semibold text-lg">Your Profit:</span>
                      <span className="font-bold text-xl">{profit.toFixed(2)} DH</span>
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
                      Processing Trade...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Complete Trade
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