"use client";

import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, Clock, FileText, RotateCcw, Wallet, Plus, CreditCard, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";
import { paymentService } from "@/services/payment.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import jsPDF from 'jspdf';
import { useTranslation } from "@/contexts/LanguageContext";

const statuses: (PaymentStatus | "All")[] = ["All", "Paid", "Pending", "Partial", "Refunded"];

export default function PaymentsPage() {
  const { payments: t, common, isLoaded, direction } = useTranslation();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
    
    const handlePaymentCreated = () => {
      fetchPayments();
    };
    
    const handlePaymentUpdated = () => {
      fetchPayments();
    };
    
    const handlePaymentDeleted = () => {
      fetchPayments();
    };
    
    eventEmitter.on(EVENTS.PAYMENT_CREATED, handlePaymentCreated);
    eventEmitter.on(EVENTS.PAYMENT_UPDATED, handlePaymentUpdated);
    eventEmitter.on(EVENTS.PAYMENT_DELETED, handlePaymentDeleted);
    
    return () => {
      eventEmitter.off(EVENTS.PAYMENT_CREATED, handlePaymentCreated);
      eventEmitter.off(EVENTS.PAYMENT_UPDATED, handlePaymentUpdated);
      eventEmitter.off(EVENTS.PAYMENT_DELETED, handlePaymentDeleted);
    };
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAll();
      setPayments(data.data || []);
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        const matchesQuery = p.guest?.firstName?.toLowerCase().includes(query.toLowerCase()) || 
                            p.guest?.lastName?.toLowerCase().includes(query.toLowerCase()) ||
                            p.paymentNumber?.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "All" || p.status === status;
        return matchesQuery && matchesStatus;
      }),
    [query, status, payments]
  );

  const totals = {
    paid: payments.filter((p) => p.status === "Paid").reduce((s, p) => s + (p.amount || 0), 0),
    pending: payments.filter((p) => p.status === "Pending" || p.status === "Partial").reduce((s, p) => s + (p.amount || 0), 0),
    refunded: payments.filter((p) => p.status === "Refunded").reduce((s, p) => s + (p.amount || 0), 0),
  };

  const handleAddPayment = async (paymentData: any) => {
    try {
      setProcessing(true);
      await paymentService.create(paymentData);
      await fetchPayments();
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add payment:", err);
      setError(t('failedToAdd'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async (amount: number) => {
    try {
      setProcessing(true);
      await paymentService.refund(selectedPayment.id, { amount });
      await fetchPayments();
      setShowRefundModal(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error("Failed to refund payment:", err);
      setError(t('failedToRefund'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={isLoaded ? t('title') : t('title')} subtitle={common('loading')} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchPayments}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('trackInvoices')} actions={<Button onClick={() => setShowAddModal(true)}><Plus size={16} className="ms-2" /> {t('recordPayment')}</Button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('paidThisMonth')} value={formatCurrency(totals.paid)} icon={CheckCircle2} accent="#10B981" />
        <StatCard label={t('pending')} value={formatCurrency(totals.pending)} icon={Clock} accent="#F59E0B" />
        <StatCard label={t('refunded')} value={formatCurrency(totals.refunded)} icon={RotateCcw} accent="#EF4444" />
      </div>

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchInput placeholder={t('searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {statuses.map((s) => <option key={s} value={s}>{s === "All" ? t('allStatuses') : s}</option>)}
          </Select>
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-5">
          <table className="w-full text-sm" dir={direction}>
            <thead>
              <tr className="border-b border-[#E7DFD4] text-start text-xs text-text-muted uppercase tracking-wide">
                <th className="ps-4 sm:ps-5 pe-3 py-3 font-medium text-start">{t('payment')}</th>
                <th className="px-4 py-3 font-medium text-start">{t('guest')}</th>
                <th className="px-4 py-3 font-medium text-start">{t('reservation')}</th>
                <th className="px-4 py-3 font-medium text-start">{t('method')}</th>
                <th className="px-4 py-3 font-medium text-start">{t('date')}</th>
                <th className="px-4 py-3 font-medium text-start">{common('status')}</th>
                <th className={`px-4 py-3 font-medium ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>{t('amount')}</th>
                <th className={`ps-3 pe-4 sm:pe-5 py-3 font-medium ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="ps-4 sm:ps-5 pe-3 py-3 font-mono text-xs text-purple-300">{p.paymentNumber}</td>
                  <td className="px-4 py-3 text-[#2F2A25] whitespace-nowrap">{p.guest?.firstName} {p.guest?.lastName}</td>
                  <td className="px-4 py-3 text-[#6B6258] font-mono text-xs">{p.reservation?.reservationNumber}</td>
                  <td className="px-4 py-3 text-[#6B6258] flex items-center gap-1.5 whitespace-nowrap">
                    <Wallet size={13} /> {p.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-[#6B6258] whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className={`px-4 py-3 font-mono text-[#2F2A25] ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>{formatCurrency(p.amount)}</td>
                  <td className={`ps-3 pe-4 sm:pe-5 py-3 ${direction === 'rtl' ? 'text-start' : 'text-end'}`}>
                    <div className={`flex items-center gap-1 text-text-muted ${direction === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" aria-label={t('viewInvoice')} onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Invoices/payment/${p.id}`, {
                            headers: {
                              ...(token && { Authorization: `Bearer ${token}` }),
                            },
                          });
                          
                          if (!response.ok) {
                            throw new Error(t('failedToGenerateInvoice'));
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Invoice_${p.paymentNumber}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error("Invoice generation error:", error);
                          setError(t('failedToGenerateInvoice'));
                        }
                      }}>
                        <FileText size={15} />
                      </button>
                      {p.status === "Paid" && (
                        <button className="p-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-300" aria-label={t('refund')} onClick={() => { setSelectedPayment(p); setShowRefundModal(true); }}>
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 sm:px-5 py-10 text-center text-text-muted text-sm">
                    {t('noPaymentsMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('recordPayment')}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddPayment(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('reservationId')}</label>
                <input name="reservationId" type="number" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('enterReservationId')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('amount')}</label>
                <input name="amount" type="number" required step="0.01" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('paymentMethod')}</label>
                <select name="paymentMethod" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] [&>option]:bg-slate-900 [&>option]:text-white [&>option:hover]:bg-primary-500/20 [&>option:checked]:bg-primary-500/40">
                  <option value="Credit Card">{t('creditCard')}</option>
                  <option value="Cash">{t('cash')}</option>
                  <option value="Bank Transfer">{t('bankTransfer')}</option>
                  <option value="PayPal">{t('paypal')}</option>
                  <option value="Stripe">{t('stripe')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('paymentDate')}</label>
                <input name="paymentDate" type="date" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('recording') : t('recordPayment')}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('refundPayment')}</h3>
            <p className="text-sm text-[#6B6258] mb-4">{t('paymentInfo').replace('{number}', selectedPayment.paymentNumber)}</p>
            <p className="text-sm text-[#6B6258] mb-4">{t('originalAmount').replace('{amount}', formatCurrency(selectedPayment.amount))}</p>
            <form onSubmit={(e) => { e.preventDefault(); const refundAmount = parseFloat(new FormData(e.currentTarget).get('refundAmount') as string); handleRefund(refundAmount); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('refundAmount')}</label>
                <input name="refundAmount" type="number" required step="0.01" max={selectedPayment.amount} defaultValue={selectedPayment.amount} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600">{processing ? t('processing') : t('processRefund')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowRefundModal(false); setSelectedPayment(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
