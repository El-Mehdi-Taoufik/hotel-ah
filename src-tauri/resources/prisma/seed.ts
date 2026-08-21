import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@hotel.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@hotel.com",
      password: adminPassword,
      role: "Administrator",
      isActive: true,
      avatarColor: "#B38B59",
    },
  });

  const roomTypes = [
    { name: "Standard Twin", basePrice: 129, maxOccupancy: 2, maxAdults: 2, maxChildren: 0, description: "Comfortable twin room" },
    { name: "Deluxe King", basePrice: 189, maxOccupancy: 2, maxAdults: 2, maxChildren: 1, description: "Spacious king room" },
    { name: "Executive Suite", basePrice: 349, maxOccupancy: 3, maxAdults: 3, maxChildren: 1, description: "Executive suite with city view" },
    { name: "Presidential Suite", basePrice: 699, maxOccupancy: 4, maxAdults: 4, maxChildren: 2, description: "Top-floor presidential suite" },
  ];

  for (const rt of roomTypes) {
    const existing = await prisma.roomType.findFirst({ where: { name: rt.name } });
    if (!existing) {
      await prisma.roomType.create({ data: rt });
    }
  }

  const allRoomTypes = await prisma.roomType.findMany();
  const byName = (name: string) => allRoomTypes.find((r) => r.name === name)!;

  const rooms = [
    { roomNumber: "101", floor: "1", roomTypeName: "Deluxe King" },
    { roomNumber: "102", floor: "1", roomTypeName: "Standard Twin" },
    { roomNumber: "108", floor: "1", roomTypeName: "Deluxe King" },
    { roomNumber: "205", floor: "2", roomTypeName: "Executive Suite" },
    { roomNumber: "207", floor: "2", roomTypeName: "Deluxe King" },
    { roomNumber: "301", floor: "3", roomTypeName: "Presidential Suite" },
  ];

  for (const room of rooms) {
    const existing = await prisma.room.findUnique({ where: { roomNumber: room.roomNumber } });
    if (!existing) {
      await prisma.room.create({
        data: {
          roomNumber: room.roomNumber,
          floor: room.floor,
          roomTypeId: byName(room.roomTypeName).id,
        },
      });
    }
  }

  const defaultSettings: Record<string, unknown> = {
    hotel: {
      hotelName: "Hotel Aguelmam",
      address: "",
      phone: "",
      email: "",
      currency: "MAD",
      timeZone: "Africa/Casablanca",
      language: "en",
    },
    reservation: {
      defaultCheckInTime: "14:00",
      defaultCheckOutTime: "12:00",
      reservationPrefix: "RES",
      autoConfirmReservations: false,
      allowOverbooking: false,
    },
    payment: {
      taxPercentage: 20,
      depositPercentage: 30,
      defaultPaymentMethod: "Cash",
    },
    system: {
      theme: "light",
      fontSize: "medium",
      compactMode: false,
      sidebarCollapsed: false,
      sidebarPosition: "left",
      enableNotifications: true,
      enableEmailNotifications: false,
      enableSoundNotifications: false,
      enableDesktopNotifications: false,
      autoLogoutTimeout: 30,
      rememberMe: true,
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      defaultLanguage: "en",
      defaultCurrency: "MAD",
      defaultTax: 20,
    },
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value), category: key },
    });
  }

  console.log("Seed complete. Admin login: admin@hotel.com / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
