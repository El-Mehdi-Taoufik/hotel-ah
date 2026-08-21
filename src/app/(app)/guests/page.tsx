"use client";

import { useMemo, useState, useEffect } from "react";
import { Download, Eye, Mail, Phone, Star, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, initials } from "@/lib/utils";
import { guestService } from "@/services/guest.service";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from "@/contexts/LanguageContext";

export default function GuestsPage() {
  const { guests: t, common, isLoaded, direction } = useTranslation();
  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getAll();
      setGuests(data.data || []);
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Guests error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      guests.filter((g) =>
        `${g.firstName} ${g.lastName} ${g.email} ${g.nationality}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query, guests]
  );

  const handleAddGuest = async (guestData: any) => {
    try {
      setProcessing(true);
      await guestService.create(guestData);
      await fetchGuests();
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add guest:", err);
      setError(t('failedToAdd'));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditGuest = async (guestData: any) => {
    try {
      setProcessing(true);
      const updateData = {
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        phoneNumber: guestData.phoneNumber,
        nationality: guestData.nationality,
        idNumber: guestData.idNumber || selectedGuest.idNumber || selectedGuest.passportNumber,
        address: guestData.address || selectedGuest.address,
        isVip: guestData.isVip
      };
      await guestService.update(selectedGuest.id, updateData);
      await fetchGuests();
      setShowEditModal(false);
      setSelectedGuest(null);
    } catch (err) {
      console.error("Failed to update guest:", err);
      setError(t('failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteGuest = async () => {
    try {
      setProcessing(true);
      const result = await guestService.delete(selectedGuest.id);
      
      if (!result.success) {
        setError(result.message || t('failedToDelete'));
        return;
      }
      
      await fetchGuests();
      setShowDeleteConfirm(false);
      setSelectedGuest(null);
      setError(null);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = `fixed bottom-4 px-4 py-2 rounded-lg text-sm z-50 bg-green-500 text-white`;
      toast.style[direction === 'rtl' ? 'left' : 'right'] = '1rem';
      toast.style[direction === 'rtl' ? 'right' : 'left'] = 'auto';
      toast.textContent = t('guestDeletedSuccessfully');
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err) {
      console.error("Failed to delete guest:", err);
      setError(t('failedToDelete'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={isLoaded ? t('title') : t('title')} subtitle={common('loading')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm h-40 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchGuests}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={`${guests.length} ${t('guestProfiles')}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => {
              // Export guests to Excel
              try {
                const currentDate = new Date().toISOString().split('T')[0];
                
                const excelData = filtered.map((g) => ({
                  [t('id')]: g.id,
                  [t('firstName')]: g.firstName,
                  [t('lastName')]: g.lastName,
                  [t('email')]: g.email,
                  [t('phoneNumber')]: g.phoneNumber,
                  [t('nationality')]: g.nationality,
                  [t('passportNumber')]: g.passportNumber || '',
                  [t('address')]: g.address || '',
                  [t('vipStatus')]: g.isVip ? t('yes') : t('no'),
                  [t('totalStays')]: g.totalStays,
                  [t('totalSpent')]: g.totalSpent,
                  [t('createdAt')]: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''
                }));

                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');
                
                const wscols = [
                  { wch: 8 },  // ID
                  { wch: 20 }, // First Name
                  { wch: 20 }, // Last Name
                  { wch: 30 }, // Email
                  { wch: 15 }, // Phone
                  { wch: 15 }, // Nationality
                  { wch: 20 }, // Passport/ID
                  { wch: 30 }, // Address
                  { wch: 10 }, // VIP Status
                  { wch: 12 }, // Total Stays
                  { wch: 12 }, // Total Spent
                  { wch: 15 }, // Created Date
                ];
                worksheet['!cols'] = wscols;

                XLSX.writeFile(workbook, `Guests_${currentDate}.xlsx`);
              } catch (error) {
                console.error("Export error:", error);
                setError(t('failedToExport'));
              }
            }}><Download size={15} /> {t('export')}</Button>
            <Button onClick={() => setShowAddModal(true)}><Plus size={16} className="ms-2" /> {t('addGuest')}</Button>
          </>
        }
      />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 sm:p-5">
        <SearchInput placeholder={t('searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((g) => (
          <div key={g.id} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm card-lift p-5 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-sm font-semibold text-white">
                  {initials(`${g.firstName} ${g.lastName}`)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2F2A25] flex items-center gap-1.5">
                    {g.firstName} {g.lastName}
                    {g.isVip && <Star size={12} className="text-amber-400 fill-amber-400" />}
                  </p>
                  <p className="text-xs text-[#6B6258]">{g.nationality}</p>
                </div>
              </div>
              {g.isVip && (
                <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {t('vip')}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-[#6B6258]">
              <p className="flex items-center gap-1.5 truncate"><Mail size={12} /> {g.email}</p>
              <p className="flex items-center gap-1.5"><Phone size={12} /> {g.phoneNumber}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E7DFD4] text-xs">
              <div>
                <p className="text-text-muted">{t('totalStays')}</p>
                <p className="text-[#2F2A25] font-mono font-medium">{g.totalStays}</p>
              </div>
              <div className={direction === 'rtl' ? 'text-start' : 'text-end'}>
                <p className="text-text-muted">{t('totalSpent')}</p>
                <p className="text-[#2F2A25] font-mono font-medium">{formatCurrency(g.totalSpent)}</p>
              </div>
              <div className="flex gap-1">
                <button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-[#2F2A25] hover:bg-white/10 flex items-center justify-center shrink-0" aria-label={t('viewProfile')} onClick={() => { setSelectedGuest(g); setShowEditModal(true); }}>
                  <Eye size={14} />
                </button>
                <button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center shrink-0" aria-label={t('delete')} onClick={() => { setSelectedGuest(g); setShowDeleteConfirm(true); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('addNewGuest')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddGuest(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('firstName')}</label>
                <input name="firstName" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('firstNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('lastName')}</label>
                <input name="lastName" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('lastNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('email')}</label>
                <input name="email" type="email" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('emailPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('phoneNumber')}</label>
                <input name="phoneNumber" type="tel" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('phonePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('nationality')}</label>
                <input name="nationality" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('nationalityPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('cinPassportNumber')}</label>
                <input name="idNumber" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('cinPassportPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('address')}</label>
                <input name="address" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('addressPlaceholder')} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isVip" id="isVip" className="rounded" />
                <label htmlFor="isVip" className="text-sm text-[#6B6258]">{t('vipGuest')}</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('adding') : t('addGuest')}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {showEditModal && selectedGuest && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('editGuest').replace('{name}', `${selectedGuest.firstName} ${selectedGuest.lastName}`)}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditGuest(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('firstName')}</label>
                <input name="firstName" type="text" required defaultValue={selectedGuest.firstName} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('lastName')}</label>
                <input name="lastName" type="text" required defaultValue={selectedGuest.lastName} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('email')}</label>
                <input name="email" type="email" defaultValue={selectedGuest.email} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('phoneNumber')}</label>
                <input name="phoneNumber" type="tel" defaultValue={selectedGuest.phoneNumber} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('nationality')}</label>
                <input name="nationality" type="text" defaultValue={selectedGuest.nationality} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('cinPassportNumber')}</label>
                <input name="idNumber" type="text" defaultValue={selectedGuest.idNumber || selectedGuest.passportNumber || ''} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('address')}</label>
                <input name="address" type="text" defaultValue={selectedGuest.address || ''} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isVip" id="isVip" className="rounded" defaultChecked={selectedGuest.isVip} />
                <label htmlFor="isVip" className="text-sm text-[#6B6258]">{t('vipGuest')}</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('updating') : t('updateGuest')}</Button>
                <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedGuest(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
              <div className="pt-2 border-t border-[#E7DFD4]">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/guest-profiles/guest/${selectedGuest.id}`, {
                        headers: {
                          ...(token && { Authorization: `Bearer ${token}` }),
                        },
                      });
                      
                      if (!response.ok) {
                        throw new Error(t('failedToGenerateGuestProfilePdf'));
                      }
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `GuestProfile_${selectedGuest.firstName}_${selectedGuest.lastName}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error("PDF generation error:", error);
                      setError(t('failedToGenerateGuestProfilePdf'));
                    }
                  }}
                >
                  <Download size={15} className="me-2" /> {t('downloadPdf')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedGuest && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('deleteGuest').replace('{name}', `${selectedGuest.firstName} ${selectedGuest.lastName}`)}</h3>
            <p className="text-sm text-[#6B6258] mb-4">{t('confirmDelete')}</p>
            <div className="flex gap-2">
              <Button onClick={handleDeleteGuest} disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600">{processing ? t('deleting') : common('delete')}</Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedGuest(null); }} disabled={processing}>{common('cancel')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
