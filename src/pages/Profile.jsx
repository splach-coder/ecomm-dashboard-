import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('profile');

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  useEffect(() => {
    if (user) {
      setUserData({
        email: user.email,
        id: user.id,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || ''
      });
    }
  }, [user]);

  if (!userData) {
    return <div className="flex items-center justify-center h-screen">Loading user data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for larger screens */}
      <div className="hidden lg:block">
        <Sidebar 
          isOpen={isOpen} 
          onToggle={handleToggle} 
          activeItem={"/profile"} 
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
      
      <div className="flex-1">
        <div className="px-4 py-6 md:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
        
        {/* Personal Info Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-oceanblue mb-2">Personal info</h2>
            <p className="text-sm text-gray-600">Your personal information.</p>
          </div>

          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First name
                </label>
                <input
                  type="text"
                  value={userData?.firstName || ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  value={userData?.lastName || ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={userData?.email || ''}
                  readOnly
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-oceanblue mb-2">Account</h2>
            <p className="text-sm text-gray-600">Manage your account settings and preferences.</p>
          </div>

          {/* Logout Button */}
          <div className="flex justify-start">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-200 font-medium"
            >
              <LogOut size={20} />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-32"></div>
      </div>
    </div>
    </div>
    
    </div>

  );
};

export default ProfilePage;