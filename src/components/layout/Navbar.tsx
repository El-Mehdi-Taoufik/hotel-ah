"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu, User, Settings as SettingsIcon, LogOut, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { authService } from "@/services/auth.service";

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function Navbar({ title }: { title?: string }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const { t, isLoaded, direction } = useTranslation();

  useEffect(() => {
    loadUserFromStorage();
    
    const handleStorageChange = () => {
      loadUserFromStorage();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  const loadUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      setUser(null);
    }
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleNavigation = (path: string) => {
    setShowDropdown(false);
    router.push(path);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    try { await authService.logout(); } catch { /* Local session is still cleared below. */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const getUserInitials = () => {
    if (!user) return '';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  const getDisplayRole = () => {
    if (!user) return '';
    return user.role;
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E7DFD4] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4" dir={direction}>
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-[#6B6258] hover:text-[#2F2A25]" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs text-[#9A9085] leading-none">Hotel Aguelmam</p>
          <p className="text-sm font-medium text-[#2F2A25] mt-1">{title ?? "Overview"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <NotificationBell />
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-xl hover:bg-[#F8F6F2] transition-colors"
            style={{ paddingInlineStart: '0.25rem', paddingInlineEnd: '0.5rem', paddingBlock: '0.25rem' }}
            onClick={handleProfileClick}
            aria-label="Profile menu"
          >
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {getUserInitials()}
            </div>
            <div className="hidden sm:block" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
              <p className="text-sm text-[#2F2A25] leading-tight">{getDisplayName()}</p>
              <p className="text-[11px] text-[#9A9085] leading-tight">{getDisplayRole()}</p>
            </div>
            <ChevronDown size={14} className={`text-[#9A9085] hidden sm-block ${direction === 'rtl' ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div 
              className="absolute top-full mt-2 w-48 bg-white border border-[#E7DFD4] rounded-xl shadow-lg py-2 z-50"
              style={{ [direction === 'rtl' ? 'left' : 'right']: 0 }}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#2F2A25] hover:bg-[#F8F6F2] transition-colors"
                style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
                onClick={() => handleNavigation('/profile')}
              >
                <User size={16} className="shrink-0" />
                {isLoaded ? t('profile') : 'My Profile'}
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#2F2A25] hover:bg-[#F8F6F2] transition-colors"
                style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
                onClick={() => handleNavigation('/settings')}
              >
                <SettingsIcon size={16} className="shrink-0" />
                {isLoaded ? t('settings') : 'Settings'}
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#2F2A25] hover:bg-[#F8F6F2] transition-colors"
                style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
                onClick={() => handleNavigation('/change-password')}
              >
                <Key size={16} className="shrink-0" />
                {isLoaded ? t('changePassword') : 'Change Password'}
              </button>
              <div className="my-2 border-t border-[#E7DFD4]" />
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#E53935] hover:bg-[#F8F6F2] transition-colors"
                style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}
                onClick={handleLogout}
              >
                <LogOut size={16} className="shrink-0" />
                {isLoaded ? t('logout') : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
