"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Eye, FileText, Pencil, Printer, Calendar, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReservationStatus } from "@/lib/types";
import { reservationService } from "@/services/reservation.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import { useTranslation } from "@/contexts/LanguageContext";
import { getRoomTypeImage, getRoomTypeInfo } from "@/lib/roomTypeImages";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const statuses: (ReservationStatus | "All")[] = [
  "All",
  "Pending",
  "Confirmed",
  "CheckedIn",
  "CheckedOut",
  "Cancelled",
  "NoShow"
];

export default function ReservationsPage() {
  const { reservations: t, common, direction } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReservations();

    // Listen for events that should refresh the reservations list
    const handleRefresh = () => {
      fetchReservations();
    };

    eventEmitter.on(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.DASHBOARD_REFRESH, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_DELETED, handleRefresh);

    return () => {
      eventEmitter.off(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.DASHBOARD_REFRESH, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_DELETED, handleRefresh);
    };
  }, [currentPage, status, query]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Process automatic check-outs first
      try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reservations/auto-checkout`, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
      } catch (autoCheckOutError) {
        console.warn('Auto check-out failed:', autoCheckOutError);
      }
      
      // Use search API when there's a query, otherwise use paginated API
      if (query) {
        const data = await reservationService.search(query);
        setReservations(data.data || []);
        setTotalPages(1); // Search doesn't support pagination yet
      } else {
        const data = await reservationService.getAll(currentPage, 10, status === "All" ? undefined : status);
        setReservations(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Reservations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (reservationId: number) => {
    try {
      setProcessing(true);
      await reservationService.updateStatus(reservationId, t('statusCheckedIn'));
      await fetchReservations();
      
      // Emit events to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (err) {
      console.error("Failed to check in:", err);
      setError(t('failedToCheckIn'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async (reservationId: number) => {
    try {
      setProcessing(true);
      await reservationService.updateStatus(reservationId, t('statusCheckedOut'));
      await fetchReservations();
      
      // Emit events to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (err) {
      console.error("Failed to check out:", err);
      setError(t('failedToCheckOut'));
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (reservationId: number) => {
    try {
      setProcessing(true);
      await reservationService.updateStatus(reservationId, t('cancelled'));
      await fetchReservations();
    } catch (err) {
      console.error("Failed to cancel:", err);
      setError(t('failedToCancel'));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = async (reservation: any) => {
    setSelectedReservation(reservation);
    setShowPrintModal(true);
  };

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('print-receipt');
      if (!element || !selectedReservation) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Reservation-${selectedReservation.reservationNumber}.pdf`);

      // Show success toast
      const toast = document.createElement('div');
      toast.className = `fixed bottom-4 px-4 py-2 rounded-lg text-sm z-50 bg-green-500 text-white`;
      toast.style.right = '1rem';
      toast.style.left = 'auto';
      toast.textContent = t('reservationPdfDownloadedSuccessfully') || 'Reservation PDF downloaded successfully';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      setShowPrintModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('PDF generation error:', error);
      setError(t('failedToGeneratePDF'));
    }
  };

  const handleUpdate = async (reservationData: any) => {
    try {
      setProcessing(true);
      const updateData = {
        guestId: selectedReservation.guestId,
        roomId: selectedReservation.roomId,
        checkInDate: reservationData.checkInDate,
        checkOutDate: reservationData.checkOutDate,
        adults: parseInt(reservationData.adults),
        children: parseInt(reservationData.children) || 0,
        totalAmount: selectedReservation.totalAmount,
        discountAmount: parseFloat(reservationData.discountAmount) || 0,
        depositAmount: parseFloat(reservationData.depositAmount) || 0,
        paymentMethod: reservationData.paymentMethod || 'Cash',
        specialRequests: reservationData.specialRequests,
      };
      await reservationService.update(selectedReservation.id, updateData);
      await fetchReservations();
      setShowEditModal(false);
      setSelectedReservation(null);
      
      // Emit events to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_UPDATED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (err) {
      console.error("Failed to update reservation:", err);
      setError(t('failedToUpdate'));
    } finally {
      setProcessing(false);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const hotelName = t('hotelName');
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Add title
      doc.setFontSize(20);
      doc.text(hotelName, 14, 20);
      
      doc.setFontSize(16);
      doc.text(t('reservationsReport'), 14, 32);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${t('generated')}: ${currentDate}`, 14, 42);
      doc.text(`${t('totalReservations')}: ${reservations.length}`, 14, 50);

      // Prepare table data
      const tableData = reservations.map((r) => [
        r.reservationNumber,
        `${r.guest?.firstName} ${r.guest?.lastName}`,
        r.rooms?.[0]?.number || 'N/A',
        formatDate(r.checkInDate),
        formatDate(r.checkOutDate),
        `${r.adults} ${t('adults')}, ${r.children} ${t('children')}`,
        r.status,
        r.paymentStatus || t('pending'),
        formatCurrency(r.totalAmount)
      ]);

      // Add table
      autoTable(doc, {
        startY: 60,
        head: [[t('reservationId'), t('guestName'), t('room'), t('checkIn'), t('checkOut'), t('guests'), common('status'), t('payment'), common('total')]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        }
      });

      // Save the PDF
      const fileName = `Reservations_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF export error:", error);
      setError(t('failedToGeneratePDF'));
    }
  };

  const generateInvoicePDF = (reservation: any) => {
    try {
      const doc = new jsPDF();
      const r = reservation;
      
      doc.setFontSize(18);
      doc.text(t('hotelName'), 14, 20);
      
      doc.setFontSize(14);
      doc.text(t('invoice'), 14, 35);
      
      doc.setFontSize(10);
      doc.text(`${t('reservationNumber')}: ${r.reservationNumber}`, 14, 50);
      doc.text(`${t('guestName')}: ${r.guest?.firstName} ${r.guest?.lastName}`, 14, 58);
      doc.text(`${t('room')}: ${r.rooms?.[0]?.number || 'N/A'}`, 14, 66);
      doc.text(`${t('checkIn')}: ${formatDate(r.checkInDate)}`, 14, 74);
      doc.text(`${t('checkOut')}: ${formatDate(r.checkOutDate)}`, 14, 82);
      doc.text(`${common('status')}: ${r.status}`, 14, 90);
      doc.text(`${t('totalAmount')}: ${formatCurrency(r.totalAmount)}`, 14, 98);
      
      doc.save(`Invoice_${r.reservationNumber}.pdf`);
    } catch (error) {
      console.error("Invoice generation error:", error);
      setError(t('failedToGenerateInvoice'));
    }
  };

  const exportToExcel = () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Prepare data for Excel
      const excelData = reservations.map((r) => ({
        [t('reservationId')]: r.reservationNumber,
        [t('guestName')]: `${r.guest?.firstName} ${r.guest?.lastName}`,
        [t('guestEmail')]: r.guest?.email || '',
        [t('guestPhone')]: r.guest?.phoneNumber || '',
        [t('roomNumber')]: r.rooms?.[0]?.number || 'N/A',
        [t('roomFloor')]: r.rooms?.[0]?.floor || 'N/A',
        [t('checkInDate')]: formatDate(r.checkInDate),
        [t('checkOutDate')]: formatDate(r.checkOutDate),
        [t('adults')]: r.adults,
        [t('children')]: r.children,
        [t('totalGuests')]: r.adults + r.children,
        [common('status')]: r.status,
        [t('paymentStatus')]: r.paymentStatus || t('pending'),
        [t('totalAmount')]: r.totalAmount,
        [t('depositAmount')]: r.depositAmount,
        [t('specialRequests')]: r.specialRequests || '',
        [t('createdDate')]: formatDate(r.createdAt)
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservations');

      // Set column widths
      const wscols = [
        { wch: 20 }, // Reservation ID
        { wch: 25 }, // Guest Name
        { wch: 25 }, // Guest Email
        { wch: 15 }, // Guest Phone
        { wch: 12 }, // Room Number
        { wch: 10 }, // Room Floor
        { wch: 15 }, // Check-In Date
        { wch: 15 }, // Check-Out Date
        { wch: 8 },  // Adults
        { wch: 8 },  // Children
        { wch: 12 }, // Total Guests
        { wch: 12 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 12 }, // Total Amount
        { wch: 12 }, // Deposit Amount
        { wch: 30 }, // Special Requests
        { wch: 15 }, // Created Date
      ];
      worksheet['!cols'] = wscols;

      // Save the Excel file
      const fileName = `Reservations_${currentDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Excel export error:", error);
      setError(t('failedToExportExcel'));
    }
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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchReservations}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={`${reservations.length} ${t('totalBookings')}`}
        actions={
          <Link href="/reservations/new">
            <Button>+ {t('newReservation')}</Button>
          </Link>
        }
      />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setCurrentPage(1);
                // Debounced search
                setTimeout(() => {
                  setQuery(value);
                }, 300);
              }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setCurrentPage(1); }}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? t('allStatuses') : s}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={exportToPDF}>
              <FileText size={15} /> PDF
            </Button>
            <Button variant="secondary" size="md" onClick={exportToExcel}>
              <Download size={15} /> Excel
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full text-sm" dir={direction}>
            <thead>
              <tr className="border-b border-[#E7DFD4] text-start text-xs text-text-muted uppercase tracking-wide">
                <th className="ps-4 sm:ps-5 pe-3 py-3 font-medium">{t('reservation')}</th>
                <th className="px-4 py-3 font-medium">{t('guest')}</th>
                <th className="px-4 py-3 font-medium">{t('room')}</th>
                <th className="px-4 py-3 font-medium">{t('checkIn')}</th>
                <th className="px-4 py-3 font-medium">{t('checkOut')}</th>
                <th className="px-4 py-3 font-medium">{t('guests')}</th>
                <th className="px-4 py-3 font-medium">{common('status')}</th>
                <th className="px-4 py-3 font-medium">{t('payment')}</th>
                <th className={`px-4 py-3 font-medium ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>{t('price')}</th>
                <th className={`ps-3 pe-4 sm:pe-5 py-3 font-medium ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="ps-4 sm:ps-5 pe-3 py-3 font-mono text-xs text-purple-300">{r.reservationNumber}</td>
                  <td className="px-4 py-3 text-[#2F2A25] whitespace-nowrap">{r.guest?.firstName} {r.guest?.lastName}</td>
                  <td className="px-4 py-3 text-[#2F2A25] whitespace-nowrap">
                    {r.room ? (
                      <div>
                        <div className="font-medium">{t('room')} {r.room.roomNumber}</div>
                        <div className="text-xs text-[#6B6258]">{getRoomTypeInfo(r.room.roomType?.id)?.category || r.room.roomType?.name || t('unknown')}</div>
                      </div>
                    ) : (
                      <span className="text-[#6B6258] italic">{t('unassigned')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#6B6258] whitespace-nowrap">{formatDate(r.checkInDate)}</td>
                  <td className="px-4 py-3 text-[#6B6258] whitespace-nowrap">{formatDate(r.checkOutDate)}</td>
                  <td className="px-4 py-3 text-[#6B6258] whitespace-nowrap">
                    {r.adults}A{r.children ? ` · ${r.children}C` : ""}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.paymentStatus || t('pending')} /></td>
                  <td className={`px-4 py-3 font-mono text-[#2F2A25] whitespace-nowrap ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>
                    {formatCurrency(r.totalAmount)}
                  </td>
                  <td className={`ps-3 pe-4 sm:pe-5 py-3 ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>
                    <div className={`flex items-center gap-1 text-text-muted ${direction === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" aria-label={t('view')} onClick={() => { setSelectedReservation(r); setShowViewModal(true); }}>
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" aria-label={t('edit')} onClick={() => { setSelectedReservation(r); setShowEditModal(true); }}>
                        <Pencil size={15} />
                      </button>
                      {r.status === "Confirmed" && (
                        <button className="p-1.5 rounded-lg hover:bg-green-500/15 hover:text-green-300" aria-label={t('checkIn')} onClick={() => handleCheckIn(r.id)} disabled={processing}>
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {r.status === "Checked In" && (
                        <button className="p-1.5 rounded-lg hover:bg-blue-500/15 hover:text-blue-300" aria-label={t('checkOut')} onClick={() => handleCheckOut(r.id)} disabled={processing}>
                          <Calendar size={15} />
                        </button>
                      )}
                      {r.status !== "Checked Out" && r.status !== "Cancelled" && (
                        <button className="p-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-300" aria-label={t('cancel')} onClick={() => handleCancel(r.id)} disabled={processing}>
                          <XCircle size={15} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-blue-500/15 hover:text-blue-300" aria-label={t('printReceipt')} onClick={() => handlePrint(r)} disabled={processing}>
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 sm:px-5 py-10 text-center text-text-muted text-sm">
                    {t('noReservationsMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E7DFD4] text-xs text-text-muted" dir={direction}>
          <span>{t('showingReservations').replace('{count}', reservations.length.toString())}</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 rounded-lg hover:bg-white/10 hover:text-[#2F2A25] disabled:opacity-50"
            >
              {direction === 'rtl' ? '›' : '‹'}
            </button>
            <span className="h-7 w-7 rounded-lg bg-primary-500/20 text-purple-300 flex items-center justify-center">{currentPage}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 rounded-lg hover:bg-white/10 hover:text-[#2F2A25] disabled:opacity-50"
            >
              {direction === 'rtl' ? '‹' : '›'}
            </button>
          </div>
        </div>
      </div>

      {/* View Reservation Modal */}
      {showViewModal && selectedReservation && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{t('reservationDetails').replace('{number}', selectedReservation.reservationNumber)}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted">{t('guest')}</p>
                  <p className="text-[#2F2A25]">{selectedReservation.guest?.firstName} {selectedReservation.guest?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('room')}</p>
                  <p className="text-[#2F2A25]">{selectedReservation.rooms?.[0]?.number} - {getRoomTypeInfo(selectedReservation.rooms?.[0]?.roomType?.slug)?.category || selectedReservation.rooms?.[0]?.roomType?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('checkIn')}</p>
                  <p className="text-[#2F2A25]">{formatDate(selectedReservation.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('checkOut')}</p>
                  <p className="text-[#2F2A25]">{formatDate(selectedReservation.checkOutDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('guests')}</p>
                  <p className="text-[#2F2A25]">{selectedReservation.adults} {t('adults')}, {selectedReservation.children} {t('children')}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{common('total')}</p>
                  <p className="text-[#2F2A25] font-mono">{formatCurrency(selectedReservation.totalAmount)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">{t('specialRequests')}</p>
                <p className="text-sm text-[#6B6258]">{selectedReservation.specialRequests || t('none')}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowViewModal(false)}>{t('close')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {showEditModal && selectedReservation && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('editReservation').replace('{number}', selectedReservation.reservationNumber)}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('checkInDate')}</label>
                <input name="checkInDate" type="date" required defaultValue={selectedReservation.checkInDate.split('T')[0]} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('checkOutDate')}</label>
                <input name="checkOutDate" type="date" required defaultValue={selectedReservation.checkOutDate.split('T')[0]} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('adults')}</label>
                <input name="adults" type="number" required defaultValue={selectedReservation.adults} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('children')}</label>
                <input name="children" type="number" defaultValue={selectedReservation.children} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('discountAmount')}</label>
                <input name="discountAmount" type="number" step="0.01" min="0" defaultValue={selectedReservation.discountAmount || 0} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('depositAmount')}</label>
                <input name="depositAmount" type="number" step="0.01" min="0" defaultValue={selectedReservation.depositAmount || 0} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('paymentMethod')}</label>
                <select name="paymentMethod" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]">
                  <option value="Cash">{t('cash')}</option>
                  <option value="Credit Card">{t('creditCard')}</option>
                  <option value="Debit Card">{t('debitCard')}</option>
                  <option value="Bank Transfer">{t('bankTransfer')}</option>
                  <option value="PayPal">{t('paypal')}</option>
                  <option value="Stripe">{t('stripe')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('specialRequests')}</label>
                <textarea name="specialRequests" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" rows={3}>{selectedReservation.specialRequests || ""}</textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('updating') : t('updateReservation')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedReservation(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {showPrintModal && selectedReservation && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('printReceipt')}</h3>
              <button onClick={() => { setShowPrintModal(false); setSelectedReservation(null); }} className="text-[#6B6258] hover:text-[#2F2A25]">
                ✕
              </button>
            </div>
            
            <div id="print-receipt" className="p-6 border border-[#E7DFD4] rounded-lg bg-[#F8F6F2]">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#2F2A25] mb-2">{t('hotelName')}</h1>
                <p className="text-sm text-[#6B6258]">{t('reservation')} {t('invoice')}</p>
              </div>

              {/* Reservation Details */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#6B6258]">{t('reservationNumber')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{selectedReservation.reservationNumber}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6258]">{common('date')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{formatDate(new Date())}</p>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h3 className="font-semibold text-[#2F2A25] mb-2">{t('guestInformation')}</h3>
                <div className="text-sm text-[#6B6258]">
                  <p>{t('guestName')}: {selectedReservation.guest?.firstName} {selectedReservation.guest?.lastName}</p>
                  <p>{t('guestEmail')}: {selectedReservation.guest?.email}</p>
                  <p>{t('guestPhone')}: {selectedReservation.guest?.phoneNumber}</p>
                </div>
              </div>

              {/* Room Information */}
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h3 className="font-semibold text-[#2F2A25] mb-2">{t('roomDetails')}</h3>
                <div className="text-sm text-[#6B6258]">
                  <p>{t('roomNumber')}: {selectedReservation.room?.roomNumber}</p>
                  <p>{t('roomType')}: {selectedReservation.room?.roomType?.name}</p>
                </div>
              </div>

              {/* Stay Details */}
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h3 className="font-semibold text-[#2F2A25] mb-2">{t('stayDetails') || 'Stay Details'}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-[#6B6258]">
                  <div>
                    <p>{t('checkIn')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{formatDate(selectedReservation.checkInDate)}</p>
                  </div>
                  <div>
                    <p>{t('checkOut')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{formatDate(selectedReservation.checkOutDate)}</p>
                  </div>
                  <div>
                    <p>{t('adults')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{selectedReservation.adults}</p>
                  </div>
                  <div>
                    <p>{t('children')}:</p>
                    <p className="font-semibold text-[#2F2A25]">{selectedReservation.children}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6 p-4 bg-white rounded-lg">
                <h3 className="font-semibold text-[#2F2A25] mb-2">{t('paymentInformation')}</h3>
                <div className="text-sm text-[#6B6258]">
                  <div className="flex justify-between mb-2">
                    <span>{t('totalAmount')}:</span>
                    <span className="font-semibold text-[#2F2A25]">{formatCurrency(selectedReservation.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>{t('depositAmount')}:</span>
                    <span className="font-semibold text-[#2F2A25]">{formatCurrency(selectedReservation.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('paymentStatus')}:</span>
                    <span className="font-semibold text-[#2F2A25]">{selectedReservation.paymentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-12 pt-8 border-t border-[#E7DFD4]">
                <div className="text-center mb-32">
                  <p className="text-[#6B6258] text-sm font-semibold">{t('officialHotelStamp') || 'Official Hotel Stamp'}</p>
                  <div className="w-32 h-32 mx-auto mt-4 border-2 border-dashed border-[#E7DFD4] rounded-full flex items-center justify-center">
                    <p className="text-[#6B6258] text-xs">{t('stamp') || 'STAMP'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-12 text-sm mt-20">
                  <div>
                    <p className="text-[#6B6258] mb-24">{t('receptionSignature') || 'Reception Signature'}:</p>
                    <p className="text-[#6B6258] text-lg">_____________________________________________</p>
                  </div>
                  <div>
                    <p className="text-[#6B6258] mb-24">{t('guestSignature') || 'Guest Signature'}:</p>
                    <p className="text-[#6B6258] text-lg">_____________________________________________</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleDownloadPDF} disabled={processing} className="flex-1">
                <Printer size={16} className="mr-2" />
                {processing ? t('generating') : t('downloadPdf')}
              </Button>
              <Button variant="secondary" onClick={() => { setShowPrintModal(false); setSelectedReservation(null); }}>
                {common('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
