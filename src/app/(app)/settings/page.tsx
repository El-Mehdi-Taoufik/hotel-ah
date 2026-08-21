"use client";

import { useState, useEffect } from "react";
import { Building2, Clock, CreditCard, Settings, Tag, Plus, Save, Loader2, Pencil, Trash2, Bell, Mail, Smartphone, Download, Upload, RefreshCw, Sun, Moon, Monitor } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { settingService, HotelSettings, ReservationSettings, PaymentSettings, SystemSettings } from "@/services/setting.service";
import { roomTypeService } from "@/services/room-type.service";
import { userService } from "@/services/user.service";
import { useTranslation } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { i18n } from "@/lib/i18n";
import { getRoomTypeImage, getRoomTypeInfo } from "@/lib/roomTypeImages";

export default function SettingsPage() {
  const { language, setLanguage, isLoaded: i18nLoaded, settings: t, common, direction } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const tabs = [
    { id: "hotel", label: t('hotelSettings'), icon: Building2 },
    { id: "reservation", label: t('reservationSettings'), icon: Clock },
    { id: "payment", label: t('paymentSettings'), icon: CreditCard },
    { id: "system", label: t('systemSettings'), icon: Settings },
    { id: "room-types", label: t('roomTypes'), icon: Tag },
  ];
  const [active, setActive] = useState("hotel");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [showEditRoomType, setShowEditRoomType] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for each section
  const [hotelSettings, setHotelSettings] = useState<HotelSettings>({
    hotelName: "",
    address: "",
    phone: "",
    email: "",
    currency: "USD",
    timeZone: "UTC",
    language: "en"
  });

  const [reservationSettings, setReservationSettings] = useState<ReservationSettings>({
    defaultCheckInTime: "14:00",
    defaultCheckOutTime: "11:00",
    reservationPrefix: "RES",
    autoConfirmReservations: false,
    allowOverbooking: false
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    taxPercentage: 10,
    depositPercentage: 20,
    defaultPaymentMethod: "Credit Card"
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    // Theme
    theme: "light",
    
    // Appearance
    fontSize: "medium",
    compactMode: false,
    sidebarCollapsed: false,
    sidebarPosition: "left",
    
    // Notifications
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSoundNotifications: true,
    enableDesktopNotifications: false,
    
    // Security
    autoLogoutTimeout: 30,
    rememberMe: true,
    
    // System
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    defaultLanguage: "en",
    defaultCurrency: "USD",
    defaultTax: 10
  });

  const [backupData, setBackupData] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSettings();
    fetchRoomTypes();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch all settings in parallel
      const [hotel, reservation, payment, system] = await Promise.all([
        settingService.getHotelSettings(),
        settingService.getReservationSettings(),
        settingService.getPaymentSettings(),
        settingService.getSystemSettings()
      ]);

      if (hotel.success && hotel.data) {
        setHotelSettings(hotel.data);
      }
      
      if (reservation.success && reservation.data) {
        setReservationSettings(reservation.data);
      }
      
      if (payment.success && payment.data) {
        setPaymentSettings(payment.data);
      }
      
      if (system.success && system.data) {
        setSystemSettings(system.data);
      }
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Settings error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const data = await roomTypeService.getAll();
      setRoomTypes(data.data || []);
    } catch (err) {
      console.error("Room types error:", err);
    }
  };

  const handleSaveHotelSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Check if language changed
      const languageChanged = hotelSettings.language !== language;
      
      // Save hotel settings
      const response = await settingService.updateHotelSettings(hotelSettings);
      if (response.success) {
        // If language changed, save to user preferences and switch immediately
        if (languageChanged) {
          try {
            await userService.updatePreferences({ preferredLanguage: hotelSettings.language });
            // Immediately switch language in the UI
            setLanguage(hotelSettings.language as 'en' | 'ar');
          } catch (langError) {
            console.error("Failed to save language preference:", langError);
            setError(t('failedToSaveLanguage'));
            return;
          }
        }
        
        setSuccessMessage(t('savedSuccessfully'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToSave'));
      }
    } catch (err) {
      setError(t('failedToSave'));
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReservationSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingService.updateReservationSettings(reservationSettings);
      if (response.success) {
        setSuccessMessage(t('savedSuccessfully'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToSave'));
      }
    } catch (err) {
      setError(t('failedToSave'));
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingService.updatePaymentSettings(paymentSettings);
      if (response.success) {
        setSuccessMessage(t('savedSuccessfully'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToSave'));
      }
    } catch (err) {
      setError(t('failedToSave'));
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Apply theme change immediately
      if (systemSettings.theme !== theme) {
        setTheme(systemSettings.theme as 'light' | 'dark' | 'system');
      }
      
      const response = await settingService.updateSystemSettings(systemSettings);
      if (response.success) {
        setSuccessMessage(t('savedSuccessfully'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToSave'));
      }
    } catch (err) {
      setError(t('failedToSave'));
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoomType = async (roomTypeData: any) => {
    try {
      setSaving(true);
      setFormError(null);
      
      const requestData = {
        name: roomTypeData.name,
        description: roomTypeData.description || '',
        basePrice: parseFloat(roomTypeData.basePrice),
        maxOccupancy: parseInt(roomTypeData.maxOccupancy),
        maxAdults: parseInt(roomTypeData.maxAdults) || parseInt(roomTypeData.maxOccupancy),
        maxChildren: parseInt(roomTypeData.maxChildren) || 0,
        amenities: roomTypeData.amenities || ''
      };
      
      const result = await roomTypeService.create(requestData);
      
      if (!result.success) {
        setFormError(result.message || t('failedToAddRoomType'));
        return;
      }
      
      await fetchRoomTypes();
      setShowAddRoomType(false);
      setFormError(null);
      
      showToast(t('roomTypeAdded'), 'success');
    } catch (err) {
      console.error("Failed to add room type:", err);
      setFormError(err instanceof Error ? err.message : t('failedToAddRoomType'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoomType = async (roomTypeData: any) => {
    try {
      setSaving(true);
      setFormError(null);
      
      const requestData = {
        name: roomTypeData.name,
        description: roomTypeData.description || '',
        basePrice: parseFloat(roomTypeData.basePrice),
        maxOccupancy: parseInt(roomTypeData.maxOccupancy),
        maxAdults: parseInt(roomTypeData.maxAdults) || parseInt(roomTypeData.maxOccupancy),
        maxChildren: parseInt(roomTypeData.maxChildren) || 0,
        amenities: roomTypeData.amenities || ''
      };
      
      const result = await roomTypeService.update(selectedRoomType.id, requestData);
      
      if (!result.success) {
        setFormError(result.message || t('failedToUpdateRoomType'));
        return;
      }
      
      await fetchRoomTypes();
      setShowEditRoomType(false);
      setSelectedRoomType(null);
      setFormError(null);
      
      showToast(t('roomTypeUpdated'), 'success');
    } catch (err) {
      console.error("Failed to update room type:", err);
      setFormError(err instanceof Error ? err.message : t('failedToUpdateRoomType'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoomType = async () => {
    try {
      setSaving(true);
      setFormError(null);
      
      const result = await roomTypeService.delete(selectedRoomType.id);
      
      if (!result.success) {
        setFormError(result.message || t('failedToDeleteRoomType'));
        return;
      }
      
      await fetchRoomTypes();
      setShowDeleteConfirm(false);
      setSelectedRoomType(null);
      setFormError(null);
      
      showToast(t('roomTypeDeleted'), 'success');
    } catch (err) {
      console.error("Failed to delete room type:", err);
      setFormError(err instanceof Error ? err.message : t('failedToDeleteRoomType'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingService.createBackup();
      if (response.success) {
        // Download the backup
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setSuccessMessage(t('backupCreated'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToCreateBackup'));
      }
    } catch (err) {
      setError(t('failedToCreateBackup'));
      console.error("Failed to create backup:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingService.exportDatabase();
      if (response.success) {
        // Download the export
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setSuccessMessage(t('databaseExported'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || t('failedToExport'));
      }
    } catch (err) {
      setError(t('failedToExport'));
      console.error("Failed to export database:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setSaving(true);
      setError(null);
      
      const fileContent = await file.text();
      const response = await settingService.importDatabase(fileContent);
      
      if (response.success) {
        setSuccessMessage(t('databaseImported'));
        setTimeout(() => setSuccessMessage(null), 3000);
        // Refresh settings after import
        await fetchAllSettings();
      } else {
        setError(response.message || t('failedToImport'));
      }
    } catch (err) {
      setError(t('failedToImport'));
      console.error("Failed to import database:", err);
    } finally {
      setSaving(false);
      event.target.value = ''; // Reset file input
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={common('loading')} />
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="h-64 animate-pulse bg-gray-200/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !hotelSettings.hotelName) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchAllSettings}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {successMessage && (
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <nav className="lg:col-span-1 bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-2 h-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-start transition-colors",
                active === t.id ? "bg-primary-500/15 text-purple-200 border border-primary-400/25" : "text-[#6B6258] hover:text-[#2F2A25] hover:bg-white/[0.05] border border-transparent"
              )}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="lg:col-span-3 bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 space-y-6">
          {active === "hotel" && (
            <div>
              <h3 className="text-lg font-semibold text-[#2F2A25] mb-6">Hotel Settings</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Hotel Name</Label>
                    <Input
                      value={hotelSettings.hotelName}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, hotelName: e.target.value })}
                      placeholder="Enter hotel name"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={hotelSettings.phone}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={hotelSettings.email}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={hotelSettings.currency}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, currency: e.target.value })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="MAD">MAD (DH)</option>
                      <option value="MAD">MAD (DH)</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('timeZone')}</Label>
                    <Select
                      value={hotelSettings.timeZone}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, timeZone: e.target.value })}
                    >
                      <option value="UTC">UTC</option>
                      <option value="GMT">GMT</option>
                      <option value="CET">CET</option>
                      <option value="EST">EST</option>
                      <option value="PST">PST</option>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('language')}</Label>
                    <Select
                      value={hotelSettings.language}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, language: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('address')}</Label>
                    <Input
                      value={hotelSettings.address}
                      onChange={(e) => setHotelSettings({ ...hotelSettings, address: e.target.value })}
                      placeholder={t('addressPlaceholder')}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-[#E7DFD4] flex justify-end">
                  <Button onClick={handleSaveHotelSettings} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="ms-2" />}
                    {common('save')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {active === "reservation" && (
            <div>
              <h3 className="text-lg font-semibold text-[#2F2A25] mb-6">{t('reservationSettings')}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('defaultCheckInTime')}</Label>
                    <Input
                      type="time"
                      value={reservationSettings.defaultCheckInTime}
                      onChange={(e) => setReservationSettings({ ...reservationSettings, defaultCheckInTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('defaultCheckOutTime')}</Label>
                    <Input
                      type="time"
                      value={reservationSettings.defaultCheckOutTime}
                      onChange={(e) => setReservationSettings({ ...reservationSettings, defaultCheckOutTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t('reservationPrefix')}</Label>
                    <Input
                      value={reservationSettings.reservationPrefix}
                      onChange={(e) => setReservationSettings({ ...reservationSettings, reservationPrefix: e.target.value.toUpperCase() })}
                      placeholder="RES"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reservationSettings.autoConfirmReservations}
                      onChange={(e) => setReservationSettings({ ...reservationSettings, autoConfirmReservations: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-[#2F2A25]">{t('autoConfirmReservations')}</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reservationSettings.allowOverbooking}
                      onChange={(e) => setReservationSettings({ ...reservationSettings, allowOverbooking: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-[#2F2A25]">{t('allowOverbooking')}</span>
                  </label>
                </div>
                <div className="pt-4 border-t border-[#E7DFD4] flex justify-end">
                  <Button onClick={handleSaveReservationSettings} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="ms-2" />}
                    {common('save')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {active === "payment" && (
            <div>
              <h3 className="text-lg font-semibold text-[#2F2A25] mb-6">{t('paymentSettings')}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('taxPercentage')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={paymentSettings.taxPercentage}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, taxPercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>{t('depositPercentage')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={paymentSettings.depositPercentage}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, depositPercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t('defaultPaymentMethod')}</Label>
                    <Select
                      value={paymentSettings.defaultPaymentMethod}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, defaultPaymentMethod: e.target.value })}
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                    </Select>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#E7DFD4] flex justify-end">
                  <Button onClick={handleSavePaymentSettings} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="ms-2" />}
                    {common('save')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {active === "system" && (
            <div>
              <h3 className="text-lg font-semibold text-[#2F2A25] mb-6">{t('systemSettings')}</h3>
              <div className="space-y-6">
                {/* Theme */}
                <div>
                  <Label>{t('theme')}</Label>
                  <Select
                    value={systemSettings.theme}
                    onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </Select>
                </div>

                {/* Appearance */}
                <div className="pt-4 border-t border-[#E7DFD4]">
                  <h4 className="text-sm font-medium text-[#6B6258] mb-4">Appearance</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Font Size</Label>
                      <Select
                        value={systemSettings.fontSize}
                        onChange={(e) => setSystemSettings({ ...systemSettings, fontSize: e.target.value })}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </Select>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.compactMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, compactMode: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-[#2F2A25]">Compact Mode</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.sidebarCollapsed}
                        onChange={(e) => setSystemSettings({ ...systemSettings, sidebarCollapsed: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-[#2F2A25]">Sidebar Collapsed</span>
                    </label>
                  </div>
                </div>

                {/* Notifications */}
                <div className="pt-4 border-t border-[#E7DFD4]">
                  <h4 className="text-sm font-medium text-[#6B6258] mb-4">Notifications</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enableNotifications: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <Bell size={16} className="text-text-muted" />
                      <span className="text-sm text-[#2F2A25]">{t('enableNotifications')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableEmailNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enableEmailNotifications: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <Mail size={16} className="text-text-muted" />
                      <span className="text-sm text-[#2F2A25]">{t('enableEmailNotifications')}</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableSoundNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enableSoundNotifications: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <Smartphone size={16} className="text-text-muted" />
                      <span className="text-sm text-[#2F2A25]">Sound Notifications</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableDesktopNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, enableDesktopNotifications: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <Monitor size={16} className="text-text-muted" />
                      <span className="text-sm text-[#2F2A25]">Desktop Notifications</span>
                    </label>
                  </div>
                </div>

                {/* Security */}
                <div className="pt-4 border-t border-[#E7DFD4]">
                  <h4 className="text-sm font-medium text-[#6B6258] mb-4">Security</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Auto Logout Timeout (minutes)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        value={systemSettings.autoLogoutTimeout}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoLogoutTimeout: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={systemSettings.rememberMe}
                        onChange={(e) => setSystemSettings({ ...systemSettings, rememberMe: e.target.checked })}
                        className="w-4 h-4 rounded border-white/20 bg-[#F8F6F2] text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-[#2F2A25]">Remember Me</span>
                    </label>
                  </div>
                </div>

                {/* System */}
                <div className="pt-4 border-t border-[#E7DFD4]">
                  <h4 className="text-sm font-medium text-[#6B6258] mb-4">System Preferences</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Date Format</Label>
                      <Select
                        value={systemSettings.dateFormat}
                        onChange={(e) => setSystemSettings({ ...systemSettings, dateFormat: e.target.value })}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Time Format</Label>
                      <Select
                        value={systemSettings.timeFormat}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timeFormat: e.target.value })}
                      >
                        <option value="12h">12-hour</option>
                        <option value="24h">24-hour</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Default Language</Label>
                      <Select
                        value={systemSettings.defaultLanguage}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultLanguage: e.target.value })}
                      >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Default Currency</Label>
                      <Select
                        value={systemSettings.defaultCurrency}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultCurrency: e.target.value })}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="MAD">MAD (DH)</option>
                        <option value="MAD">MAD (DH)</option>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Default Tax (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={systemSettings.defaultTax}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultTax: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Backup & Restore */}
                <div className="pt-4 border-t border-[#E7DFD4]">
                  <h4 className="text-sm font-medium text-[#6B6258] mb-4">Backup & Restore</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="secondary"
                      onClick={handleCreateBackup}
                      disabled={saving}
                      className="w-full"
                    >
                      <Download size={16} className="ms-2" />
                      Create Backup
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleExportDatabase}
                      disabled={saving}
                      className="w-full"
                    >
                      <Upload size={16} className="ms-2" />
                      Export Database
                    </Button>
                    <div className="sm:col-span-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportDatabase}
                        className="hidden"
                        id="import-file"
                      />
                      <label htmlFor="import-file">
                        <Button
                          variant="secondary"
                          disabled={saving}
                          className="w-full cursor-pointer"
                          onClick={() => document.getElementById('import-file')?.click()}
                        >
                          <RefreshCw size={16} className="ms-2" />
                          Import Database
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7DFD4] flex justify-end">
                  <Button onClick={handleSaveSystemSettings} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="ms-2" />}
                    {common('save')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {active === "room-types" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#2F2A25]">{t('roomTypes')}</h3>
                <Button variant="secondary" size="sm" onClick={() => setShowAddRoomType(true)}>
                  <Plus size={14} className="mr-2" /> {t('addRoomType')}
                </Button>
              </div>
              <div className="space-y-3">
                {roomTypes.map((rt) => {
                  const roomTypeInfo = getRoomTypeInfo(rt.slug);
                  const roomImage = getRoomTypeImage(rt.slug);
                  
                  return (
                  <div key={rt.id} className="flex items-center justify-between rounded-xl border border-[#E7DFD4] bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={roomImage} 
                        alt={rt.name} 
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/room-images/default-room.jpg';
                        }}
                      />
                      <div>
                        <span className="text-sm text-[#2F2A25] font-medium">{roomTypeInfo?.category || rt.name}</span>
                        {roomTypeInfo && (
                          <p className="text-xs text-[#6B6258]">{roomTypeInfo.size} · {roomTypeInfo.bed} · {roomTypeInfo.capacity}</p>
                        )}
                        {!roomTypeInfo && (
                          <p className="text-xs text-[#6B6258]">{t('maxOccupancy')}: {rt.maxOccupancy} · {t('basePrice')}: DH{rt.basePrice}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedRoomType(rt); setShowEditRoomType(true); }}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => { setSelectedRoomType(rt); setShowDeleteConfirm(true); }}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  );
                })}
                {roomTypes.length === 0 && (
                  <p className="text-sm text-[#6B6258]">{t('noRoomTypesFound')}</p>
                )}
              </div>

              {showAddRoomType && (
                <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
                  <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">{t('addRoomType')}</h3>
                    {formError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                        {formError}
                      </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleAddRoomType(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('name')}</label>
                        <input name="name" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="Deluxe King" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('description')}</label>
                        <textarea name="description" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" rows={2} placeholder="Room description" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('basePrice')}</label>
                        <input name="basePrice" type="number" required min="0.01" step="0.01" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="189" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxOccupancy')}</label>
                        <input name="maxOccupancy" type="number" required min="1" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxAdults')}</label>
                        <input name="maxAdults" type="number" required min="1" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="2" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxChildren')}</label>
                        <input name="maxChildren" type="number" min="0" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('amenities')}</label>
                        <input name="amenities" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="Wi-Fi, Minibar, Balcony" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={saving} className="flex-1">{saving ? t('adding') : t('addRoomType')}</Button>
                        <Button type="button" variant="secondary" onClick={() => { setShowAddRoomType(false); setFormError(null); }} disabled={saving}>{common('cancel')}</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showEditRoomType && selectedRoomType && (
                <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
                  <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-4">{t('editRoomType')}</h3>
                    {formError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                        {formError}
                      </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleEditRoomType(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('name')}</label>
                        <input name="name" type="text" required defaultValue={selectedRoomType.name} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('description')}</label>
                        <textarea name="description" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" rows={2} defaultValue={selectedRoomType.description} />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('basePrice')}</label>
                        <input name="basePrice" type="number" required min="0.01" step="0.01" defaultValue={selectedRoomType.basePrice} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxOccupancy')}</label>
                        <input name="maxOccupancy" type="number" required min="1" defaultValue={selectedRoomType.maxOccupancy} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxAdults')}</label>
                        <input name="maxAdults" type="number" required min="1" defaultValue={selectedRoomType.maxAdults} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('maxChildren')}</label>
                        <input name="maxChildren" type="number" min="0" defaultValue={selectedRoomType.maxChildren} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div>
                        <label className="block text-sm text-[#6B6258] mb-1">{t('amenities')}</label>
                        <input name="amenities" type="text" defaultValue={selectedRoomType.amenities} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" disabled={saving} className="flex-1">{saving ? t('updating') : common('update')}</Button>
                        <Button type="button" variant="secondary" onClick={() => { setShowEditRoomType(false); setSelectedRoomType(null); setFormError(null); }} disabled={saving}>{common('cancel')}</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showDeleteConfirm && selectedRoomType && (
                <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
                  <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4">
                    <h3 className="text-lg font-semibold mb-2">{t('deleteRoomType')} {selectedRoomType.name}?</h3>
                    <p className="text-sm text-[#6B6258] mb-4">{t('confirmDelete')}</p>
                    {formError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                        {formError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleDeleteRoomType} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600">{saving ? t('deleting') : common('delete')}</Button>
                      <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedRoomType(null); setFormError(null); }} disabled={saving}>{common('cancel')}</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
