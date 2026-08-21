export interface RoomTypeInfo {
  category: string;
  size: string;
  bed: string;
  capacity: string;
  description: string;
}

const ROOM_TYPE_INFO_MAP: Record<number, RoomTypeInfo> = {
  1: {
    category: 'Classic Room',
    size: '24 m²',
    bed: 'Double Bed',
    capacity: '2 Guests',
    description: 'A cozy and elegant room with warm tones, designed for comfortable everyday stays. Ideal for solo travelers or couples.',
  },
  2: {
    category: 'Grand Room',
    size: '32 m²',
    bed: 'Queen Bed',
    capacity: '2 Guests',
    description: 'Spacious and bright room offering extra comfort with premium furnishings and a relaxing atmosphere.',
  },
  3: {
    category: 'Deluxe Room',
    size: '36 m²',
    bed: 'King Bed',
    capacity: '2 Guests',
    description: 'A luxurious room featuring premium furniture, modern amenities, and a private seating area for an exceptional stay.',
  },
  4: {
    category: 'Royal Suite',
    size: '60 m²',
    bed: 'King Bed + Living Area',
    capacity: '4 Guests',
    description: 'Our finest accommodation, combining luxury, generous space, elegant design, and exclusive comfort for families and VIP guests.',
  },
};

export function getRoomTypeImage(roomTypeId?: number): string {
  if (!roomTypeId) {
    console.log('[getRoomTypeImage] No roomTypeId provided, returning default');
    return '/room-images/default.jpg';
  }
  return `/room-images/${roomTypeId}.jpg`;
}

export function getRoomTypeInfo(roomTypeId?: number): RoomTypeInfo | null {
  if (!roomTypeId) return null;
  return ROOM_TYPE_INFO_MAP[roomTypeId] || null;
}

export function getAllRoomTypeInfo(): Record<number, RoomTypeInfo> {
  return ROOM_TYPE_INFO_MAP;
}
