'use client';

import { useTranslation } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { userService } from '@/services/user.service';

export default function LanguageSwitcher() {
  const { language, setLanguage, isLoaded } = useTranslation();

  const handleLanguageChange = async (newLanguage: Language) => {
    // Immediately switch language in the UI (this updates the entire app instantly)
    setLanguage(newLanguage);
    
    // Guests can choose a local language; signed-in users also persist it.
    if (!localStorage.getItem('token')) return;
    userService.updatePreferences({ preferredLanguage: newLanguage }).catch(error => {
      console.error('Failed to save language preference:', error);
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-label="Switch to English"
      >
        English
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          language === 'ar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
        aria-label="Switch to Arabic"
      >
        العربية
      </button>
    </div>
  );
}
