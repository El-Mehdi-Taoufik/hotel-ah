"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, MapPin, Trash2, Edit2, LogIn, LogOut, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { reservationService } from "@/services/reservation.service";
import { roomService } from "@/services/room.service";
import { cn } from "@/lib/utils";
import { eventEmitter, EVENTS } from "@/lib/events";
import { useTranslation } from "@/contexts/LanguageContext";

interface Reservation {
  id: number;
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: string;
  totalAmount: number;
  depositAmount: number;
  specialRequests?: string;
  guest: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  room?: {
    id: number;
    roomNumber: string;
    floor: string;
  };
  rooms: Array<{
    id: number;
    roomNumber: string;
    floor: string;
  }>;
}

interface Room {
  id: number;
  roomNumber: string;
  floor: string;
  status: string;
  isAvailable: boolean;
}

type ViewType = "Month" | "Week" | "Day";

const STATUS_COLORS = {
  "Confirmed": "#10B981",
  "Pending": "#F59E0B",
  "CheckedIn": "#2563EB",
  "CheckedOut": "#6B7280",
  "Cancelled": "#EF4444",
  "NoShow": "#B38B59"
};

const STATUS_BG_COLORS = {
  "Confirmed": "rgba(16, 185, 129, 0.1)",
  "Pending": "rgba(245, 158, 11, 0.1)",
  "CheckedIn": "rgba(37, 99, 235, 0.1)",
  "CheckedOut": "rgba(107, 114, 128, 0.1)",
  "Cancelled": "rgba(239, 68, 68, 0.1)",
  "NoShow": "rgba(179, 139, 89, 0.1)"
};

export default function CalendarPage() {
  const { calendar, common, direction, isLoaded } = useTranslation();
  const [view, setView] = useState<ViewType>("Month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);

  const weekDays = [
    isLoaded ? calendar('dayMonday') : 'Mon',
    isLoaded ? calendar('dayTuesday') : 'Tue',
    isLoaded ? calendar('dayWednesday') : 'Wed',
    isLoaded ? calendar('dayThursday') : 'Thu',
    isLoaded ? calendar('dayFriday') : 'Fri',
    isLoaded ? calendar('daySaturday') : 'Sat',
    isLoaded ? calendar('daySunday') : 'Sun'
  ];

  const monthNames = [
    isLoaded ? calendar('monthJanuary') : 'January',
    isLoaded ? calendar('monthFebruary') : 'February',
    isLoaded ? calendar('monthMarch') : 'March',
    isLoaded ? calendar('monthApril') : 'April',
    isLoaded ? calendar('monthMay') : 'May',
    isLoaded ? calendar('monthJune') : 'June',
    isLoaded ? calendar('monthJuly') : 'July',
    isLoaded ? calendar('monthAugust') : 'August',
    isLoaded ? calendar('monthSeptember') : 'September',
    isLoaded ? calendar('monthOctober') : 'October',
    isLoaded ? calendar('monthNovember') : 'November',
    isLoaded ? calendar('monthDecember') : 'December'
  ];

  const getDisplayStatus = (status: string) => {
    if (!isLoaded) return status;
    switch (status) {
      case "Confirmed": return calendar('statusConfirmed');
      case "Pending": return calendar('statusPending');
      case "CheckedIn": return calendar('statusCheckedIn');
      case "CheckedOut": return calendar('statusCheckedOut');
      case "Cancelled": return calendar('statusCancelled');
      case "NoShow": return calendar('statusNoShow');
      default: return status;
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    // Listen for events that should refresh the calendar
    const handleRefresh = () => {
      loadData();
    };

    eventEmitter.on(EVENTS.RESERVATION_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_DELETED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.DASHBOARD_REFRESH, handleRefresh);

    return () => {
      eventEmitter.off(EVENTS.RESERVATION_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_DELETED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.DASHBOARD_REFRESH, handleRefresh);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservationsData, roomsData] = await Promise.all([
        reservationService.getAll(1, 1000),
        roomService.getAll()
      ]);
      
      setReservations(reservationsData.data || []);
      setRooms(roomsData.data || []);
    } catch (error) {
      console.error(calendar('failedToLoadCalendarData'), error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCalendar = () => {
    loadData();
  };

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const newDate = new Date(currentDate);
    if (view === 'Month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'Week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'Day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const handleYearNavigate = (navDirection: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + (navDirection === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start
    const leadingBlanks = direction === 'rtl' ? (6 - startingDayOfWeek) : startingDayOfWeek;

    return { year, month, daysInMonth, leadingBlanks, firstDay, lastDay };
  };

  const getWeekData = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(res => {
      const checkIn = new Date(res.checkInDate).toISOString().split('T')[0];
      const checkOut = new Date(res.checkOutDate).toISOString().split('T')[0];
      return dateStr >= checkIn && dateStr <= checkOut;
    });
  };

  const getRoomForReservation = (reservation: Reservation) => {
    // First try the rooms array, then fall back to room object
    if (reservation.rooms && reservation.rooms.length > 0) {
      return reservation.rooms[0];
    }
    if (reservation.room) {
      return reservation.room;
    }
    return null;
  };

  const getMonthLabel = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (view === 'Month') {
      return `${monthNames[month]} ${year}`;
    } else if (view === 'Week') {
      const weekData = getWeekData();
      const start = weekData[0];
      const end = weekData[6];
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReservation) return;

    try {
      await reservationService.updateStatus(selectedReservation.id, newStatus);
      setShowModal(false);
      refreshCalendar();
      
      // Emit events to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (error) {
      console.error(calendar('failedToUpdateReservationStatus'), error);
    }
  };

  const handleDeleteReservation = async () => {
    if (!selectedReservation) return;

    try {
      await reservationService.delete(selectedReservation.id);
      setShowModal(false);
      refreshCalendar();
      
      // Emit events to refresh other pages
      eventEmitter.emit(EVENTS.RESERVATION_DELETED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
    } catch (error) {
      console.error(calendar('failedToDeleteReservation'), error);
    }
  };

  const renderMonthView = () => {
    const { daysInMonth, leadingBlanks } = getMonthData();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return (
      <div className="grid grid-cols-7 gap-2" dir={direction}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} className="h-24" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const date = new Date(year, month, day);
          const dayReservations = getReservationsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={day}
              className={cn(
                "h-24 rounded-xl border p-2 flex flex-col gap-1 overflow-hidden transition-colors cursor-pointer",
                today ? "border-[#B38B59]/50 bg-[#B38B59]/10" : "border-[#E7DFD4] bg-white hover:bg-[#F8F6F2]"
              )}
            >
              <span className={cn("text-xs font-mono shrink-0", today ? "text-[#B38B59] font-semibold" : "text-[#6B6258]")}>
                {day}
              </span>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 min-h-0">
                {dayReservations.map((res) => {
                  const room = getRoomForReservation(res);
                  const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : calendar('unknownGuest');
                  const roomNumber = room?.roomNumber || calendar('notAvailable');
                  return (
                    <div
                      key={res.id}
                      onClick={() => handleReservationClick(res)}
                      className="rounded-md px-1.5 py-1 cursor-pointer hover:opacity-80 border shrink-0"
                      style={{ 
                        background: STATUS_BG_COLORS[res.status as keyof typeof STATUS_BG_COLORS] || STATUS_BG_COLORS.Pending,
                        color: STATUS_COLORS[res.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending,
                        borderColor: STATUS_COLORS[res.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending
                      }}
                      title={`${guestName} - ${calendar('room')} ${roomNumber} (${getDisplayStatus(res.status)})`}
                    >
                      <div className="text-[10px] font-medium truncate">{guestName}</div>
                      <div className="text-[9px] opacity-80">{calendar('room')} {roomNumber}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekData = getWeekData();

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekData.map((date, index) => {
          const dayReservations = getReservationsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              className={cn(
                "min-h-32 rounded-xl border p-2 flex flex-col gap-1 overflow-hidden transition-colors cursor-pointer",
                today ? "border-[#B38B59]/50 bg-[#B38B59]/10" : "border-[#E7DFD4] bg-white hover:bg-[#F8F6F2]"
              )}
            >
              <div className="flex items-center justify-between shrink-0">
                <span className={cn("text-xs font-mono", today ? "text-[#B38B59] font-semibold" : "text-[#6B6258]")}>
                  {date.getDate()}
                </span>
                <span className="text-xs text-[#6B6258]">{weekDays[index]}</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 min-h-0">
                {dayReservations.map((res) => {
                  const room = getRoomForReservation(res);
                  const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : calendar('unknownGuest');
                  const roomNumber = room?.roomNumber || calendar('notAvailable');
                  return (
                    <div
                      key={res.id}
                      onClick={() => handleReservationClick(res)}
                      className="rounded-md px-1.5 py-1 cursor-pointer hover:opacity-80 border shrink-0"
                      style={{ 
                        background: STATUS_BG_COLORS[res.status as keyof typeof STATUS_BG_COLORS] || STATUS_BG_COLORS.Pending,
                        color: STATUS_COLORS[res.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending,
                        borderColor: STATUS_COLORS[res.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending
                      }}
                      title={`${guestName} - ${calendar('room')} ${roomNumber} (${getDisplayStatus(res.status)})`}
                    >
                      <div className="text-[10px] font-medium truncate">{guestName}</div>
                      <div className="text-[9px] opacity-80">{calendar('room')} {roomNumber}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayReservations = getReservationsForDate(currentDate);
    const today = isToday(currentDate);

    return (
      <div className="space-y-2">
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          today ? "border-[#B38B59]/50 bg-[#B38B59]/10" : "border-[#E7DFD4] bg-white"
        )}>
          <div className="flex items-center justify-between mb-4">
            <span className={cn("text-sm font-mono", today ? "text-[#B38B59] font-semibold" : "text-[#6B6258]")}>
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-[#6B6258]">{dayReservations.length} {calendar('reservations')}</span>
          </div>
          {dayReservations.length === 0 ? (
            <p className="text-sm text-[#6B6258] text-center py-8">{calendar('noReservations')}</p>
          ) : (
            <div className="space-y-2">
              {dayReservations.map((res) => {
                const room = getRoomForReservation(res);
                const guestName = res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : calendar('unknownGuest');
                const roomNumber = room?.roomNumber || calendar('notAvailable');
                return (
                  <div
                    key={res.id}
                    onClick={() => handleReservationClick(res)}
                    className="p-3 rounded-lg cursor-pointer hover:bg-[#F8F6F2] transition-colors border border-[#E7DFD4]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#2F2A25]">
                          {guestName}
                        </div>
                        <div className="text-xs text-[#6B6258] flex items-center gap-2">
                          {calendar('room')} {roomNumber} · <StatusBadge status={getDisplayStatus(res.status)} />
                        </div>
                      </div>
                      <div className="text-xs text-[#6B6258]">
                        {new Date(res.checkInDate).toLocaleDateString()} - {new Date(res.checkOutDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRoomTimeline = () => {
    const timelineDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6">
        <h3 className="text-sm font-medium text-[#2F2A25] mb-4">{calendar('roomTimelineNext7Days')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="text-[#6B6258]">
                <th className="text-left font-medium py-2 pr-4 w-24">{calendar('room')}</th>
                {timelineDays.map((d) => (
                  <th key={d.toISOString()} className="font-medium py-2 px-1 text-center">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-t border-[#E7DFD4]">
                  <td className="py-2 pr-4 text-[#2F2A25] whitespace-nowrap">{r.roomNumber}</td>
                  {timelineDays.map((d) => {
                    const dayReservations = getReservationsForDate(d);
                    const booked = dayReservations.some(res => {
                      const room = getRoomForReservation(res);
                      return room?.id === r.id;
                    });
                    return (
                      <td key={d.toISOString()} className="p-1">
                        <div
                          className={cn(
                            "h-6 rounded-md cursor-pointer hover:opacity-80",
                            booked ? "bg-gradient-to-r from-[#8C6A43]/70 to-[#B38B59]/70" : "bg-[#F8F6F2]"
                          )}
                          onClick={() => {
                            const res = dayReservations.find(res => {
                              const room = getRoomForReservation(res);
                              return room?.id === r.id;
                            });
                            if (res) handleReservationClick(res);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal || !selectedReservation) return null;

    const canCheckIn = selectedReservation.status === "Confirmed" || selectedReservation.status === "Pending";
    const canCheckOut = selectedReservation.status === "CheckedIn";;

    return (
      <div className="fixed inset-0 bg-[#2F2A25]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#2F2A25]">{calendar('reservationDetails')}</h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-[#6B6258] hover:text-[#2F2A25] transition-colors"
              title={calendar('close')}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block">{calendar('reservationNumber')}</label>
                <p className="text-sm text-[#2F2A25] font-mono">{selectedReservation.reservationNumber}</p>
              </div>
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block">{common('status')}</label>
                <span 
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ 
                    background: STATUS_BG_COLORS[selectedReservation.status as keyof typeof STATUS_BG_COLORS] || STATUS_BG_COLORS.Pending,
                    color: STATUS_COLORS[selectedReservation.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending
                  }}
                >
                  {getDisplayStatus(selectedReservation.status)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#6B6258] mb-1 block flex items-center gap-1">
                <User size={12} /> {calendar('guest')}
              </label>
              <p className="text-sm text-[#2F2A25]">
                {selectedReservation.guest ? `${selectedReservation.guest.firstName} ${selectedReservation.guest.lastName}` : calendar('unknownGuest')}
              </p>
              {selectedReservation.guest?.email && <p className="text-xs text-[#6B6258]">{selectedReservation.guest.email}</p>}
              {selectedReservation.guest?.phoneNumber && <p className="text-xs text-[#6B6258]">{selectedReservation.guest.phoneNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block flex items-center gap-1">
                  <MapPin size={12} /> {calendar('room')}
                </label>
                {(() => {
                  const room = getRoomForReservation(selectedReservation);
                  return <p className="text-sm text-[#2F2A25]">{room?.roomNumber || calendar('notAvailable')} ({calendar('floor')} {room?.floor || calendar('notAvailable')})</p>;
                })()}
              </div>
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block flex items-center gap-1">
                  <User size={12} /> {calendar('guests')}
                </label>
                <p className="text-sm text-[#2F2A25]">{selectedReservation.adults} {calendar('adults')}, {selectedReservation.children} {calendar('children')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block flex items-center gap-1">
                  <Calendar size={12} /> {calendar('checkInDate')}
                </label>
                <p className="text-sm text-[#2F2A25]">
                  {new Date(selectedReservation.checkInDate).toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block flex items-center gap-1">
                  <Calendar size={12} /> {calendar('checkOutDate')}
                </label>
                <p className="text-sm text-[#2F2A25]">
                  {new Date(selectedReservation.checkOutDate).toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block">{calendar('totalAmount')}</label>
                <p className="text-sm text-[#2F2A25] font-semibold">DH{selectedReservation.totalAmount}</p>
              </div>
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block">{calendar('depositAmount')}</label>
                <p className="text-sm text-[#2F2A25]">DH{selectedReservation.depositAmount}</p>
              </div>
            </div>

            {selectedReservation.specialRequests && (
              <div>
                <label className="text-xs text-[#6B6258] mb-1 block">{calendar('specialRequests')}</label>
                <p className="text-sm text-[#2F2A25]">{selectedReservation.specialRequests}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-[#E7DFD4]">
              {canCheckIn && (
                <Button
                  onClick={() => handleUpdateStatus("CheckedIn")}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <LogIn size={16} /> {calendar('checkIn')}
                </Button>
              )}
              {canCheckOut && (
                <Button
                  onClick={() => handleUpdateStatus("CheckedOut")}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  <LogOut size={16} /> {calendar('checkOut')}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  window.location.href = `/reservations`;
                }}
                className="flex items-center justify-center gap-1"
              >
                <Edit2 size={16} /> {calendar('edit')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeleteReservation}
                className="flex items-center justify-center gap-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} /> {common('delete')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={isLoaded ? calendar('title') : calendar('title')} subtitle={common('loading')} />
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
          <div className="h-64 animate-pulse bg-gray-200/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={calendar('title')}
        subtitle={calendar('subtitle')}
        actions={
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] border border-[#E7DFD4] p-1">
            {(["Month", "Week", "Day"] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  view === v ? "gradient-primary text-white" : "text-[#6B6258] hover:text-[#2F2A25]"
                )}
              >
                {v === "Month" ? calendar('monthView') : v === "Week" ? calendar('weekView') : calendar('dayView')}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleYearNavigate('prev')}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#6B6258] transition-colors"
              title={calendar('previousYear')}
            >
              {direction === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {direction === 'rtl' ? <ChevronRight size={16} className="-ml-3" /> : <ChevronLeft size={16} className="-ml-3" />}
            </button>
            <button 
              onClick={() => handleNavigate('prev')}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#6B6258] transition-colors"
              title={view === 'Month' ? calendar('previousMonth') : view === 'Week' ? calendar('previousWeek') : calendar('previousDay')}
            >
              {direction === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button 
              onClick={() => handleNavigate('today')}
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-medium text-[#6B6258] transition-colors"
            >
              {calendar('today')}
            </button>
            <button 
              onClick={() => handleNavigate('next')}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#6B6258] transition-colors"
              title={view === 'Month' ? calendar('nextMonth') : view === 'Week' ? calendar('nextWeek') : calendar('nextDay')}
            >
              {direction === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            <button 
              onClick={() => handleYearNavigate('next')}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#6B6258] transition-colors"
              title={calendar('nextYear')}
            >
              {direction === 'rtl' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              {direction === 'rtl' ? <ChevronLeft size={16} className="-ml-3" /> : <ChevronRight size={16} className="-ml-3" />}
            </button>
          </div>
          <h3 className="text-sm font-medium text-[#2F2A25]">{getMonthLabel()}</h3>
        </div>

        {view === 'Month' && (
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#6B6258] mb-2">
            {weekDays.map((d) => <div key={d}>{d}</div>)}
          </div>
        )}

        {view === 'Month' && renderMonthView()}
        {view === 'Week' && renderWeekView()}
        {view === 'Day' && renderDayView()}
      </div>

      {renderRoomTimeline()}
      {renderModal()}
    </div>
  );
}
