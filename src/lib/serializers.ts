import type { User, Guest, Room, RoomType, Reservation, Payment, ReservationRoom } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? undefined,
    role: user.role,
    isActive: user.isActive,
    avatarColor: user.avatarColor ?? undefined,
    preferredLanguage: user.preferredLanguage ?? undefined,
  };
}

export function serializeGuest(guest: Guest) {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email ?? undefined,
    phoneNumber: guest.phoneNumber ?? undefined,
    nationality: guest.nationality ?? undefined,
    passportNumber: guest.passportNumber ?? undefined,
    idNumber: guest.idNumber ?? undefined,
    address: guest.address ?? undefined,
    isVip: guest.isVip,
    totalStays: guest.totalStays,
    totalSpent: guest.totalSpent,
    notes: guest.notes ?? undefined,
    createdAt: guest.createdAt.toISOString(),
  };
}

export function serializeRoomType(roomType: RoomType) {
  return {
    id: roomType.id,
    name: roomType.name,
    slug: roomType.slug ?? undefined,
    description: roomType.description ?? undefined,
    basePrice: roomType.basePrice,
    maxOccupancy: roomType.maxOccupancy,
    maxAdults: roomType.maxAdults,
    maxChildren: roomType.maxChildren,
    amenities: roomType.amenities ?? undefined,
    imageUrl: roomType.imageUrl ?? undefined,
    createdAt: roomType.createdAt,
  };
}

export function serializeRoom(room: Room & { roomType: RoomType }) {
  return {
    id: room.id,
    roomNumber: room.roomNumber,
    floor: room.floor,
    status: room.status,
    isAvailable: room.isAvailable,
    notes: room.notes ?? undefined,
    roomTypeId: room.roomTypeId,
    roomType: serializeRoomType(room.roomType),
    createdAt: room.createdAt.toISOString(),
  };
}

type ReservationWithRelations = Reservation & {
  guest: Guest;
  rooms: (ReservationRoom & { room: Room & { roomType: RoomType } })[];
};

export function serializeReservation(reservation: ReservationWithRelations) {
  const firstRoom = reservation.rooms[0]?.room;
  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    checkInDate: reservation.checkInDate.toISOString(),
    checkOutDate: reservation.checkOutDate.toISOString(),
    adults: reservation.adults,
    children: reservation.children,
    status: reservation.status,
    totalAmount: reservation.totalAmount,
    depositAmount: reservation.depositAmount,
    discountAmount: reservation.discountAmount,
    specialRequests: reservation.specialRequests ?? undefined,
    checkedInAt: reservation.checkedInAt?.toISOString(),
    checkedOutAt: reservation.checkedOutAt?.toISOString(),
    guest: {
      id: reservation.guest.id,
      firstName: reservation.guest.firstName,
      lastName: reservation.guest.lastName,
      email: reservation.guest.email ?? undefined,
      phoneNumber: reservation.guest.phoneNumber ?? undefined,
      nationality: reservation.guest.nationality ?? undefined,
      passportNumber: reservation.guest.passportNumber ?? undefined,
      address: reservation.guest.address ?? undefined,
      isVip: reservation.guest.isVip,
      totalStays: reservation.guest.totalStays,
      totalSpent: reservation.guest.totalSpent,
      notes: reservation.guest.notes ?? undefined,
    },
    room: firstRoom
      ? { id: firstRoom.id, roomNumber: firstRoom.roomNumber, floor: firstRoom.floor }
      : undefined,
    rooms: reservation.rooms.map((rr) => ({
      id: rr.room.id,
      roomNumber: rr.room.roomNumber,
      floor: rr.room.floor,
      status: rr.room.status,
      notes: rr.room.notes ?? undefined,
      roomType: {
        id: rr.room.roomType.id,
        name: rr.room.roomType.name,
        description: rr.room.roomType.description ?? "",
        basePrice: rr.room.roomType.basePrice,
        maxOccupancy: rr.room.roomType.maxOccupancy,
        imageUrl: rr.room.roomType.imageUrl ?? undefined,
      },
    })),
    paymentStatus: reservation.status === "CheckedOut" || reservation.status === "Confirmed" ? "Paid" : "Pending",
  };
}

export function serializePayment(
  payment: Payment & { reservation: Reservation & { guest: Guest } }
) {
  return {
    id: payment.id,
    paymentNumber: payment.paymentNumber,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate.toISOString(),
    status: payment.status,
    guest: {
      id: payment.reservation.guest.id,
      firstName: payment.reservation.guest.firstName,
      lastName: payment.reservation.guest.lastName,
    },
    reservation: {
      id: payment.reservation.id,
      reservationNumber: payment.reservation.reservationNumber,
    },
  };
}
