function datePart() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

function randomDigits(length: number) {
  return String(Math.floor(Math.random() * 10 ** length)).padStart(length, "0");
}

export function generateReservationNumber() {
  return `RES-${datePart()}-${randomDigits(4)}`;
}

export function generatePaymentNumber() {
  return `PAY-${datePart()}-${randomDigits(4)}`;
}
