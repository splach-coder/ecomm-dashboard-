import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';

function Dashboard() {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('home');

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
          activeItem={activeItem} 
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
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-oceanblue mb-4">Welcome, {userData.firstName || userData.email}!</h1>
            <p className="text-fog">You are now logged into your secure dashboard.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-oceanblue mb-4">Your Profile</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {userData.email}</p>
              {userData.firstName && <p><span className="font-medium">First Name:</span> {userData.firstName}</p>}
              {userData.lastName && <p><span className="font-medium">Last Name:</span> {userData.lastName}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;