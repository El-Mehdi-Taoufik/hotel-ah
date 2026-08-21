export type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "CheckedIn"
  | "CheckedOut"
  | "Cancelled"
  | "NoShow"
  | "Reserved";

export type PaymentStatus = "Paid" | "Pending" | "Refunded" | "Partial";

export type RoomStatus =
  | "Available"
  | "Occupied"
  | "Reserved"
  | "Cleaning"
  | "Maintenance"
  | "Out of Service";

export type PaymentMethod =
  | "Cash"
  | "Visa"
  | "Mastercard"
  | "Stripe"
  | "PayPal"
  | "Bank Transfer";

export type UserRole = "Administrator" | "Manager" | "Front Desk" | "Housekeeping";

export interface IdentityDocument {
  id: number;
  reservationId: number;
  guestId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedByUserId?: number;
  uploadedByUserName?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber?: string;
  idNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
  vip: boolean;
  totalStays?: number;
  totalSpent?: number;
  notes?: string;
  createdAt?: string;
  identityDocuments?: IdentityDocument[];
}
export interface RoomType {
  id: string;
  name: string;
  basePrice: number;
  capacity: number;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  price: number;
  capacity: number;
  status: RoomStatus;
  cleaningStatus: "Clean" | "Dirty" | "In Progress";
  amenities: string[];
  image: string;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  payment: PaymentStatus;
  price: number;
}

export interface Payment {
  id: string;
  guestName: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarColor: string;
}
