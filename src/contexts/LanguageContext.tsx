'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { i18n, Language, Direction } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isLoaded: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  common: (key: string) => string;
  auth: (key: string) => string;
  dashboard: (key: string) => string;
  calendar: (key: string) => string;
  reservations: (key: string) => string;
  newReservation: (key: string) => string;
  rooms: (key: string) => string;
  guests: (key: string) => string;
  payments: (key: string) => string;
  users: (key: string) => string;
  settings: (key: string) => string;
  roomTypes: (key: string) => string;
  housekeeping: (key: string) => string;
  reports: (key: string) => string;
  errors: (key: string) => string;
  messages: (key: string) => string;
  notifications: (key: string) => string;
  profile: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      await i18n.initialize();
      setLanguageState(i18n.getLanguage());
      setIsLoaded(true);
      
      // Subscribe to language changes
      const unsubscribe = i18n.subscribe((newLanguage) => {
        setLanguageState(newLanguage);
      });
      
      return unsubscribe;
    };

    initializeLanguage();
  }, []);

  useEffect(() => {
    // Apply direction to document
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    i18n.setLanguage(lang);
    setLanguageState(lang);
  };

  const contextValue: LanguageContextType = {
    language,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    isLoaded,
    setLanguage,
    t: (key: string) => i18n.t(key),
    common: (key: string) => i18n.common(key),
    auth: (key: string) => i18n.auth(key),
    dashboard: (key: string) => i18n.dashboard(key),
    calendar: (key: string) => i18n.calendar(key),
    reservations: (key: string) => i18n.reservations(key),
    newReservation: (key: string) => i18n.newReservation(key),
    rooms: (key: string) => i18n.rooms(key),
    guests: (key: string) => i18n.guests(key),
    payments: (key: string) => i18n.payments(key),
    users: (key: string) => i18n.users(key),
    settings: (key: string) => i18n.settings(key),
    roomTypes: (key: string) => i18n.roomTypes(key),
    housekeeping: (key: string) => i18n.housekeeping(key),
    reports: (key: string) => i18n.reports(key),
    errors: (key: string) => i18n.errors(key),
    messages: (key: string) => i18n.messages(key),
    notifications: (key: string) => i18n.notifications(key),
    profile: (key: string) => i18n.profile(key),
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}