// Custom i18n system for Hotel Management System

export type Language = 'en' | 'ar';

export type Direction = 'ltr' | 'rtl';

export interface TranslationData {
  common: Record<string, string>;
  auth: Record<string, string>;
  dashboard: Record<string, string>;
  calendar: Record<string, string>;
  reservations: Record<string, string>;
  newReservation: Record<string, string>;
  rooms: Record<string, string>;
  roomTypes: Record<string, string>;
  guests: Record<string, string>;
  payments: Record<string, string>;
  housekeeping: Record<string, string>;
  users: Record<string, string>;
  settings: Record<string, string>;
  reports: Record<string, string>;
  errors: Record<string, string>;
  messages: Record<string, string>;
  notifications: Record<string, string>;
  profile: Record<string, string>;
}

class I18nManager {
  private currentLanguage: Language = 'en';
  private translations: Record<Language, TranslationData> = {} as Record<Language, TranslationData>;
  private listeners: Set<(lang: Language) => void> = new Set();
  private isLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    // Don't load in constructor, load on demand
  }

  private async loadTranslations(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.performLoad();
    return this.loadingPromise;
  }

  private async performLoad(): Promise<void> {
    try {
      // Load English first as fallback
      const enResponse = await fetch('/messages/en.json');
      if (!enResponse.ok) {
        throw new Error(`Failed to load English translations: ${enResponse.status}`);
      }
      
      const enText = await enResponse.text();
      let enData: TranslationData;
      
      try {
        enData = JSON.parse(enText);
        console.log('[i18n] Parsed English translation data:', enData);
        console.log('[i18n] Root object keys:', Object.keys(enData));
        console.log('[i18n] Response URL:', enResponse.url);
        console.log('[i18n] Response status:', enResponse.status);
        console.log('[i18n] File size:', enText.length, 'bytes');
        console.log('[i18n] First 200 characters:', enText.substring(0, 200));
      } catch (parseError) {
        console.error('Failed to parse English translations JSON:', parseError);
        throw new Error('Invalid JSON in English translations');
      }

      // Validate English data structure
      if (!this.validateTranslationData(enData)) {
        console.error('Invalid English translation data structure');
        throw new Error('Invalid English translation data structure');
      }

      this.translations.en = enData;

      // Try to load Arabic, but don't fail if it doesn't work
      try {
        const arResponse = await fetch('/messages/ar.json');
        if (arResponse.ok) {
          const arText = await arResponse.text();
          let arData: TranslationData;
          
          try {
            arData = JSON.parse(arText);
          } catch (parseError) {
            console.error('Failed to parse Arabic translations JSON:', parseError);
            return; // Fall back to English
          }

          // Validate Arabic data structure
          if (this.validateTranslationData(arData)) {
            this.translations.ar = arData;
          } else {
            console.error('Invalid Arabic translation data structure, falling back to English');
          }
        } else {
          console.warn('Failed to load Arabic translations, falling back to English');
        }
      } catch (error) {
        console.warn('Error loading Arabic translations, falling back to English:', error);
      }

      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Set minimal fallback translations
      this.translations.en = this.getFallbackTranslations();
      this.translations.ar = this.getFallbackTranslations();
      this.isLoaded = true;
    }
  }

  private validateTranslationData(data: any): data is TranslationData {
    console.log('[i18n] validateTranslationData called');
    console.log('[i18n] Data type:', typeof data);
    console.log('[i18n] Data is null:', data === null);
    console.log('[i18n] Data is undefined:', data === undefined);
    
    if (!data || typeof data !== 'object') {
      console.error('[i18n] Validation failed: Root object is invalid');
      console.error('[i18n] Actual value:', data);
      console.error('[i18n] Expected: Object with namespace keys');
      return false;
    }
    
    const requiredCategories = ['common', 'auth', 'dashboard', 'calendar', 'reservations', 'newReservation', 'rooms', 'roomTypes', 'guests', 'payments', 'housekeeping', 'users', 'settings', 'reports', 'errors', 'messages', 'notifications', 'profile'];
    
    console.log('[i18n] Required namespaces:', requiredCategories);
    console.log('[i18n] Actual root keys:', Object.keys(data));
    
    for (const category of requiredCategories) {
      const value = data[category];
      console.log(`[i18n] Checking namespace "${category}":`);
      console.log(`[i18n]   - Value:`, value);
      console.log(`[i18n]   - Type:`, typeof value);
      console.log(`[i18n]   - Is null:`, value === null);
      console.log(`[i18n]   - Is undefined:`, value === undefined);
      console.log(`[i18n]   - Is array:`, Array.isArray(value));
      
      if (!data[category]) {
        console.error(`[i18n] Validation failed: Missing namespace "${category}"`);
        console.error(`[i18n] Actual value:`, value);
        return false;
      }
      
      if (typeof data[category] !== 'object') {
        console.error(`[i18n] Validation failed: Namespace "${category}" is not an object`);
        console.error(`[i18n] Actual type:`, typeof data[category]);
        console.error(`[i18n] Actual value:`, data[category]);
        console.error(`[i18n] Expected type: object`);
        return false;
      }
      
      if (Array.isArray(data[category])) {
        console.error(`[i18n] Validation failed: Namespace "${category}" is an array`);
        console.error(`[i18n] Expected: object`);
        return false;
      }
    }
    
    console.log('[i18n] Validation passed: All namespaces are valid');
    return true;
  }

  private getFallbackTranslations(): TranslationData {
    return {
      common: {
        dashboard: 'Dashboard',
        reservations: 'Reservations',
        rooms: 'Rooms',
        guests: 'Guests',
        payments: 'Payments',
        users: 'Users',
        settings: 'Settings',
        logout: 'Logout',
        login: 'Login',
        email: 'Email',
        password: 'Password',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        language: 'Language',
        english: 'English',
        arabic: 'Arabic',
        calendar: 'Calendar',
        newBooking: 'New Booking',
        profile: 'My Profile',
        changePassword: 'Change Password',
      },
      auth: {
        loginTitle: 'Sign in to your account',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        invalidCredentials: 'Invalid email or password',
        loginSuccess: 'Login successful',
        signIn: 'Sign In',
        signingIn: 'Signing in…',
        forgotPasswordDisabled: 'Forgot password?',
        rememberMeText: 'Remember me for 30 days',
        showPassword: 'Show password',
        hidePassword: 'Hide password',
        passwordPlaceholderDots: '••••••••',
      },
      dashboard: {
        title: 'Dashboard',
        totalRooms: 'Total Rooms',
        availableRooms: 'Available Rooms',
        totalReservations: 'Total Reservations',
        totalGuests: 'Total Guests',
        totalRevenue: 'Total Revenue',
      },
      calendar: {
        title: 'Calendar',
        monthView: 'Month',
        weekView: 'Week',
        dayView: 'Day',
        today: 'Today',
        statusConfirmed: 'Confirmed',
        statusPending: 'Pending',
        statusCheckedIn: 'Checked In',
        statusCheckedOut: 'Checked Out',
        statusCancelled: 'Cancelled',
        statusNoShow: 'No Show',
      },
      reservations: {
        title: 'Reservations',
        newReservation: 'New Reservation',
        status: 'Status',
        checkIn: 'Check In',
        checkOut: 'Check Out',
      },
      newReservation: {
        title: 'New reservation',
        subtitle: 'Create a booking in a few steps',
        loading: 'Loading...',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone',
        confirmReservation: 'Confirm reservation',
      },
      rooms: {
        title: 'Rooms',
        newRoom: 'New Room',
        roomNumber: 'Room Number',
        roomType: 'Room Type',
        status: 'Status',
      },
      guests: {
        title: 'Guests',
        newGuest: 'New Guest',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phoneNumber: 'Phone Number',
      },
      payments: {
        title: 'Payments',
        newPayment: 'New Payment',
        amount: 'Amount',
        status: 'Status',
      },
      housekeeping: {
        title: 'Housekeeping',
        newTask: 'New Task',
        status: 'Status',
      },
      users: {
        title: 'Users',
        newUser: 'New User',
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        role: 'Role',
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        theme: 'Theme',
      },
      reports: {
        title: 'Reports',
        generateReport: 'Generate Report',
      },
      roomTypes: {
        title: 'Room Types',
        name: 'Name',
        description: 'Description',
      },
      errors: {
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        networkError: 'Network error. Please check your connection.',
        serverError: 'Server error. Please try again later.',
      },
      messages: {
        confirmDelete: 'Are you sure you want to delete this item?',
        success: 'Operation completed successfully!',
        error: 'An error occurred. Please try again.',
      },
      notifications: {
        title: 'Notifications',
        subtitle: 'View and manage your notifications',
        searchPlaceholder: 'Search notifications...',
        allTypes: 'All Types',
        information: 'Information',
        success: 'Success',
        warning: 'Warning',
        error: 'Error',
        allStatus: 'All Status',
        read: 'Read',
        unread: 'Unread',
        markAsRead: 'Mark as read',
        markAllAsRead: 'Mark All as Read',
        clearAll: 'Clear All',
        loading: 'Loading notifications...',
        noNotificationsFound: 'No notifications found',
        tryAdjustingFilters: 'Try adjusting your filters',
        allCaughtUp: "You're all caught up!",
        overdue: 'Overdue',
        totalNotifications: 'Total Notifications',
        recentNotifications: 'Recent Notifications',
        viewAll: 'View all',
        noUnreadNotifications: 'No unread notifications',
        newNotification: 'New notification',
        reservationCreated: 'Reservation created',
        reservationCancelled: 'Reservation cancelled',
        paymentReceived: 'Payment received',
        checkInCompleted: 'Check-in completed',
        checkOutCompleted: 'Check-out completed',
        roomAvailable: 'Room available',
        roomMaintenance: 'Room maintenance',
        guestCreated: 'Guest created',
        userCreated: 'User created',
        reportGenerated: 'Report generated',
      },
      profile: {
        title: 'My Profile',
        subtitle: 'Manage your personal information and preferences',
        loading: 'Loading...',
        editProfile: 'Edit Profile',
        save: 'Save',
        cancel: 'Cancel',
        firstName: 'First Name',
        lastName: 'Last Name',
        phoneNumber: 'Phone Number',
        avatarColor: 'Avatar Color',
        profileUpdated: 'Profile updated successfully',
        failedToUpdate: 'Failed to update profile',
        noProfileData: 'No profile data available',
        retry: 'Retry',
        personalInfo: 'Personal Information',
        contactInfo: 'Contact Information',
        preferences: 'Preferences',
        changeAvatar: 'Change Avatar',
        removeAvatar: 'Remove Avatar',
        generateRandomColor: 'Generate Random Color',
      },
    };
  }

  setLanguage(language: Language) {
    this.currentLanguage = language;
    this.updateDocumentDirection();
    this.notifyListeners();
    this.saveToStorage();
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  getDirection(): Direction {
    return this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
  }

  private updateDocumentDirection() {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = this.getDirection();
      document.documentElement.lang = this.currentLanguage;
    }
  }

  translate(category: keyof TranslationData, key: string): string {
    const langData = this.translations[this.currentLanguage];
    if (!langData) return key;
    
    const categoryData = langData[category];
    if (!categoryData) return key;
    
    // Support nested keys like "dashboard.occupancyTrend"
    const keys = key.split('.');
    let value: any = categoryData;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return the key if path doesn't exist
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  // Convenience methods for common categories
  t(key: string): string {
    return this.translate('common', key);
  }

  common(key: string): string {
    return this.translate('common', key);
  }

  auth(key: string): string {
    return this.translate('auth', key);
  }

  dashboard(key: string): string {
    return this.translate('dashboard', key);
  }

  calendar(key: string): string {
    return this.translate('calendar', key);
  }

  reservations(key: string): string {
    return this.translate('reservations', key);
  }

  newReservation(key: string): string {
    return this.translate('newReservation', key);
  }

  rooms(key: string): string {
    return this.translate('rooms', key);
  }

  guests(key: string): string {
    return this.translate('guests', key);
  }

  payments(key: string): string {
    return this.translate('payments', key);
  }

  users(key: string): string {
    return this.translate('users', key);
  }

  settings(key: string): string {
    return this.translate('settings', key);
  }

  roomTypes(key: string): string {
    return this.translate('roomTypes', key);
  }

  housekeeping(key: string): string {
    return this.translate('housekeeping', key);
  }

  reports(key: string): string {
    return this.translate('reports', key);
  }

  errors(key: string): string {
    return this.translate('errors', key);
  }

  messages(key: string): string {
    return this.translate('messages', key);
  }

  notifications(key: string): string {
    return this.translate('notifications', key);
  }

  profile(key: string): string {
    return this.translate('profile', key);
  }

  subscribe(listener: (lang: Language) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentLanguage));
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferredLanguage', this.currentLanguage);
    }
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('preferredLanguage') as Language;
      if (saved === 'en' || saved === 'ar') {
        this.currentLanguage = saved;
        this.updateDocumentDirection();
      }
    }
  }

  async initialize() {
    await this.loadTranslations();
    this.loadFromStorage();
  }

  isTranslationsLoaded(): boolean {
    return this.isLoaded;
  }
}

// Singleton instance
export const i18n = new I18nManager();

// React hook for components
export function useTranslation() {
  const [language, setLanguage] = React.useState<Language>(i18n.getLanguage());
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const loadTranslations = async () => {
      await i18n.initialize();
      setIsLoaded(true);
    };

    loadTranslations();

    const unsubscribe = i18n.subscribe((lang) => {
      setLanguage(lang);
    });
    return unsubscribe;
  }, []);

  return {
    language,
    setLanguage: (lang: Language) => i18n.setLanguage(lang),
    direction: i18n.getDirection(),
    isLoaded,
    t: (key: string) => i18n.t(key),
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
}

// Import React for the hook
import React from 'react';
