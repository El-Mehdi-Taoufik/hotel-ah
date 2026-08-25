"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Download, Eye, Mail, Phone, Star, Plus, Trash2, Image as ImageIcon, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, initials } from "@/lib/utils";
import { guestService } from "@/services/guest.service";
import { reservationService } from "@/services/reservation.service";
import { paymentService } from "@/services/payment.service";
import { exportGuestProfilePdf } from "@/lib/pdf-exports";
import * as XLSX from "xlsx";
import { useTranslation } from "@/contexts/LanguageContext";

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function GuestsClient() {
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
  const [idImage, setIdImage] = useState<string | null>(null);
  const [newIdImage, setNewIdImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => { fetchGuests(); }, []);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getAll();
      setGuests(data.data || []);
    } catch (err) {
      console.error("Guests error:", err);
      setError(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => guests.filter((g) =>
    `${g.firstName} ${g.lastName} ${g.email ?? ""} ${g.nationality ?? ""}`.toLowerCase().includes(query.toLowerCase())
  ), [query, guests]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The ID image must be smaller than 5 MB.");
      return;
    }
    setError(null);
    setNewIdImage(await fileToDataUrl(file));
  };

  const handleAddGuest = async (guestData: any) => {
    const image = guestData.idImage as string | undefined;
    delete guestData.idImage;
    try {
      setProcessing(true);
      const guest = await guestService.create(guestData);
      if (image) await guestService.uploadIdImage(guest.id, image);
      await fetchGuests();
      setShowAddModal(false);
      setNewIdImage(null);
    } catch (err) {
      console.error("Failed to add guest:", err);
      setError(t("failedToAdd"));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditGuest = async (guestData: any) => {
    const image = guestData.idImage as string | undefined;
    delete guestData.idImage;
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
        isVip: guestData.isVip === "on" || guestData.isVip === true,
      };
      await guestService.update(selectedGuest.id, updateData);
      if (image) await guestService.uploadIdImage(selectedGuest.id, image);
      await fetchGuests();
      setShowEditModal(false);
      setSelectedGuest(null);
      setIdImage(null);
      setNewIdImage(null);
    } catch (err) {
      console.error("Failed to update guest:", err);
      setError(t("failedToUpdate"));
    } finally {
      setProcessing(false);
    }
  };

  const openEdit = async (guest: any) => {
    setSelectedGuest(guest);
    setShowEditModal(true);
    setNewIdImage(null);
    setLoadingImage(true);
    try { setIdImage(await guestService.getIdImage(guest.id)); }
    catch (err) { console.error("Failed to load ID image:", err); setIdImage(null); }
    finally { setLoadingImage(false); }
  };

  const handleDeleteImage = async () => {
    if (!selectedGuest) return;
    try {
      setProcessing(true);
      await guestService.deleteIdImage(selectedGuest.id);
      setIdImage(null);
      setNewIdImage(null);
    } catch (err) {
      console.error("Failed to delete ID image:", err);
      setError("Failed to delete ID image.");
    } finally { setProcessing(false); }
  };

  const downloadProfile = async () => {
    if (!selectedGuest) return;
    try {
      setProcessing(true);
      const reservations = await reservationService.getByGuestId(selectedGuest.id);
      const allPayments = await paymentService.getAll();
      const reservationIds = new Set(reservations.map((r: any) => r.id));
      const payments = (allPayments.data || []).filter((p: any) => reservationIds.has(p.reservation?.id));
      const image = await guestService.getIdImage(selectedGuest.id);
      exportGuestProfilePdf(selectedGuest, reservations, payments, image);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(t("failedToGenerateGuestProfilePdf"));
    } finally { setProcessing(false); }
  };

  const handleDeleteGuest = async () => {
    try {
      setProcessing(true);
      const result = await guestService.delete(selectedGuest.id);
      if (!result.success) { setError(result.message || t("failedToDelete")); return; }
      await fetchGuests();
      setShowDeleteConfirm(false);
      setSelectedGuest(null);
      setError(null);
    } catch (err) {
      console.error("Failed to delete guest:", err);
      setError(t("failedToDelete"));
    } finally { setProcessing(false); }
  };

  const exportExcel = () => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const excelData = filtered.map((g) => ({
        [t("id")]: g.id,
        [t("firstName")]: g.firstName,
        [t("lastName")]: g.lastName,
        [t("email")]: g.email,
        [t("phoneNumber")]: g.phoneNumber,
        [t("nationality")]: g.nationality,
        [t("passportNumber")]: g.passportNumber || "",
        [t("address")]: g.address || "",
        [t("vipStatus")]: g.isVip ? t("yes") : t("no"),
        [t("totalStays")]: g.totalStays,
        [t("totalSpent")]: g.totalSpent,
        [t("createdAt")]: g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");
      XLSX.writeFile(workbook, `Guests_${currentDate}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
      setError(t("failedToExport"));
    }
  };

  if (loading || !isLoaded) return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={common("loading")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm h-40 animate-pulse" />)}</div>
    </div>
  );

  if (error && guests.length === 0) return (
    <div className="space-y-6"><PageHeader title={t("title")} subtitle={error} /><Button onClick={fetchGuests}>{common("retry")}</Button></div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={`${guests.length} ${t("guestProfiles")}`} actions={<>
        <Button variant="secondary" onClick={exportExcel}><Download size={15} /> {t("export")}</Button>
        <Button onClick={() => { setNewIdImage(null); setShowAddModal(true); }}><Plus size={16} className="ms-2" /> {t("addGuest")}</Button>
      </>} />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}<button className="float-end" onClick={() => setError(null)}><X size={15} /></button></div>}
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 sm:p-5"><SearchInput placeholder={t("searchPlaceholder")} value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((g) => <div key={g.id} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm card-lift p-5 space-y-4 animate-fade-in">
          <div className="flex items-start justify-between"><div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-sm font-semibold text-white">{initials(`${g.firstName} ${g.lastName}`)}</div>
            <div><p className="text-sm font-medium text-[#2F2A25] flex items-center gap-1.5">{g.firstName} {g.lastName}{g.isVip && <Star size={12} className="text-amber-400 fill-amber-400" />}</p><p className="text-xs text-[#6B6258]">{g.nationality}</p></div>
          </div>{g.isVip && <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30">{t("vip")}</span>}</div>
          <div className="space-y-1.5 text-xs text-[#6B6258]"><p className="flex items-center gap-1.5 truncate"><Mail size={12} /> {g.email}</p><p className="flex items-center gap-1.5"><Phone size={12} /> {g.phoneNumber}</p></div>
          <div className="flex items-center justify-between pt-3 border-t border-[#E7DFD4] text-xs"><div><p className="text-text-muted">{t("totalStays")}</p><p className="text-[#2F2A25] font-mono font-medium">{g.totalStays}</p></div><div className={direction === "rtl" ? "text-start" : "text-end"}><p className="text-text-muted">{t("totalSpent")}</p><p className="text-[#2F2A25] font-mono font-medium">{formatCurrency(g.totalSpent)}</p></div><div className="flex gap-1"><button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-[#2F2A25] flex items-center justify-center shrink-0" aria-label={t("viewProfile")} onClick={() => openEdit(g)}><Eye size={14} /></button><button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-red-300 flex items-center justify-center shrink-0" aria-label={t("delete")} onClick={() => { setSelectedGuest(g); setShowDeleteConfirm(true); }}><Trash2 size={14} /></button></div></div>
        </div>)}
      </div>

      {showAddModal && <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50 overflow-y-auto"><div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4 my-6"><h3 className="text-lg font-semibold mb-4">{t("addNewGuest")}</h3><form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const file = fd.get("idImage") as File; const data: any = Object.fromEntries(fd); if (file?.size) data.idImage = await fileToDataUrl(file); else delete data.idImage; await handleAddGuest(data); }} className="space-y-4">
        <GuestField label={t("firstName")} name="firstName" required placeholder={t("firstNamePlaceholder")} /><GuestField label={t("lastName")} name="lastName" required placeholder={t("lastNamePlaceholder")} /><GuestField label={t("email")} name="email" type="email" placeholder={t("emailPlaceholder")} /><GuestField label={t("phoneNumber")} name="phoneNumber" type="tel" placeholder={t("phonePlaceholder")} /><GuestField label={t("nationality")} name="nationality" placeholder={t("nationalityPlaceholder")} /><GuestField label={t("cinPassportNumber")} name="idNumber" placeholder={t("cinPassportPlaceholder")} /><GuestField label={t("address")} name="address" placeholder={t("addressPlaceholder")} />
        <ImageUpload label="CIN / Passport image" name="idImage" preview={newIdImage} onChange={async (e) => { await handleFile(e.target.files?.[0]); }} />
        <label className="flex items-center gap-2 text-sm text-[#6B6258]"><input type="checkbox" name="isVip" className="rounded" />{t("vipGuest")}</label>
        <div className="flex gap-2 pt-2"><Button type="submit" disabled={processing} className="flex-1">{processing ? t("adding") : t("addGuest")}</Button><Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>{common("cancel")}</Button></div>
      </form></div></div>}

      {showEditModal && selectedGuest && <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50 overflow-y-auto"><div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4 my-6"><h3 className="text-lg font-semibold mb-4">{t("editGuest").replace("{name}", `${selectedGuest.firstName} ${selectedGuest.lastName}`)}</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const file = fd.get("idImage") as File; const data: any = Object.fromEntries(fd); if (file?.size) data.idImage = await fileToDataUrl(file); else delete data.idImage; await handleEditGuest(data); }} className="space-y-4">
          <GuestField label={t("firstName")} name="firstName" required defaultValue={selectedGuest.firstName} /><GuestField label={t("lastName")} name="lastName" required defaultValue={selectedGuest.lastName} /><GuestField label={t("email")} name="email" type="email" defaultValue={selectedGuest.email || ""} /><GuestField label={t("phoneNumber")} name="phoneNumber" type="tel" defaultValue={selectedGuest.phoneNumber || ""} /><GuestField label={t("nationality")} name="nationality" defaultValue={selectedGuest.nationality || ""} /><GuestField label={t("cinPassportNumber")} name="idNumber" defaultValue={selectedGuest.idNumber || selectedGuest.passportNumber || ""} /><GuestField label={t("address")} name="address" defaultValue={selectedGuest.address || ""} />
          <div className="space-y-2"><p className="text-sm font-medium text-[#2F2A25]">CIN / Passport image</p>{loadingImage ? <p className="text-xs text-[#6B6258]">Loading image...</p> : (newIdImage || idImage) ? <div className="relative border border-[#E7DFD4] rounded-lg p-2"><img src={newIdImage || idImage || ""} alt="Guest ID document" className="w-full max-h-44 object-contain rounded" /><button type="button" onClick={() => { if (newIdImage) setNewIdImage(null); else handleDeleteImage(); }} className="absolute top-2 end-2 bg-white/90 rounded-full p-1 text-red-500" title="Remove"><X size={14} /></button></div> : null}<input name="idImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => handleFile(e.target.files?.[0])} className="w-full text-sm" /><p className="text-xs text-[#6B6258]">JPG, PNG or WebP, maximum 5 MB.</p></div>
          <label className="flex items-center gap-2 text-sm text-[#6B6258]"><input type="checkbox" name="isVip" className="rounded" defaultChecked={selectedGuest.isVip} />{t("vipGuest")}</label>
          <div className="flex gap-2 pt-2"><Button type="submit" disabled={processing} className="flex-1">{processing ? t("updating") : t("updateGuest")}</Button><Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedGuest(null); }} disabled={processing}>{common("cancel")}</Button></div>
          <div className="pt-2 border-t border-[#E7DFD4] space-y-2"><Button type="button" variant="secondary" className="w-full" onClick={downloadProfile} disabled={processing}><Download size={15} className="me-2" /> {t("downloadPdf")}</Button></div>
        </form>
      </div></div>}

      {showDeleteConfirm && selectedGuest && <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50"><div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4"><h3 className="text-lg font-semibold mb-2">{t("deleteGuest").replace("{name}", `${selectedGuest.firstName} ${selectedGuest.lastName}`)}</h3><p className="text-sm text-[#6B6258] mb-4">{t("confirmDelete")}</p><div className="flex gap-2"><Button onClick={handleDeleteGuest} disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600">{processing ? t("deleting") : common("delete")}</Button><Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedGuest(null); }} disabled={processing}>{common("cancel")}</Button></div></div></div>}
    </div>
  );
}

function GuestField({ label, name, type = "text", required, placeholder, defaultValue }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string }) {
  return <div><label className="block text-sm text-[#6B6258] mb-1">{label}</label><input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" /></div>;
}

function ImageUpload({ label, name, preview, onChange }: { label: string; name: string; preview: string | null; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return <div className="space-y-2"><label className="block text-sm text-[#6B6258] mb-1">{label}</label>{preview && <div className="border border-[#E7DFD4] rounded-lg p-2"><img src={preview} alt="ID document preview" className="w-full max-h-40 object-contain rounded" /></div>}<div className="flex items-center gap-2"><ImageIcon size={16} className="text-[#6B6258]" /><input name={name} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="w-full text-sm" /></div><p className="text-xs text-[#6B6258]">JPG, PNG or WebP, maximum 5 MB.</p></div>;
}
