import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Inbox, 
  ArrowUpDown, 
  Grid3X3, 
  Bot, 
  Settings, 
  ChevronRight,
  LogOut,
  Package
} from 'lucide-react';

const Sidebar = ({ 
  isOpen = false, 
  onToggle = () => {},
  activeItem = 'Home',
  onLogout = () => {}
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeLine, setActiveLine] = useState({ top: 0, height: 33 });
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: '/dashboard', icon: Home, label: 'Home' },
    //{ id: 'Invoices', icon: FileText, label: 'Invoices' },
    //{ id: 'Inbox', icon: Inbox, label: 'Inbox', hasNotification: true },
    //{ id: 'Transactions', icon: ArrowUpDown, label: 'Transactions' },
    { id: '/products', icon: Package, label: 'Products' },
    //{ id: 'Apps', icon: Grid3X3, label: 'Apps' },
    //{ id: 'Assistant', icon: Bot, label: 'Assistant' },
    { id: '/dashboard/profile', icon: Settings, label: 'Settings' }
  ];

  // Calculate the position of the active line based on active item
  const getActiveItemPosition = () => {
    const activeIndex = menuItems.findIndex(item => item.id === activeItem);
    if (activeIndex === -1) return 0;
    
    // Base offset: header height + toggle button (if collapsed) + padding + item spacing
    const headerHeight = isOpen ? 73 : 73; // Header height
    const toggleButtonHeight = isOpen ? 0 : 57; // Toggle button height when collapsed
    const paddingTop = 8; // nav padding top
    const itemHeight = 44; // Each item height including spacing
    const itemSpacing = 4; // Space between items
    
    return headerHeight + toggleButtonHeight + paddingTop + (activeIndex * (itemHeight + itemSpacing)); // +22 to center on item
  };

  // Update active line position when activeItem changes or sidebar is toggled
  useEffect(() => {
    const position = getActiveItemPosition();
    setActiveLine({ top: position, height: 33 });
  }, [activeItem, isOpen]);

  const handleItemClick = (path) => {
    navigate(path);
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
  };

  const handleItemHover = (itemId) => {
    // Your hover logic here
    // Example: setHoveredItem(itemId);
  };

  return (
    <div className="relative h-screen" ref={sidebarRef}>
      {/* Sidebar */}
      <div 
        className={`
        left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 flex flex-col relative
          ${isOpen ? 'w-64' : 'w-16'}
        `}
        style={{ backgroundColor: '#F5F5F5' }}
      >
        {/* Animated Active Line - Positioned at the very left edge of sidebar */}
        {activeItem && (
          <div 
            className="absolute left-0 w-1 bg-orange-500 rounded-r-full transition-all duration-300 z-10"
            style={{
              height: `${activeLine.height}px`,
              top: `${activeLine.top}px`,
            }}
          />
        )}
        {/* Header */}
        <div className={`flex items-center p-4 ${isOpen ? 'justify-between border-b border-gray-200' : 'justify-center'}`}>
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
              <div className="w-3 h-3 bg-orange-400 rounded-sm -ml-2 mt-1"></div>
            </div>
            {isOpen && (
              <span className="text-xl font-semibold text-gray-800">Splitflow</span>
            )}
          </div>
          
          {/* Toggle Button - Only show when expanded */}
          {isOpen && (
            <button
              onClick={onToggle}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronRight 
                className="w-5 h-5 text-gray-600 transition-transform duration-300 rotate-180"
              />
            </button>
          )}
        </div>

        {/* Toggle Button when collapsed - positioned under logo before separator */}
        {!isOpen && (
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={onToggle}
              onMouseEnter={() => handleItemHover('toggle')}
              onMouseLeave={handleItemLeave}
              className={`
                w-full flex items-center p-3 rounded-lg transition-all duration-200 justify-center
                ${hoveredItem === 'toggle' ? 'bg-gray-100' : 'hover:bg-gray-50'}
              `}
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
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
                      ${isActive 
                        ? 'bg-white shadow-sm border border-gray-200' 
                        : isHovered 
                          ? 'bg-gray-100' 
                          : 'hover:bg-gray-50'
                      }
                      ${!isOpen ? 'justify-center' : 'justify-start'}
                    `}
                  >
                    <div className="relative">
                      <Icon 
                        className={`
                          w-5 h-5 transition-colors
                          ${isActive ? 'text-orange-500' : 'text-gray-600'}
                        `}
                      />
                      {/* Notification dot for Inbox */}
                      {item.hasNotification && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                    
                    {isOpen && (
                      <span 
                        className={`
                          ml-3 text-sm font-medium transition-colors
                          ${isActive ? 'text-gray-800' : 'text-gray-700'}
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

        {/* Logout Button - Fixed at bottom */}
        <div className="p-2 border-t border-gray-200 mt-auto">
          <button
            onClick={onLogout}
            onMouseEnter={() => handleItemHover('logout')}
            onMouseLeave={handleItemLeave}
            className={`
              w-full flex items-center p-3 rounded-lg transition-all duration-200
              ${hoveredItem === 'logout' ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-600'}
              ${!isOpen ? 'justify-center' : 'justify-start'}
            `}
          >
            <LogOut className="w-5 h-5" />
            {isOpen && (
              <span className="ml-3 text-sm font-medium">
                Logout
              </span>
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