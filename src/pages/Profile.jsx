import React, { useState, useEffect } from 'react';
import { LogOut, Globe, ChevronDown, Check, User, Mail, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/AuthContext';
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';
import i18n from "i18next";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('profile');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem("lang") || "en");

  const languages = [
    { code: 'en', name: t('english'), flag: '🇺🇸' },
    { code: 'fr', name: t('français'), flag: '🇫🇷' },
    { code: 'ar', name: t('العربية'), flag: '🇸🇦' },
  ];

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem("lang", languageCode);
    setIsLanguageDropdownOpen(false);
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-tumbleweed/10 to-oceanblue/10">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-tumbleweed border-t-transparent rounded-full animate-spin"></div>
          <p className="text-oceanblue font-medium">{t('loading_user_data...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog/5 to-tumbleweed/5 flex">
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
          <div className="max-w-4xl mx-auto">
            
            {/* Header Section with Language Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-oceanblue mb-2">{t('profile_settings')}</h1>
                <p className="text-fog">{t('manage_your_account_information_and_preferences')}</p>
              </div>
              
              {/* Language Switcher */}
              <div className="language-dropdown relative ms-auto">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-tumbleweed/5 border border-fog/20 hover:border-tumbleweed/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <Globe className="w-5 h-5 text-fog group-hover:text-tumbleweed transition-colors" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCurrentLanguage().flag}</span>
                    <span className="font-medium text-oceanblue group-hover:text-tumbleweed transition-colors">
                      {getCurrentLanguage().name}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fog group-hover:text-tumbleweed transition-all duration-300 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Language Dropdown */}
                {isLanguageDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-fog/10 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-tumbleweed/5 transition-colors ${
                          currentLanguage === language.code ? 'bg-tumbleweed/10' : ''
                        }`}
                      >
                        <span className="text-xl">{language.flag}</span>
                        <span className="flex-1 text-left font-medium text-oceanblue">
                          {language.name}
                        </span>
                        {currentLanguage === language.code && (
                          <Check className="w-4 h-4 text-tumbleweed" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Avatar Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-fog/10 p-6 sticky top-6">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-tumbleweed to-fog rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-tumbleweed rounded-full flex items-center justify-center shadow-md">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-oceanblue mb-1">
                      {userData.firstName || userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}`.trim()
                        : t('user_profile')
                      }
                    </h3>
                    <p className="text-fog text-sm">{userData.email}</p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Personal Info Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-fog/10 p-6 md:p-8 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-tumbleweed/10 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-tumbleweed" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-oceanblue">{t('personal_information')}</h2>
                      <p className="text-sm text-fog">{t('your_personal_details_and_information')}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-sm font-medium text-oceanblue mb-2">
                          {t('first_name')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={userData?.firstName || ''}
                            readOnly
                            className="w-full px-4 py-3 border border-fog/20 rounded-xl bg-fog/5 text-grey cursor-not-allowed focus:outline-none group-hover:border-fog/30 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-sm font-medium text-oceanblue mb-2">
                          {t('last_name')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={userData?.lastName || ''}
                            readOnly
                            className="w-full px-4 py-3 border border-fog/20 rounded-xl bg-fog/5 text-grey cursor-not-allowed focus:outline-none group-hover:border-fog/30 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="group">
                      <label className="block text-sm font-medium text-oceanblue mb-2">
                        {t('email_address')}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={userData?.email || ''}
                          readOnly
                          className="w-full px-4 py-3 pl-12 border border-fog/20 rounded-xl bg-fog/5 text-grey cursor-not-allowed focus:outline-none group-hover:border-fog/30 transition-colors"
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="w-5 h-5 text-fog" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-fog/10 p-6 md:p-8 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-moderatelybrown/10 rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-moderatelybrown" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-oceanblue">{t('account_settings')}</h2>
                      <p className="text-sm text-fog">{t('manage_your_account_preferences_and_security')}</p>
                    </div>
                  </div>

                  {/* Account Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
        

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-300 font-medium group"
                    >
                      <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>{t('sign_out')}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom spacing for mobile navigation */}
            <div className="h-32 lg:h-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;