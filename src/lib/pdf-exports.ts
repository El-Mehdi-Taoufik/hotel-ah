import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AnyRecord = Record<string, any>;

const GOLD = [140, 106, 67] as const;
const BORDER = [225, 220, 212] as const;
const TEXT = [47, 42, 37] as const;
const MUTED = [105, 98, 90] as const;
const LIGHT = [248, 246, 242] as const;

const money = (value: any) => `${Number(value ?? 0).toFixed(2)} DH`;
const date = (value: any) => value ? new Date(value).toLocaleDateString("en-GB") : "";
const dateLong = (value: any) => value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
const guestName = (g: AnyRecord | undefined) => `${g?.firstName ?? ""} ${g?.lastName ?? ""}`.trim() || "N/A";
const roomOf = (r: AnyRecord | undefined) => r?.rooms?.[0]?.room?.roomNumber ?? r?.rooms?.[0]?.room?.number ?? r?.rooms?.[0]?.number ?? r?.room?.roomNumber ?? r?.room?.number ?? "N/A";
const roomTypeOf = (r: AnyRecord | undefined) => r?.rooms?.[0]?.room?.roomType?.name ?? r?.room?.roomType?.name ?? "";

function box(doc: jsPDF, x: number, y: number, w: number, h: number, fill = LIGHT) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");
}

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Hotel Aguelman", 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  if (subtitle) doc.text(subtitle, 14, 25);
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 196, 18, { align: "right" });
}

function footer(doc: jsPDF) {
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BORDER);
  doc.line(14, h - 28, 196, h - 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Cachet de l'hôtel", 14, h - 20);
  doc.text("Signature Réception", 196, h - 20, { align: "right" });
}

function stamp(doc: jsPDF, y: number) {
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text("Official Hotel Stamp", 105, y, { align: "center" });
  doc.setDrawColor(...MUTED);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.circle(105, y + 18, 15);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(8);
  doc.text("STAMP", 105, y + 20, { align: "center" });
}

export function exportReservationPdf(reservation: AnyRecord) {
  const doc = new jsPDF("p", "mm", "a4");
  header(doc, "RESERVATION", "Hotel Management System");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Reservation Number: ${reservation.reservationNumber ?? "N/A"}`, 14, 34);
  doc.text(`Date: ${dateLong(new Date())}`, 196, 34, { align: "right" });

  box(doc, 14, 42, 182, 32, [252, 252, 252]);
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Guest Information", 20, 51);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text(`Guest Name: ${guestName(reservation.guest)}`, 20, 59);
  doc.text(`Guest Email: ${reservation.guest?.email ?? ""}`, 20, 65);
  doc.text(`Guest Phone: ${reservation.guest?.phoneNumber ?? ""}`, 20, 71);

  box(doc, 14, 80, 182, 27, [252, 252, 252]);
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Room Details", 20, 89);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text(`Room Number: ${roomOf(reservation)}`, 20, 97);
  doc.text(`Room Type: ${roomTypeOf(reservation)}`, 20, 103);

  box(doc, 14, 113, 182, 35, [252, 252, 252]);
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Stay Details", 20, 122);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text(`Check In: ${dateLong(reservation.checkInDate)}`, 20, 131);
  doc.text(`Check Out: ${dateLong(reservation.checkOutDate)}`, 110, 131);
  doc.text(`Adults: ${reservation.adults ?? 0}`, 20, 140);
  doc.text(`Children: ${reservation.children ?? 0}`, 110, 140);

  box(doc, 14, 154, 182, 35, [252, 252, 252]);
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Payment Information", 20, 163);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text("Total Amount:", 20, 173); doc.text(money(reservation.totalAmount), 190, 173, { align: "right" });
  doc.text("Deposit Amount:", 20, 181); doc.text(money(reservation.depositAmount), 190, 181, { align: "right" });
  doc.text("Payment Status:", 20, 189); doc.text(reservation.paymentStatus ?? "Pending", 190, 189, { align: "right" });

  stamp(doc, 209);
  footer(doc);
  doc.save(`Reservation-${reservation.reservationNumber ?? "document"}.pdf`);
}

export function exportInvoicePdf(payment: AnyRecord) {
  const reservation = payment.reservation ?? {};
  const doc = new jsPDF("p", "mm", "a4");
  header(doc, `FACTURE N° ${payment.paymentNumber ?? ""}`, `Date: ${date(payment.paymentDate ?? new Date())}`);

  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT);
  doc.text(`Client: ${guestName(reservation.guest)}`, 14, 34);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text(`ICE / CIN: ${reservation.guest?.idNumber ?? reservation.guest?.passportNumber ?? ""}`, 14, 41);

  autoTable(doc, {
    startY: 52,
    margin: { left: 14, right: 14 },
    head: [["Désignation des prestations", "PRIX", "NUITEES", "TOTAL"]],
    body: [[
      `Chambre ${roomOf(reservation)}`,
      money((reservation.totalAmount ?? payment.amount ?? 0) / Math.max(1, Number(reservation.nights ?? 1))),
      String(reservation.nights ?? Math.max(1, Math.round((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / 86400000))),
      money(payment.amount ?? reservation.totalAmount),
    ]],
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: TEXT, fontStyle: "bold", lineColor: BORDER, lineWidth: 0.25 },
    bodyStyles: { textColor: TEXT, lineColor: BORDER, lineWidth: 0.25 },
    styles: { fontSize: 9, cellPadding: 4, halign: "center" },
  });

  const y = (doc as any).lastAutoTable?.finalY ?? 80;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...TEXT);
  doc.text(`TOTAL TTC ${money(payment.amount ?? reservation.totalAmount)}`, 196, y + 18, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...MUTED);
  doc.text("Arrêtée la présente facture à la somme de :", 14, y + 34);
  doc.setFont("helvetica", "italic");
  doc.text(`${money(payment.amount ?? reservation.totalAmount)}`, 14, y + 42);

  doc.setDrawColor(...BORDER);
  doc.rect(14, y + 55, 78, 24);
  doc.rect(118, y + 55, 78, 24);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text("Cachet de l'hôtel", 14, y + 84);
  doc.text("Signature Réception", 118, y + 84);
  doc.save(`Invoice-${payment.paymentNumber ?? "document"}.pdf`);
}

export function exportCurrentGuestsPdf(reservations: AnyRecord[]) {
  const doc = new jsPDF("p", "mm", "a4");
  header(doc, "CURRENT GUESTS", `Current Guests Report - ${date(new Date())}`);
  const rows = reservations.map((r) => [
    r.guest?.firstName ?? "",
    r.guest?.lastName ?? "",
    r.guest?.idNumber ?? r.guest?.passportNumber ?? "",
    r.guest?.phoneNumber ?? "",
  ]);
  autoTable(doc, {
    startY: 34,
    margin: { left: 14, right: 14 },
    head: [["First Name", "Last Name", "CIN / Passport", "Phone Number"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: TEXT, fontStyle: "bold", lineColor: BORDER, lineWidth: 0.25 },
    bodyStyles: { textColor: TEXT, lineColor: BORDER, lineWidth: 0.25 },
    styles: { fontSize: 9, cellPadding: 4 },
  });
  footer(doc);
  doc.save(`CurrentGuests_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportGuestProfilePdf(guest: AnyRecord, reservations: AnyRecord[], payments: AnyRecord[]) {
  const doc = new jsPDF("p", "mm", "a4");
  header(doc, "GUEST PROFILE", "HOTEL INFORMATION");
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...TEXT); doc.text("Hotel Aguelman", 105, 28, { align: "center" });
  doc.setDrawColor(...BORDER); doc.line(65, 32, 145, 32);

  doc.setFontSize(11); doc.text("GUEST INFORMATION", 14, 44);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...MUTED);
  const info = [
    ["Full Name", guestName(guest)],
    ["Nationality", guest.nationality ?? ""],
    ["CIN / Passport Number", guest.idNumber ?? guest.passportNumber ?? ""],
    ["Phone", guest.phoneNumber ?? ""],
    ["Email", guest.email ?? ""],
    ["Address", guest.address ?? ""],
  ];
  autoTable(doc, { startY: 49, body: info, theme: "plain", styles: { fontSize: 9, cellPadding: 2.5 }, columnStyles: { 0: { fontStyle: "bold", textColor: TEXT, cellWidth: 55 }, 1: { textColor: MUTED } } });

  const afterInfo = (doc as any).lastAutoTable?.finalY ?? 78;
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("RESERVATION HISTORY", 105, afterInfo + 14, { align: "center" });
  autoTable(doc, {
    startY: afterInfo + 19,
    margin: { left: 14, right: 14 },
    head: [["Res #", "Room", "Room Type", "Check-in", "Check-out", "Nights", "Status"]],
    body: reservations.map((r) => [r.reservationNumber ?? "", roomOf(r), roomTypeOf(r), date(r.checkInDate), date(r.checkOutDate), r.nights ?? "", r.status ?? ""]),
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: TEXT, fontStyle: "bold", lineColor: BORDER, lineWidth: 0.25 },
    bodyStyles: { textColor: TEXT, lineColor: BORDER, lineColor: BORDER, lineWidth: 0.25 },
    styles: { fontSize: 7, cellPadding: 2.5 },
  });

  const afterReservations = (doc as any).lastAutoTable?.finalY ?? afterInfo + 55;
  doc.setTextColor(...TEXT); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("PAYMENT HISTORY", 105, afterReservations + 14, { align: "center" });
  autoTable(doc, {
    startY: afterReservations + 19,
    margin: { left: 14, right: 14 },
    head: [["Invoice #", "Date", "Method", "Amount", "Balance"]],
    body: payments.map((p) => [p.paymentNumber ?? "", date(p.paymentDate), p.paymentMethod ?? "", money(p.amount), "0 DH"]),
    theme: "grid",
    headStyles: { fillColor: [245, 245, 245], textColor: TEXT, fontStyle: "bold", lineColor: BORDER, lineWidth: 0.25 },
    bodyStyles: { textColor: TEXT, lineColor: BORDER, lineWidth: 0.25 },
    styles: { fontSize: 8, cellPadding: 3 },
  });
  const afterPayments = (doc as any).lastAutoTable?.finalY ?? afterReservations + 50;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...TEXT);
  const lifetime = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  doc.text(`Total Lifetime Spending (DH)`, 105, afterPayments + 18, { align: "center" });
  doc.text(money(lifetime), 105, afterPayments + 25, { align: "center" });
  footer(doc);
  doc.save(`GuestProfile_${guest.id ?? "guest"}.pdf`);
}
