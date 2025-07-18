import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Plus,
  ArrowLeftRight,
  User,
  ShoppingCart,
  DollarSign,
  MonitorSmartphone,
  Wrench,
  Wallet,
} from "lucide-react";

const BottomNavigation = ({ activeItem }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // Function to handle IMEI scanning
  const handleIMEIScanned = (imei) => {
    console.log("Scanned IMEI:", imei);
    setShowScanner(false);

    // Dummy product data based on IMEI
    const dummyProduct = {
      id: "scan-" + imei.substring(0, 5),
      title: `${t("labels.smartphone")} (IMEI: ${imei})`,
      description: t("labels.smartphoneScannedDescription"),
      price: 3499.99,
      category: "Phone",
      brand: "Xiaomi",
      condition: "used",
      in_stock: 1,
      imei: imei,
      images: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop",
        "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&h=600&fit=crop",
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Navigate to product page with the product data
    navigate("/product/" + dummyProduct.id, {
      state: { product: dummyProduct },
    });
  };

  return (
    <>
      {/* IMEI Scanner */}
      {showScanner && (
        <IMEIScanner
          onScanned={handleIMEIScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Overlay */}
      {showOptions && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}

      {/* Options Slider */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          showOptions ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl p-6">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

          <div className="space-y-4">
            <button
              onClick={() => handleNavigation("/reparation")}
              className="w-full flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <Wrench size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t("labels.reparation")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("labels.reparationDescription")}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/expenses")}
              className="w-full flex items-center gap-4 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-2xl transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                <Wallet size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t("labels.expenses")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("labels.expensesDescription")}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/external trade")}
              className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t("labels.tradeProductExternal")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("labels.tradeProductDescription")}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/trade")}
              className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t("labels.tradeProductInternal")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("labels.tradeProductDescription")}
                </p>
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/products")}
              className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors duration-200"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t("labels.buyProduct")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("labels.buyProductDescription")}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-end z-30">
        <div className="bg-oceanblue shadow-lg px-4 py-4 flex items-center justify-between gap-4 max-w-full w-full">
          {/* Home */}
          <button
            onClick={() => handleNavigation("/dashboard")}
            className={`flex flex-col items-center justify-center transition-all duration-200 group hover:scale-105`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeItem === "home" ? "bg-tumbleweed" : "hover:bg-tumbleweed"
              }`}
            >
              <Home
                size={24}
                className={`text-white transition-colors duration-200 ${
                  activeItem === "home"
                    ? "text-oceanblue"
                    : "group-hover:text-oceanblue"
                }`}
                strokeWidth={1.5}
              />
            </div>
            <span
              className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                activeItem === "home"
                  ? "text-tumbleweed"
                  : "text-white group-hover:text-tumbleweed"
              }`}
            >
              {t("navigation.home")}
            </span>
          </button>

          {/* Products */}
          <button
            onClick={() => handleNavigation("/products")}
            className={`flex flex-col items-center justify-center transition-all duration-200 group hover:scale-105`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeItem === "products"
                  ? "bg-tumbleweed"
                  : "hover:bg-tumbleweed"
              }`}
            >
              <MonitorSmartphone
                size={24}
                className={`text-white transition-colors duration-200 ${
                  activeItem === "products"
                    ? "text-oceanblue"
                    : "group-hover:text-oceanblue"
                }`}
                strokeWidth={1.5}
              />
            </div>
            <span
              className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                activeItem === "products"
                  ? "text-tumbleweed"
                  : "text-white group-hover:text-tumbleweed"
              }`}
            >
              {t("navigation.products")}
            </span>
          </button>

          {/* Center Plus Button */}
          <button
            onClick={toggleOptions}
            className="flex flex-col items-center justify-center transition-all duration-200 group relative -mt-2"
          >
            <div
              className={`w-20 h-16 rounded-full bg-tumbleweed hover:bg-opacity-90 shadow-lg flex items-center justify-center transition-all duration-200 ${
                showOptions ? "rotate-45" : ""
              }`}
            >
              <Plus
                size={28}
                className="text-oceanblue transition-transform duration-200"
                strokeWidth={1.5}
              />
            </div>
          </button>

          {/* Sales - Buys */}
          <button
            onClick={() => handleNavigation("/sales")}
            className={`flex flex-col items-center justify-center transition-all duration-200 group hover:scale-105`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeItem === "sales" ? "bg-tumbleweed" : "hover:bg-tumbleweed"
              }`}
            >
              <ArrowLeftRight
                size={24}
                className={`text-white transition-colors duration-200 ${
                  activeItem === "sales"
                    ? "text-oceanblue"
                    : "group-hover:text-oceanblue"
                }`}
                strokeWidth={1.5}
              />
            </div>
            <span
              className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                activeItem === "sales"
                  ? "text-tumbleweed"
                  : "text-white group-hover:text-tumbleweed"
              }`}
            >
              {t("navigation.sales")}
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => handleNavigation("/profile")}
            className={`flex flex-col items-center justify-center transition-all duration-200 group hover:scale-105 `}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeItem === "profile"
                  ? "bg-tumbleweed"
                  : "hover:bg-tumbleweed"
              }`}
            >
              <User
                size={24}
                className={`text-white transition-colors duration-200 ${
                  activeItem === "profile"
                    ? "text-oceanblue"
                    : "group-hover:text-oceanblue"
                }`}
                strokeWidth={1.5}
              />
            </div>
            <span
              className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                activeItem === "profile"
                  ? "text-tumbleweed"
                  : "text-white group-hover:text-tumbleweed"
              }`}
            >
              {t("navigation.profile")}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
