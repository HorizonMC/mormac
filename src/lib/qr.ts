import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function generateTrackingQR(repairCode: string): Promise<string> {
  const url = `${BASE_URL}/track/${repairCode}`;
  return QRCode.toDataURL(url, { width: 300, margin: 2 });
}

export function getTrackingUrl(repairCode: string): string {
  return `${BASE_URL}/track/${repairCode}`;
}
