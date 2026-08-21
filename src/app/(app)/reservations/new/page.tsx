"use client";

import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { FilePreviewModal } from "@/components/ui/FilePreviewModal";
import { CompactDocumentCard } from "@/components/ui/CompactDocumentCard";
import { formatCurrency } from "@/lib/utils";
import { CalendarClock, CheckCircle2, User, Loader2, FileText } from "lucide-react";
import { roomTypeService } from "@/services/room-type.service";
import { roomService } from "@/services/room.service";
import { guestService } from "@/services/guest.service";
import { reservationService } from "@/services/reservation.service";
import { identityDocumentService } from "@/services/identityDocument.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import { useTranslation } from "@/contexts/LanguageContext";
import { getRoomTypeImage, getRoomTypeInfo } from "@/lib/roomTypeImages";

export default function NewReservationPage() {
  const { newReservation: t, common, direction } = useTranslation();
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  const [roomType, setRoomType] = useState("");
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);

  // Identity documents state
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    if (roomType && checkIn && checkOut) {
      fetchAvailableRooms();
    }
  }, [roomType, checkIn, checkOut]);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await roomTypeService.getAll();
      setRoomTypes(data.data || []);
      if (data.data && data.data.length > 0) {
        setRoomType(data.data[0].id.toString());
      }
    } catch (err) {
      setError(t('failedToLoadRoomTypes'));
      console.error("Room types error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      const data = await roomService.getAvailableRooms(new Date(checkIn), new Date(checkOut));
      setAvailableRooms(data || []);
    } catch (err) {
      console.error("Available rooms error:", err);
      setAvailableRooms([]);
    }
  };

  const selectedRoomType = roomTypes.find(rt => rt.id.toString() === roomType);
  const selectedRoom = availableRooms[0];

  const nights = useMemo(() => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const subtotal = nights * (selectedRoomType?.basePrice || selectedRoom?.price || 0);
  const taxes = Math.round(subtotal * 0.08);
  const totalBeforeDiscount = subtotal + taxes;
  const totalAfterDiscount = totalBeforeDiscount - discount;
  const totalDue = Math.max(totalAfterDiscount - deposit, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData(e.currentTarget);
      
      // First create or find guest
      const guestData = {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: (formData.get('email') as string) || undefined,
        phoneNumber: (formData.get('phone') as string) || undefined,
        nationality: (formData.get('nationality') as string) || undefined,
        idNumber: (formData.get('idNumber') as string) || undefined,
        address: (formData.get('address') as string) || undefined,
      };

      // Create reservation with guest information
      const roomId = parseInt(formData.get('roomId') as string);
      if (!roomId || isNaN(roomId)) {
        throw new Error(t('pleaseSelectValidRoom'));
      }

      const reservationData = {
        guestId: 0, // Backend will handle guest creation/update
        guestFirstName: guestData.firstName,
        guestLastName: guestData.lastName,
        guestEmail: guestData.email,
        guestPhoneNumber: guestData.phoneNumber,
        guestNationality: guestData.nationality,
        guestIdNumber: guestData.idNumber,
        guestAddress: guestData.address,
        roomId: roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: parseInt(formData.get('adults') as string) || 1,
        children: parseInt(formData.get('children') as string) || 0,
        totalAmount: subtotal + taxes,
        depositAmount: deposit,
        discountAmount: discount,
        paymentMethod: formData.get('paymentMethod') as string,
        status: 'Pending',
        specialRequests: formData.get('specialRequests') as string,
      };

      const reservation = await reservationService.create(reservationData);
      setSelectedReservation(reservation);
      setSubmitted(true);

      // Upload identity documents after reservation is created
      if (uploadedDocuments.length > 0 && reservation.id) {
        try {
          for (const doc of uploadedDocuments) {
            // Find the actual file from the file input
            if (doc.fileData instanceof File) {
              const uploadResult = await identityDocumentService.uploadDocument(
                doc.fileData,
                reservation.id,
                reservation.guest?.id,
                doc.documentType
              );
              console.log('Document uploaded successfully:', uploadResult);
            }
          }
        } catch (err: any) {
          console.error("Failed to upload identity documents:", err);
          // Show error but don't fail the reservation
          setError(`${t('reservationCreated')} but document upload failed: ${err.message || 'Unknown error'}`);
        }
      }
      
      // Emit event to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_CREATED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.PAYMENT_CREATED);
    } catch (err) {
      console.error("Failed to create reservation:", err);
      setError(err instanceof Error ? err.message : t('failedToCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={t('loading')} />
        <div className="glass-card p-6">
          <div className="h-64 animate-pulse bg-gray-200/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={() => { setError(null); fetchRoomTypes(); }}>{common('retry')}</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center glass-card p-10 mt-10 animate-fade-in">
        <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-text-primary">{t('reservationCreated')}</h2>
        <p className="text-sm text-text-secondary mt-2">
          {t('reservation') } {selectedReservation?.reservationNumber} {t('createdSuccessfully')}
        </p>
        <Button className="mt-6" onClick={() => window.location.href = "/reservations"}>
          {t('viewReservations')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="glass-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-purple-300" />
              <h3 className="text-sm font-medium text-text-primary">{t('guestInformation')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t('firstName')}</Label><Input name="firstName" required placeholder={t('placeholderFirstName')} /></div>
              <div><Label>{t('lastName')}</Label><Input name="lastName" required placeholder={t('placeholderLastName')} /></div>
              <div><Label>{t('email')}</Label><Input name="email" type="email" placeholder={t('placeholderEmail')} /></div>
              <div><Label>{t('phone')}</Label><Input name="phone" placeholder={t('placeholderPhone')} /></div>
              <div><Label>{t('nationality')}</Label><Input name="nationality" placeholder={t('placeholderNationality')} /></div>
              <div><Label>{t('passportId')}</Label><Input name="idNumber" required placeholder={t('placeholderIdNumber')} /></div>
              <div className="sm:col-span-2"><Label>{t('address')}</Label><Input name="address" placeholder={t('placeholderAddress')} /></div>
            </div>
            
            {/* Compact Identity Documents Upload */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-purple-300" />
                <h4 className="text-xs font-medium text-text-primary">{t('identityDocuments')}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <CompactDocumentCard
                  title={t('nationalIdFront')}
                  documentType="NationalIdFront"
                  uploadedDocuments={uploadedDocuments}
                  onUpload={(files) => setUploadedDocuments([...uploadedDocuments, ...files])}
                  onDelete={(id) => setUploadedDocuments(uploadedDocuments.filter(d => d.id !== id))}
                  onPreview={(file) => { 
                    const previewFile = {
                      name: file.fileName || file.name || "Document",
                      type: file.fileType || file.type || "application/octet-stream",
                      preview: file.preview || file.url,
                      url: file.url || file.preview
                    };
                    setPreviewFile(previewFile); 
                    setShowPreviewModal(true); 
                  }}
                />
                <CompactDocumentCard
                  title={t('nationalIdBack')}
                  documentType="NationalIdBack"
                  uploadedDocuments={uploadedDocuments}
                  onUpload={(files) => setUploadedDocuments([...uploadedDocuments, ...files])}
                  onDelete={(id) => setUploadedDocuments(uploadedDocuments.filter(d => d.id !== id))}
                  onPreview={(file) => { 
                    const previewFile = {
                      name: file.fileName || file.name || "Document",
                      type: file.fileType || file.type || "application/octet-stream",
                      preview: file.preview || file.url,
                      url: file.url || file.preview
                    };
                    setPreviewFile(previewFile); 
                    setShowPreviewModal(true); 
                  }}
                />
                <CompactDocumentCard
                  title={t('passport')}
                  documentType="Passport"
                  uploadedDocuments={uploadedDocuments}
                  onUpload={(files) => setUploadedDocuments([...uploadedDocuments, ...files])}
                  onDelete={(id) => setUploadedDocuments(uploadedDocuments.filter(d => d.id !== id))}
                  onPreview={(file) => { 
                    const previewFile = {
                      name: file.fileName || file.name || "Document",
                      type: file.fileType || file.type || "application/octet-stream",
                      preview: file.preview || file.url,
                      url: file.url || file.preview
                    };
                    setPreviewFile(previewFile); 
                    setShowPreviewModal(true); 
                  }}
                  optional
                />
              </div>
            </div>
          </section>

          <section className="glass-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={16} className="text-purple-300" />
              <h3 className="text-sm font-medium text-text-primary">{t('bookingDetails')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t('checkIn')}</Label><Input name="checkIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required /></div>
              <div><Label>{t('checkOut')}</Label><Input name="checkOut" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required /></div>
              <div><Label>{t('adults')}</Label><Input name="adults" type="number" min={1} defaultValue={2} required /></div>
              <div><Label>{t('children')}</Label><Input name="children" type="number" min={0} defaultValue={0} /></div>
              <div>
                <Label>{t('roomType')}</Label>
                <Select name="roomType" className="w-full" value={roomType} onChange={(e) => setRoomType(e.target.value)} required>
                  {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>{t('availableRooms')}</Label>
                <Select name="roomId" className="w-full" required>
                  {availableRooms.length === 0 && <option>{t('noRoomsAvailable')}</option>}
                  {availableRooms.map((r) => {
                    const roomImage = getRoomTypeImage(r.roomType?.id);
                    return (
                      <option key={r.id} value={r.id}>{t('room')} {r.roomNumber} · {t('floor')} {r.floor} · {getRoomTypeInfo(r.roomType?.id)?.category || r.roomType?.name}</option>
                    );
                  })}
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>{t('specialRequests')}</Label><Input name="specialRequests" placeholder={t('placeholderSpecialRequests')} /></div>
            </div>
          </section>

          <section className="glass-card p-5 sm:p-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">{t('payment')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>{t('paymentMethod')}</Label>
                <Select name="paymentMethod" className="w-full" defaultValue="Cash">
                  <option>{t('cash')}</option><option>{t('visa')}</option><option>{t('mastercard')}</option>
                  <option>{t('stripe')}</option><option>{t('paypal')}</option><option>{t('bankTransfer')}</option>
                </Select>
              </div>
              <div><Label>{t('depositWithCurrency')}</Label><Input name="deposit" type="number" min={0} value={deposit} onChange={(e) => setDeposit(Number(e.target.value) || 0)} /></div>
              <div><Label>{t('discountWithCurrency')}</Label><Input name="discount" type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} /></div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-5 sm:p-6 sticky top-20 space-y-4">
            <h3 className="text-sm font-medium text-text-primary">{t('priceSummary')}</h3>
            {selectedRoomType && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden">
                <img 
                  src={getRoomTypeImage(selectedRoomType.id)} 
                  alt={selectedRoomType.name} 
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="p-3 text-sm text-text-secondary space-y-2">
                  <p className="text-text-primary font-medium">{getRoomTypeInfo(selectedRoomType.id)?.category || selectedRoomType.name}</p>
                  {getRoomTypeInfo(selectedRoomType.id) && (
                    <>
                      <p className="text-xs">{getRoomTypeInfo(selectedRoomType.id)?.size} · {getRoomTypeInfo(selectedRoomType.id)?.bed}</p>
                      <p className="text-xs">{getRoomTypeInfo(selectedRoomType.id)?.capacity}</p>
                    </>
                  )}
                </div>
              </div>
            )}
            {!selectedRoomType && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-sm text-text-secondary">
                <p className="text-text-primary font-medium">{t('selectRoomType')}</p>
              </div>
            )}
            {selectedRoomType && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-sm text-text-secondary">
                <p className="text-xs mt-0.5">{formatCurrency(selectedRoomType?.basePrice || 0)} {t('perNight')} · {nights} {t('nightsFormat').replace('{nights}', nights.toString()).replace('{s}', nights === 1 ? '' : 's')}</p>
              </div>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-secondary">{t('subtotal')}</dt><dd className="font-mono text-text-primary">{formatCurrency(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">{t('taxesPercent')}</dt><dd className="font-mono text-text-primary">{formatCurrency(taxes)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">{t('discount')}</dt><dd className="font-mono text-red-300">-{formatCurrency(discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">{t('totalBeforeDeposit')}</dt><dd className="font-mono text-text-primary">{formatCurrency(totalAfterDiscount)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">{t('depositPaid')}</dt><dd className="font-mono text-emerald-300">-{formatCurrency(deposit)}</dd></div>
            </dl>
            <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
              <span className="text-sm text-text-secondary">{t('totalDue')}</span>
              <span className="text-xl font-semibold text-text-primary font-mono">{formatCurrency(totalDue)}</span>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting || availableRooms.length === 0}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : t('confirmReservation')}
            </Button>
            <Button type="button" variant="secondary" className="w-full" disabled>{t('saveAsDraft')}</Button>
          </div>
        </div>
      </form>

      {/* File Preview Modal */}
      {showPreviewModal && previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
        />
      )}
    </div>
  );
}
