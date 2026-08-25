"use client";

import { useEffect, useState } from "react";
import { FileText, ReceiptText, UsersRound, UserRound, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  exportCurrentGuestsPdf,
  exportGuestProfilePdf,
  exportInvoicePdf,
  exportReservationPdf,
} from "@/lib/pdf-exports";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  const body = await response.json();
  if (!body.success) throw new Error(body.message || "Request failed");
  return body.data as T;
}

export default function PdfExports() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedGuest, setSelectedGuest] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [reservationData, paymentData, guestData] = await Promise.all([
          getJson<any[]>("/api/reservations?pageNumber=1&pageSize=1000"),
          getJson<any[]>("/api/payments"),
          getJson<any[]>("/api/guests"),
        ]);
        setReservations(reservationData || []);
        setPayments(paymentData || []);
        setGuests(guestData || []);
        if (reservationData?.[0]) setSelectedReservation(String(reservationData[0].id));
        if (paymentData?.[0]) setSelectedPayment(String(paymentData[0].id));
        if (guestData?.[0]) setSelectedGuest(String(guestData[0].id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load PDF data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const run = async (name: string, action: () => void) => {
    try {
      setBusy(name);
      setError(null);
      action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setBusy(null);
    }
  };

  const selectedReservationData = reservations.find((r) => String(r.id) === selectedReservation);
  const selectedPaymentData = payments.find((p) => String(p.id) === selectedPayment);
  const selectedGuestData = guests.find((g) => String(g.id) === selectedGuest);
  const currentGuests = reservations.filter((r) => r.status === "CheckedIn");
  const guestReservations = selectedGuestData
    ? reservations.filter((r) => Number(r.guestId ?? r.guest?.id) === Number(selectedGuestData.id))
    : [];
  const guestPayments = selectedGuestData
    ? payments.filter((p) => Number(p.reservation?.guest?.id) === Number(selectedGuestData.id))
    : [];

  return (
    <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl gradient-primary text-white flex items-center justify-center">
          <Download size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2F2A25]">PDF Exports</h3>
          <p className="text-sm text-[#6B6258]">Professional hotel documents in the same format as your reference forms.</p>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-sm text-[#6B6258]">Loading export data…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#E7DFD4] p-5">
            <div className="flex items-center gap-3 mb-4"><FileText size={20} className="text-[#8C6A43]" /><div><h4 className="font-medium">Reservation PDF</h4><p className="text-xs text-[#6B6258]">Guest, room, stay and payment details.</p></div></div>
            <select value={selectedReservation} onChange={(e) => setSelectedReservation(e.target.value)} className="w-full mb-3 rounded-lg border border-[#E7DFD4] bg-[#F8F6F2] px-3 py-2 text-sm">
              {reservations.map((r) => <option key={r.id} value={r.id}>{r.reservationNumber} — {r.guest?.firstName} {r.guest?.lastName}</option>)}
            </select>
            <Button disabled={!selectedReservationData || busy === "reservation"} onClick={() => run("reservation", () => exportReservationPdf(selectedReservationData))}><FileText size={15} /> {busy === "reservation" ? "Generating…" : "Export Reservation PDF"}</Button>
          </div>

          <div className="rounded-xl border border-[#E7DFD4] p-5">
            <div className="flex items-center gap-3 mb-4"><ReceiptText size={20} className="text-[#8C6A43]" /><div><h4 className="font-medium">Invoice PDF</h4><p className="text-xs text-[#6B6258]">Invoice number, room, nights, total and signatures.</p></div></div>
            <select value={selectedPayment} onChange={(e) => setSelectedPayment(e.target.value)} className="w-full mb-3 rounded-lg border border-[#E7DFD4] bg-[#F8F6F2] px-3 py-2 text-sm">
              {payments.map((p) => <option key={p.id} value={p.id}>{p.paymentNumber} — {p.reservation?.guest?.firstName} {p.reservation?.guest?.lastName} — {Number(p.amount ?? 0).toFixed(2)} DH</option>)}
            </select>
            <Button disabled={!selectedPaymentData || busy === "invoice"} onClick={() => run("invoice", () => exportInvoicePdf(selectedPaymentData))}><ReceiptText size={15} /> {busy === "invoice" ? "Generating…" : "Export Invoice PDF"}</Button>
          </div>

          <div className="rounded-xl border border-[#E7DFD4] p-5">
            <div className="flex items-center gap-3 mb-4"><UsersRound size={20} className="text-[#8C6A43]" /><div><h4 className="font-medium">Current Guests PDF</h4><p className="text-xs text-[#6B6258]">First name, last name, CIN/passport and phone.</p></div></div>
            <p className="text-sm text-[#6B6258] mb-3">{currentGuests.length} currently checked-in guest reservation(s).</p>
            <Button disabled={busy === "current-guests"} onClick={() => run("current-guests", () => exportCurrentGuestsPdf(currentGuests))}><UsersRound size={15} /> {busy === "current-guests" ? "Generating…" : "Export Current Guests PDF"}</Button>
          </div>

          <div className="rounded-xl border border-[#E7DFD4] p-5">
            <div className="flex items-center gap-3 mb-4"><UserRound size={20} className="text-[#8C6A43]" /><div><h4 className="font-medium">Guest Profile PDF</h4><p className="text-xs text-[#6B6258]">Guest information, reservation history and payment history.</p></div></div>
            <select value={selectedGuest} onChange={(e) => setSelectedGuest(e.target.value)} className="w-full mb-3 rounded-lg border border-[#E7DFD4] bg-[#F8F6F2] px-3 py-2 text-sm">
              {guests.map((g) => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
            </select>
            <Button disabled={!selectedGuestData || busy === "guest-profile"} onClick={() => run("guest-profile", () => exportGuestProfilePdf(selectedGuestData, guestReservations, guestPayments))}><UserRound size={15} /> {busy === "guest-profile" ? "Generating…" : "Export Guest Profile PDF"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
