"use client";

import { useMemo, useState, useEffect } from "react";
import { BedDouble, LayoutGrid, List, Maximize2, Pencil, Sparkles, Trash2, Users, Wifi, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/types";
import { roomService } from "@/services/room.service";
import { eventEmitter, EVENTS } from "@/lib/events";
import { useTranslation } from "@/contexts/LanguageContext";
import { getRoomTypeImage, getRoomTypeInfo } from "@/lib/roomTypeImages";

const getStatuses = (t: any) => [
  "All", "Available", "Occupied", "Reserved", "Cleaning", "Maintenance", "Out of Service",
];

export default function RoomsPage() {
  const { rooms: t, common, isLoaded, direction } = useTranslation();
  const statuses = getStatuses(t);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoomTypeModal, setShowAddRoomTypeModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();

    // Listen for events that should refresh the rooms list
    const handleRefresh = () => {
      fetchRooms();
    };

    eventEmitter.on(EVENTS.RESERVATION_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_DELETED, handleRefresh);
    eventEmitter.on(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_CREATED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_UPDATED, handleRefresh);
    eventEmitter.on(EVENTS.ROOM_DELETED, handleRefresh);
    eventEmitter.on(EVENTS.HOUSEKEEPING_COMPLETED, handleRefresh);

    return () => {
      eventEmitter.off(EVENTS.RESERVATION_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_DELETED, handleRefresh);
      eventEmitter.off(EVENTS.RESERVATION_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_STATUS_CHANGED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_CREATED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_UPDATED, handleRefresh);
      eventEmitter.off(EVENTS.ROOM_DELETED, handleRefresh);
      eventEmitter.off(EVENTS.HOUSEKEEPING_COMPLETED, handleRefresh);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAll();
      setRooms(data.data || []);
    } catch (err) {
      setError(t('failedToLoad'));
      console.error("Rooms error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const response = await fetch('/api/room-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRoomTypes(data.data || []);
      }
    } catch (err) {
      console.error("Room types error:", err);
    }
  };

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchesQuery = r.roomNumber?.includes(query) || r.roomType?.name?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "All" || r.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status, rooms]);

  const handleAddRoom = async (roomData: any) => {
    try {
      setProcessing(true);
      setFormError(null);
      
      // Transform form data to match backend DTO
      const requestData = {
        roomNumber: roomData.number,
        roomTypeId: parseInt(roomData.roomTypeId),
        floor: roomData.floor.toString(),
        status: 'Available',
        isAvailable: true,
        notes: roomData.notes || ''
      };
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        const errorMessage = result.errors?.join(', ') || result.message || t('failedToAddRoom');
        setFormError(errorMessage);
        return;
      }
      
      await fetchRooms();
      setShowAddModal(false);
      setFormError(null);
      
      // Emit event to refresh other pages
      eventEmitter.emit(EVENTS.ROOM_CREATED);
    } catch (err) {
      console.error("Failed to add room:", err);
      setFormError(err instanceof Error ? err.message : t('failedToAddRoom'));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditRoom = async (roomData: any) => {
    try {
      setProcessing(true);
      setFormError(null);
      
      // Transform form data to match backend DTO
      const requestData = {
        roomNumber: roomData.roomNumber,
        roomTypeId: parseInt(roomData.roomTypeId),
        floor: roomData.floor.toString(),
        status: roomData.status,
        isAvailable: roomData.isAvailable === 'true',
        notes: roomData.notes || ''
      };
      
      console.log('Edit Room Request:', {
        url: `/api/rooms/${selectedRoom.id}`,
        method: 'PUT',
        data: requestData
      });
      
      const response = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      console.log('Edit Room Response:', {
        status: response.status,
        ok: response.ok,
        result: result
      });
      
      if (!response.ok || !result.success) {
        const errorMessage = result.errors?.join(', ') || result.message || t('failedToUpdateRoom');
        setFormError(errorMessage);
        return;
      }
      
      await fetchRooms();
      setShowEditModal(false);
      setSelectedRoom(null);
      setFormError(null);
      
      showToast(t('roomUpdated'), 'success');
      
      // Emit event to refresh other pages
      eventEmitter.emit(EVENTS.ROOM_UPDATED);
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (err) {
      console.error("Failed to update room:", err);
      setFormError(err instanceof Error ? err.message : t('failedToUpdateRoom'));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRoomStatus = async (roomId: number, newStatus: string) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        const errorMessage = result.message || t('failedToUpdateRoomStatus');
        showToast(errorMessage, 'error');
        return;
      }
      
      await fetchRooms();
      showToast(t('roomStatusUpdated'), 'success');
      
      // Emit event to refresh other pages
      eventEmitter.emit(EVENTS.ROOM_STATUS_CHANGED);
      eventEmitter.emit(EVENTS.DASHBOARD_REFRESH);
    } catch (err) {
      console.error("Failed to update room status:", err);
      showToast(t('failedToUpdateRoomStatus'), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      setProcessing(true);
      const result = await roomService.delete(selectedRoom.id);
      
      if (!result.success) {
        setFormError(result.message || t('failedToDeleteRoom'));
        return;
      }
      
      await fetchRooms();
      setShowDeleteConfirm(false);
      setSelectedRoom(null);
      setFormError(null);
      
      // Show success toast
      showToast(t('roomDeleted'), 'success');
      
      // Emit event to refresh other pages
      eventEmitter.emit(EVENTS.ROOM_DELETED);
    } catch (err) {
      console.error("Failed to delete room:", err);
      setFormError(err instanceof Error ? err.message : t('failedToDeleteRoom'));
    } finally {
      setProcessing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 px-4 py-2 rounded-lg text-sm z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.style[direction === 'rtl' ? 'left' : 'right'] = '1rem';
    toast.style[direction === 'rtl' ? 'right' : 'left'] = 'auto';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleAddRoomType = async (roomTypeData: any) => {
    try {
      setProcessing(true);
      setFormError(null);
      
      const response = await fetch('/api/room-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: roomTypeData.name,
          description: roomTypeData.description,
          basePrice: parseFloat(roomTypeData.basePrice),
          maxOccupancy: parseInt(roomTypeData.maxOccupancy),
          maxAdults: parseInt(roomTypeData.maxAdults),
          maxChildren: parseInt(roomTypeData.maxChildren),
          amenities: roomTypeData.amenities
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        const errorMessage = result.errors?.join(', ') || result.message || t('failedToAddRoomType');
        setFormError(errorMessage);
        return;
      }
      
      await fetchRoomTypes();
      setShowAddRoomTypeModal(false);
      setFormError(null);
    } catch (err) {
      console.error("Failed to add room type:", err);
      setFormError(err instanceof Error ? err.message : t('failedToAddRoomType'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReserve = (roomId: number) => {
    // Navigate to reservation page with room pre-selected
    window.location.href = `/reservations/new?roomId=${roomId}`;
  };

  if (loading || !isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={isLoaded ? t('title') : t('title')} subtitle={common('loading')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm h-64 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={error} />
        <Button onClick={fetchRooms}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={`${rooms.length} ${t('title')} · ${roomTypes.length} ${t('roomType')}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAddRoomTypeModal(true)}><Plus size={16} className="ms-2" /> {t('addRoomType')}</Button>
            <Button onClick={() => setShowAddModal(true)}><Plus size={16} className="ms-2" /> {t('addRoom')}</Button>
          </div>
        }
      />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput placeholder={t('searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {statuses.map((s) => <option key={s} value={s}>{s === "All" ? t('statusAll') : t(`status${s}`)}</option>)}
          </Select>
          <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] border border-[#E7DFD4] p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("h-8 w-8 rounded-lg flex items-center justify-center", view === "grid" ? "gradient-primary text-white" : "text-[#6B6258]")}
              aria-label={t('gridView')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("h-8 w-8 rounded-lg flex items-center justify-center", view === "list" ? "gradient-primary text-white" : "text-[#6B6258]")}
              aria-label={t('listView')}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((r) => {
            const roomTypeId = r.roomType?.id;
            const roomImage = getRoomTypeImage(roomTypeId);
            const roomTypeInfo = getRoomTypeInfo(roomTypeId);
            
            return (
            <div key={r.id} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm card-lift overflow-hidden animate-fade-in">
              <div className="h-28 relative bg-[#F8F6F2]">
                <img 
                  src={roomImage} 
                  alt={r.roomType?.name || t('room')} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className={`absolute top-2.5 ${direction === 'rtl' ? 'left-2.5' : 'right-2.5'}`}><StatusBadge status={r.status} /></div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="text-[#2F2A25] font-semibold">{t('room')} {r.roomNumber}</h4>
                  <span className="font-mono text-sm text-[#2F2A25]">{formatCurrency(r.roomType?.basePrice)}<span className="text-text-muted text-xs">{t('night')}</span></span>
                </div>
                <p className="text-xs text-[#6B6258]">{roomTypeInfo?.category || r.roomType?.name} · {t('floor')} {r.floor}</p>
                {roomTypeInfo && (
                  <div className="flex items-center gap-3 text-xs text-[#6B6258]">
                    <span className="flex items-center gap-1"><Users size={12} /> {roomTypeInfo.capacity}</span>
                    <span className="flex items-center gap-1"><BedDouble size={12} /> {roomTypeInfo.bed}</span>
                    <span className="flex items-center gap-1"><Sparkles size={12} /> {r.isAvailable ? t('available') : t('notAvailable')}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => handleReserve(r.id)} disabled={!r.isAvailable}>{t('reserve')}</Button>
                  {r.status === 'Cleaning' && (
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateRoomStatus(r.id, 'Available')} className="flex-1">{t('markClean')}</Button>
                  )}
                  {r.status === 'Available' && (
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateRoomStatus(r.id, 'Maintenance')} className="flex-1">{t('maintain')}</Button>
                  )}
                  {r.status === 'Maintenance' && (
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateRoomStatus(r.id, 'Available')} className="flex-1">{t('restore')}</Button>
                  )}
                  <button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-[#2F2A25] hover:bg-white/10 flex items-center justify-center shrink-0" aria-label={t('view')}>
                    <Maximize2 size={14} />
                  </button>
                  <button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-[#2F2A25] hover:bg-white/10 flex items-center justify-center shrink-0" aria-label={t('edit')} onClick={() => { setSelectedRoom(r); setShowEditModal(true); }}>
                    <Pencil size={14} />
                  </button>
                  <button className="h-8 w-8 rounded-lg border border-[#E7DFD4] text-[#6B6258] hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center shrink-0" aria-label={t('delete')} onClick={() => { setSelectedRoom(r); setShowDeleteConfirm(true); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm" dir={direction}>
            <thead>
              <tr className="border-b border-[#E7DFD4] text-start text-xs text-text-muted uppercase tracking-wide">
                <th className="ps-5 pe-3 py-3 font-medium">{t('room')}</th>
                <th className="px-4 py-3 font-medium">{t('type')}</th>
                <th className="px-4 py-3 font-medium">{t('floor')}</th>
                <th className="px-4 py-3 font-medium">{t('capacity')}</th>
                <th className="px-4 py-3 font-medium">{t('price')}</th>
                <th className="px-4 py-3 font-medium">{common('status')}</th>
                <th className="px-4 py-3 font-medium">{t('available')}</th>
                <th className="ps-3 pe-5 py-3 font-medium text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const roomTypeId = r.roomType?.id;
                const roomTypeInfo = getRoomTypeInfo(roomTypeId);
                
                return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="ps-5 pe-3 py-3 text-[#2F2A25]">{t('room')} {r.roomNumber}</td>
                  <td className="px-4 py-3 text-[#6B6258]">{roomTypeInfo?.category || r.roomType?.name}</td>
                  <td className="px-4 py-3 text-[#6B6258]">{r.floor}</td>
                  <td className="px-4 py-3 text-[#6B6258]">{roomTypeInfo?.capacity || `${r.roomType?.maxOccupancy} ${t('guest')}`}</td>
                  <td className="px-4 py-3 font-mono text-[#2F2A25]">{formatCurrency(r.roomType?.basePrice)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-[#6B6258]">{r.isAvailable ? t('available') : t('notAvailable')}</td>
                  <td className="ps-3 pe-5 py-3">
                    <div className="flex items-center justify-end gap-1 text-text-muted">
                      {r.status === 'Cleaning' && (
                        <button className="p-1.5 rounded-lg hover:bg-green-500/15 hover:text-green-300" onClick={() => handleUpdateRoomStatus(r.id, 'Available')} title={t('markClean')}>✓</button>
                      )}
                      {r.status === 'Available' && (
                        <button className="p-1.5 rounded-lg hover:bg-orange-500/15 hover:text-orange-300" onClick={() => handleUpdateRoomStatus(r.id, 'Maintenance')} title={t('maintain')}>⚙</button>
                      )}
                      {r.status === 'Maintenance' && (
                      <button className="p-1.5 rounded-lg hover:bg-green-500/15 hover:text-green-300" onClick={() => handleUpdateRoomStatus(r.id, 'Available')} title={t('restore')}>↻</button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#2F2A25]" onClick={() => { setSelectedRoom(r); setShowEditModal(true); }}><Pencil size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/15 hover:text-red-300" onClick={() => { setSelectedRoom(r); setShowDeleteConfirm(true); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('addNewRoom')}</h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              handleAddRoom(data); 
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('roomNumber')}</label>
                <input name="number" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('roomNumberPlaceholder')} defaultValue="" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('floor')}</label>
                <input name="floor" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('floorPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('roomType')}</label>
                {roomTypes.length === 0 ? (
                  <div className="text-sm text-[#6B6258] mb-2">{t('noRoomTypesAvailable')}</div>
                ) : (
                  <select name="roomTypeId" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] [&>option]:bg-slate-900 [&>option]:text-white [&>option:hover]:bg-primary-500/20 [&>option:checked]:bg-primary-500/40">
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {t('roomTypeFormat').replace('{name}', rt.name).replace('{price}', rt.basePrice).replace('{occupancy}', rt.maxOccupancy)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('notesOptional')}</label>
                <input name="notes" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('additionalNotesPlaceholder')} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing || roomTypes.length === 0} className="flex-1">{processing ? t('adding') : t('addRoom')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); setFormError(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('editRoom').replace('{number}', selectedRoom.roomNumber)}</h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              handleEditRoom(data); 
            }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('roomNumber')}</label>
                <input name="roomNumber" type="text" required defaultValue={selectedRoom.roomNumber} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('floor')}</label>
                <input name="floor" type="text" required defaultValue={selectedRoom.floor} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('roomType')}</label>
                <select name="roomTypeId" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] [&>option]:bg-slate-900 [&>option]:text-white [&>option:hover]:bg-primary-500/20 [&>option:checked]:bg-primary-500/40">
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id} selected={selectedRoom.roomTypeId === rt.id}>
                      {t('roomTypeEditFormat').replace('{name}', rt.name).replace('{price}', rt.basePrice).replace('{night}', t('night'))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{common('status')}</label>
                <select name="status" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] [&>option]:bg-slate-900 [&>option]:text-white [&>option:hover]:bg-primary-500/20 [&>option:checked]:bg-primary-500/40">
                  {statuses.filter(s => s !== "All").map(s => (
                    <option key={s} value={s} selected={selectedRoom.status === s}>{t(`status${s}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('availability')}</label>
                <select name="isAvailable" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25] [&>option]:bg-slate-900 [&>option]:text-white [&>option:hover]:bg-primary-500/20 [&>option:checked]:bg-primary-500/40">
                  <option value="true" selected={selectedRoom.isAvailable}>{t('available')}</option>
                  <option value="false" selected={!selectedRoom.isAvailable}>{t('notAvailable')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('notesOptional')}</label>
                <input name="notes" type="text" defaultValue={selectedRoom.notes} className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('updating') : t('updateRoom')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedRoom(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedRoom && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('deleteRoom').replace('{number}', selectedRoom.roomNumber)}</h3>
            <p className="text-sm text-[#6B6258] mb-4">{t('confirmDelete')}</p>
            <div className="flex gap-2">
              <Button onClick={handleDeleteRoom} disabled={processing} className="flex-1 bg-red-500 hover:bg-red-600">{processing ? t('deleting') : common('delete')}</Button>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedRoom(null); }} disabled={processing}>{common('cancel')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Type Modal */}
      {showAddRoomTypeModal && (
        <div className="fixed inset-0 bg-[#2F2A25]/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">{t('addNewRoomType')}</h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleAddRoomType(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('name')}</label>
                <input name="name" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('roomTypeNamePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('description')}</label>
                <input name="description" type="text" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('descriptionPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('basePrice')}</label>
                <input name="basePrice" type="number" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('basePricePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('maxOccupancy')}</label>
                <input name="maxOccupancy" type="number" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('maxOccupancyPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('maxAdults')}</label>
                <input name="maxAdults" type="number" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('maxAdultsPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('maxChildren')}</label>
                <input name="maxChildren" type="number" required className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('maxChildrenPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm text-[#6B6258] mb-1">{t('amenities')}</label>
                <input name="amenities" type="text" className="w-full bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg px-3 py-2 text-[#2F2A25]" placeholder={t('amenitiesPlaceholder')} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={processing} className="flex-1">{processing ? t('adding') : t('addRoomType')}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowAddRoomTypeModal(false); setFormError(null); }} disabled={processing}>{common('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
