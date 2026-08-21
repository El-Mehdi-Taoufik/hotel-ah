'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { userService } from '@/services/user.service';

export function LanguageInitializer({ children }: { children: React.ReactNode }) {
  const { setLanguage, language, direction } = useTranslation();

  useEffect(() => {
    // Update document direction when language changes
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = language;
    }
  }, [language, direction]);

  useEffect(() => {
    const initializeLanguage = async () => {
      // Then load user's language preference from backend
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await userService.getPreferences();
        if (response.success && response.data) {
          const userLanguage = response.data.preferredLanguage;
          if (userLanguage && (userLanguage === 'en' || userLanguage === 'ar')) {
            setLanguage(userLanguage);
          }
        }
      } catch (error) {
        // Silently fail - fall back to default English if backend call fails
        // The api client handles token refresh automatically
        // User might not be authenticated yet or user not found
      }
    };

    initializeLanguage();
  }, [setLanguage]);

  return <>{children}</>;
}
