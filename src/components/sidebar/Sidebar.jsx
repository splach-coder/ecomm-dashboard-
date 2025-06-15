import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Grid3X3,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";

const Sidebar = ({
  isOpen = false,
  onToggle = () => {},
  activeItem = "/dashboard",
  onLogout = () => {},
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: "/dashboard", icon: Home, label: "Dashboard" },
    { id: "/products", icon: Package, label: "Products" },
    { id: "/sales", icon: Grid3X3, label: "Sales" },
    { id: "/trade", icon: Grid3X3, label: "Trade" },
    { id: "/profile", icon: Settings, label: "Settings" },
  ];

  const handleItemClick = (path) => {
    navigate(path);
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
  };

  const handleItemHover = (itemId) => {
    setHoveredItem(itemId);
  };

  return (
    <div className="relative h-screen">
      <div
        className={`left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 flex flex-col relative ${
          isOpen ? "w-64" : "w-16"
        }`}
        style={{ backgroundColor: "#F5F5F5" }}
      >
        {/* Header */}
        <div
          className={`flex items-center p-4 ${
            isOpen
              ? "justify-between border-b border-gray-200"
              : "justify-center"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-full h-auto flex justify-center">
              <img
                src={"images/logo.png"}
                alt="website logo"
                className="w-[75px] h-auto object-contain"
              />
            </div>
          </div>

          {isOpen && (
            <button
              onClick={onToggle}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 rotate-180 transition-transform duration-300" />
            </button>
          )}
        </div>

        {!isOpen && (
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={onToggle}
              onMouseEnter={() => handleItemHover("toggle")}
              onMouseLeave={handleItemLeave}
              className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 justify-center ${
                hoveredItem === "toggle" ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <ChevronRight
                className={`w-5 h-5 transition-colors ${
                  hoveredItem === "toggle" ? "text-tumbleweed" : "text-gray-600"
                }`}
              />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              const isHovered = hoveredItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    onMouseEnter={() => handleItemHover(item.id)}
                    onMouseLeave={handleItemLeave}
                    className={`
                      w-full flex items-center p-3 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-white border-l-4 border-tumbleweed shadow-sm"
                          : isHovered
                          ? "bg-gray-100"
                          : "hover:bg-gray-50"
                      }
                      ${!isOpen ? "justify-center" : "justify-start"}
                    `}
                  >
                    <div className="relative">
                      <Icon
                        className={`
                          w-5 h-5 transition-colors
                          ${
                            isActive
                              ? "text-tumbleweed"
                              : isHovered
                              ? "text-tumbleweed"
                              : "text-gray-600"
                          }
                        `}
                      />
                    </div>

                    {isOpen && (
                      <span
                        className={`
                          ml-3 text-sm font-medium transition-colors
                          ${
                            isActive
                              ? "text-tumbleweed font-semibold"
                              : isHovered
                              ? "text-tumbleweed"
                              : "text-gray-700"
                          }
                        `}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-200 mt-auto">
          <button
            onClick={onLogout}
            onMouseEnter={() => handleItemHover("logout")}
            onMouseLeave={handleItemLeave}
            className={`
              w-full flex items-center p-3 rounded-lg transition-all duration-200
              ${
                hoveredItem === "logout"
                  ? "bg-red-50 text-red-600"
                  : "hover:bg-gray-50 text-gray-600"
              }
              ${!isOpen ? "justify-center" : "justify-start"}
            `}
          >
            <LogOut className="w-5 h-5" />
            {isOpen && (
              <span className="ml-3 text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
    </div>
  );
};

export default Sidebar;