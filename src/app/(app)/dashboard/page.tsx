"use client";

import { BedDouble, CalendarCheck2, DollarSign, LogIn, LogOut, Users, CreditCard, CheckCircle, FileText, Send, Bell, AlertCircle, CheckCircle as CheckCircleIcon, AlertTriangle, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { reservationService } from "@/services/reservation.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import { paymentService } from "@/services/payment.service";
import { notificationService, Notification } from "@/services/notification.service";
import { useTranslation } from "@/contexts/LanguageContext";

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardPage() {
  const { dashboard, common, payments, direction } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    referenceNumber: '',
    notes: ''
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    loadUserFromStorage();
    
    const handleStorageChange = () => {
      loadUserFromStorage();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleStorageChange);
    };
  }, []);

  const loadUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      setUser(null);
    }
  };

  const getGreetingName = () => {
    if (!user) return 'User';
    return user.firstName;
  };

  useEffect(() => {
    const fetchData = async () => {
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
        
        const [statsData, reservationsData, pendingPaymentsData, notificationsData, unreadCountData] = await Promise.all([
          dashboardService.getStats(),
          reservationService.getAll(1, 50),
          paymentService.getPendingPayments(),
          notificationService.getUnread(),
          notificationService.getUnreadCount()
        ]);
        setStats(statsData);
        setReservations(reservationsData.data || []);
        setPendingPayments(pendingPaymentsData.data || []);
        setNotifications(notificationsData.slice(0, 5));
        setUnreadCount(unreadCountData);
      } catch (err) {
        setError(dashboard('failedToLoad'));
        console.error(dashboard('dashboardError'), err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for events that should refresh the dashboard
    const handleRefresh = () => {
      fetchData();
    };

    eventEmitter.on(EVENTS.RESERVATION_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_DELETED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.GUEST_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.GUEST_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_RECEIVED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.PAYMENT_DELETED, handleRefresh);
    eventEmitter.on(EVENTS.DASHBOARD_REFRESH, handleRefresh);

    // Poll for notifications every 30 seconds
    const notificationInterval = setInterval(async () => {
      try {
        const [notificationsData, unreadCountData] = await Promise.all([
          notificationService.getUnread(),
          notificationService.getUnreadCount()
        ]);
        setNotifications(notificationsData.slice(0, 5));
        setUnreadCount(unreadCountData);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }, 30000);

    return () => {
      eventEmitter.off(EVENTS.RESERVATION_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_DELETED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.GUEST_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.GUEST_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_RECEIVED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.PAYMENT_DELETED, handleRefresh);
      eventEmitter.off(EVENTS.DASHBOARD_REFRESH, handleRefresh);
      clearInterval(notificationInterval);
    };
  }, [dashboard]);

  const handleReceivePayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentForm({
      amount: payment.remainingBalance.toString(),
      method: 'Cash',
      referenceNumber: '',
      notes: ''
    });
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setPaymentError(dashboard('invalidAmount'));
        return;
      }
      if (amount > selectedPayment.remainingBalance) {
        setPaymentError(dashboard('amountExceedsBalance'));
        return;
      }

      await paymentService.receivePayment({
        reservationId: selectedPayment.reservationId,
        amount: amount,
        method: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      });

      eventEmitter.emit(EVENTS.PAYMENT_RECEIVED);
      setShowPaymentModal(false);
      setSelectedPayment(null);
    } catch (err) {
      setPaymentError(dashboard('paymentFailed'));
      console.error(dashboard('paymentError'), err);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  const handleMarkAsPaid = async (reservationId: number) => {
    try {
      // {dashboard('forNowJustReceiveFullRemainingBalance')}
      const payment = pendingPayments.find(p => p.reservationId === reservationId);
      if (payment) {
        await paymentService.receivePayment({
          reservationId: reservationId,
          amount: payment.remainingBalance,
          method: 'Cash',
          referenceNumber: '',
          notes: dashboard('markedAsPaidFromDashboard')
        });
        eventEmitter.emit(EVENTS.PAYMENT_RECEIVED);
      }
    } catch (err) {
      console.error(dashboard('markAsPaidError'), err);
    }
  };

  const handlePrintInvoice = (reservationId: number) => {
    // {dashboard('implementationForPrintingInvoice')}
    console.log(dashboard('printInvoiceForReservation'), reservationId);
  };

  const handleSendReceipt = (reservationId: number) => {
    // Implementation for sending receipt
    console.log(dashboard('sendReceiptForReservation'), reservationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Success':
        return <CheckCircleIcon size={16} className="text-green-500" />;
      case 'Error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'Warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-50 border-red-200';
    switch (type) {
      case 'Success':
        return 'bg-green-50 border-green-200';
      case 'Error':
        return 'bg-red-50 border-red-200';
      case 'Warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const arrivals = reservations.filter((r) => r.status === "Confirmed" || r.status === "Reserved").slice(0, 4);
  const departures = reservations.filter((r) => r.status === "Checked In").slice(0, 4);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={dashboard('loading')}
          subtitle={dashboard('fetchingData')}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-[#E7DFD4] rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-[#E7DFD4] rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={dashboard('error')}
          subtitle={error}
        />
        <Button onClick={() => window.location.reload()}>{dashboard('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${dashboard('goodMorning')}, ${getGreetingName()}`}
        subtitle={dashboard('whatsHappening')}
        actions={
          <Link href="/reservations/new">
            <Button>+ {dashboard('newReservation')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={dashboard('occupancyRateLabel')} value={`${stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%`} delta="+4.2%" trend="up" icon={BedDouble} accent="#B38B59" />
        <StatCard label={dashboard('todaysRevenue')} value={`DH${stats.totalRevenue || 0}`} delta="+12.4%" trend="up" icon={DollarSign} accent="#4CAF50" />
        <StatCard label={dashboard('checkInsToday')} value={stats.activeReservations || 0} delta="+3" trend="up" icon={LogIn} accent="#2563EB" />
        <StatCard label={dashboard('checkOutsToday')} value={stats.pendingReservations || 0} delta="-2" trend="down" icon={LogOut} accent="#F59E0B" />
        <StatCard label={dashboard('guestsInHotel')} value={stats.totalGuests || 0} delta="+18" trend="up" icon={Users} accent="#B38B59" />
        <StatCard label={dashboard('pendingPayments')} value={`DH${stats.totalUnpaidAmount || 0}`} count={stats.pendingPayments || 0} delta="-8%" trend="down" icon={DollarSign} accent="#EF4444" />
        <StatCard label={dashboard('availableRoomsLabel')} value={stats.availableRooms || 0} icon={BedDouble} accent="#4CAF50" />
        <StatCard label={dashboard('monthlyRevenue')} value={`DH${stats.monthlyRevenue || 0}`} delta="+9.1%" trend="up" icon={CalendarCheck2} accent="#2563EB" />
      </div>

      {/* Pending Payments Section */}
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#2F2A25]">{dashboard('pendingPaymentsSection')}</h3>
          {pendingPayments.length > 0 && (
            <span className="text-xs text-[#6B6258]">{pendingPayments.length} {dashboard('pendingCount')}</span>
          )}
        </div>
        
        {pendingPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={direction}>
              <thead>
                <tr className="text-start text-[#6B6258] border-b border-[#E7DFD4]">
                  <th className="pb-3 font-medium text-start">{dashboard('resId')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('guest')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('room')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('checkIn')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('checkOut')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('total')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('paid')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('balance')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('status')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('dueDate')}</th>
                  <th className="pb-3 font-medium text-start">{dashboard('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment.reservationId} className="border-b border-[#E7DFD4] hover:bg-[#F8F6F2]">
                    <td className="py-3 text-[#2F2A25] text-start">{payment.reservationNumber}</td>
                    <td className="py-3 text-[#2F2A25] text-start">{payment.guestName}</td>
                    <td className="py-3 text-[#2F2A25] text-start">{payment.roomNumber}</td>
                    <td className="py-3 text-[#6B6258] text-start">{formatDate(payment.checkIn)}</td>
                    <td className="py-3 text-[#6B6258] text-start">{formatDate(payment.checkOut)}</td>
                    <td className="py-3 text-[#2F2A25] text-start">DH{payment.totalAmount.toFixed(2)}</td>
                    <td className="py-3 text-[#2F2A25] text-start">DH{payment.amountPaid.toFixed(2)}</td>
                    <td className="py-3 text-[#2F2A25] font-medium text-start">DH{payment.remainingBalance.toFixed(2)}</td>
                    <td className="py-3 text-start">{getPaymentStatusBadge(payment.paymentStatus)}</td>
                    <td className="py-3 text-[#6B6258] text-start">{formatDate(payment.dueDate)}</td>
                    <td className="py-3 text-start">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleReceivePayment(payment)}
                          className="p-1.5 hover:bg-[#E7DFD4] rounded-lg transition-colors"
                          title={dashboard('receivePayment')}
                        >
                          <CreditCard size={16} className="text-[#2F2A25]" />
                        </button>
                        <button
                          onClick={() => handleMarkAsPaid(payment.reservationId)}
                          className="p-1.5 hover:bg-[#E7DFD4] rounded-lg transition-colors"
                          title={dashboard('markAsPaid')}
                        >
                          <CheckCircle size={16} className="text-[#2F2A25]" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(payment.reservationId)}
                          className="p-1.5 hover:bg-[#E7DFD4] rounded-lg transition-colors"
                          title={dashboard('printInvoice')}
                        >
                          <FileText size={16} className="text-[#2F2A25]" />
                        </button>
                        <button
                          onClick={() => handleSendReceipt(payment.reservationId)}
                          className="p-1.5 hover:bg-[#E7DFD4] rounded-lg transition-colors"
                          title={dashboard('sendReceipt')}
                        >
                          <Send size={16} className="text-[#2F2A25]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-[#6B6258]">
            <p className="text-sm">{dashboard('noPendingPayments')}</p>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#2F2A25]" />
            <h3 className="text-sm font-medium text-[#2F2A25]">{dashboard('recentNotifications')}</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <Link href="/notifications" className="text-xs text-[#6B6258] hover:text-[#2F2A25]">
            {dashboard('viewAll')}
          </Link>
        </div>
        
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${getNotificationColor(notification.type, notification.isOverdue)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2F2A25] mb-1">
                      {notification.title}
                      {notification.isOverdue && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#6B6258] line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-[#9A9085] mt-1">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#6B6258]">
            <Bell size={32} className="mx-auto mb-2 text-[#9A9085]" />
            <p className="text-sm">No unread notifications</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
          <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{dashboard('upcomingArrivals')}</h3>
          <ul className="space-y-3">
            {arrivals.length > 0 ? arrivals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#2F2A25] truncate">{r.guest?.firstName} {r.guest?.lastName}</p>
                  <p className="text-xs text-[#6B6258]">{common('room')} {r.rooms?.[0]?.number} · {formatDate(r.checkInDate)}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            )) : (
              <li className="text-sm text-[#6B6258]">{dashboard('noUpcomingArrivals')}</li>
            )}
          </ul>
        </div>

        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6" dir={direction}>
          <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{dashboard('upcomingDepartures')}</h3>
          <ul className="space-y-3">
            {departures.length > 0 ? departures.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-[#2F2A25] truncate">{r.guest?.firstName} {r.guest?.lastName}</p>
                  <p className="text-xs text-[#6B6258]">{common('room')} {r.rooms?.[0]?.number} · {formatDate(r.checkOutDate)}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            )) : (
              <li className="text-sm text-[#6B6258]">{dashboard('noUpcomingDepartures')}</li>
            )}
          </ul>
        </div>

        <QuickActions />
      </div>

      <RecentActivity />

      {/* Receive Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-[#2F2A25]">{dashboard('receivePaymentModal')}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#6B6258] hover:text-[#2F2A25]"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-[#F8F6F2] rounded-lg">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B6258]">{dashboard('resId')}:</span>
                <span className="text-[#2F2A25]">{selectedPayment.reservationNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B6258]">{dashboard('guest')}:</span>
                <span className="text-[#2F2A25]">{selectedPayment.guestName}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B6258]">{dashboard('total')}:</span>
                <span className="text-[#2F2A25]">DH{selectedPayment.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B6258]">{dashboard('paid')}:</span>
                <span className="text-[#2F2A25]">DH{selectedPayment.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-[#6B6258]">{dashboard('balance')}:</span>
                <span className="text-[#2F2A25]">DH{selectedPayment.remainingBalance.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{dashboard('paymentMethod')}</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                  className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]"
                >
                  <option value="Cash">{payments('cash')}</option>
                  <option value="CreditCard">{payments('card')}</option>
                  <option value="DebitCard">{payments('card')}</option>
                  <option value="BankTransfer">{payments('bankTransfer')}</option>
                  <option value="MobilePayment">{payments('online')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{dashboard('amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  max={selectedPayment.remainingBalance}
                  className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{dashboard('referenceNumber')} ({common('optional')})</label>
                <input
                  type="text"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({...paymentForm, referenceNumber: e.target.value})}
                  className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{dashboard('notes')} ({common('optional')})</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] h-20"
                />
              </div>

              {paymentError && (
                <div className="text-sm text-[#EF4444]">{paymentError}</div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  {common('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  {dashboard('receivePayment')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
