import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { generateTrackingQR } from "@/lib/qr";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code || !/^MOR-\d{4}-\d{4}$/i.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const repair = await db.repairs.getByCode(code.toUpperCase());
  if (!repair) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brand = await getBrand();
  const qrDataUrl = await generateTrackingQR(code.toUpperCase());
  const meta = parseRepairMeta(repair.photos);
  const customerName = repair.customer?.name && repair.customer.name !== "LINE User"
    ? repair.customer.name
    : "____________________________";
  const returnAddress = meta?.returnAddress;
  const deviceSpecs = meta?.specs;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ใบปะหน้าซอง — ${escapeHtml(code.toUpperCase())}</title>
<style>@page{size:A5;margin:10mm}body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:20px;color:#222}.header{text-align:center;border-bottom:2px solid ${cssColor(brand.colors.dark)};padding-bottom:10px;margin-bottom:15px}.header h1{margin:0;font-size:24px;color:${cssColor(brand.colors.dark)}}.header p{margin:2px 0;font-size:12px;color:${cssColor(brand.colors.teal)}}.qr{text-align:center;margin:12px 0}.qr img{width:132px;height:132px}.code{text-align:center;font-size:26px;font-weight:bold;font-family:monospace;letter-spacing:2px;margin:8px 0}.ship-title{font-size:13px;font-weight:bold;color:${cssColor(brand.colors.dark)};margin-bottom:6px;text-transform:uppercase}.address-box{border:2px solid ${cssColor(brand.colors.dark)};border-radius:10px;padding:14px;margin:12px 0;min-height:100px}.address-box.to{min-height:140px;border-width:3px}.address-name{font-size:22px;font-weight:800;margin-bottom:8px}.address-line{font-size:15px;line-height:1.5}.muted{color:#777}.info{border:1px solid #ddd;border-radius:8px;padding:12px;margin:10px 0}.info .row{display:flex;margin:4px 0;font-size:13px}.info .label{width:80px;color:${cssColor(brand.colors.teal)};flex-shrink:0}.info .value{font-weight:500}.footer{text-align:center;font-size:10px;color:#999;margin-top:16px;border-top:1px solid #eee;padding-top:10px}.cut{border-top:2px dashed #ccc;margin:18px 0}.note{font-size:11px;color:${cssColor(brand.colors.teal)};text-align:center}@media print{.no-print{display:none}}</style>
</head><body>
<button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:8px 16px;background:${cssColor(brand.colors.dark)};color:white;border:none;border-radius:6px;cursor:pointer">พิมพ์</button>
<div class="header"><h1>${escapeHtml(brand.name)}</h1><p>${escapeHtml(brand.nameTh)} — ${escapeHtml(brand.tagline)}</p></div>

<div class="address-box to">
  <div class="ship-title">TO / ส่งถึงร้าน</div>
  <div class="address-name">${escapeHtml(brand.name)} ${escapeHtml(brand.nameTh)}</div>
  <div class="address-line">${escapeHtml(brand.address || "ที่อยู่ร้าน: ____________________________________________")}</div>
  <div class="address-line">โทร: ${escapeHtml(brand.phone || "________________")}</div>
</div>

<div class="qr"><img src="${escapeHtml(qrDataUrl)}" alt="QR"/></div>
<div class="code">${escapeHtml(code.toUpperCase())}</div>

<div class="address-box">
  <div class="ship-title">FROM / ผู้ส่ง (ลูกค้า)</div>
  <div class="address-name">${escapeHtml(customerName)}</div>
  ${returnAddress
    ? `<div class="address-line">${escapeHtml(returnAddress)}</div>`
    : `<div class="address-line muted">ที่อยู่: ____________________________________________</div>`}
  <div class="address-line">โทร: ${escapeHtml(repair.customer?.phone || "________________")}</div>
</div>

<div class="info">
  <div class="row"><span class="label">อุปกรณ์</span><span class="value">${escapeHtml(repair.deviceModel)}</span></div>
  ${deviceSpecs ? `<div class="row"><span class="label">สเปก</span><span class="value">${escapeHtml(deviceSpecs)}</span></div>` : ""}
  <div class="row"><span class="label">อาการ</span><span class="value">${escapeHtml(repair.symptoms)}</span></div>
  <div class="row"><span class="label">วันที่</span><span class="value">${new Date(repair.createdAt).toLocaleDateString("th-TH")}</span></div>
</div>

<div class="note">กรุณาแปะใบนี้ไว้ที่ซองหรือกล่องส่งเครื่อง</div>
<div class="cut"></div>
<div class="info">
<div class="row"><span class="label">สำหรับร้าน</span><span class="value">${escapeHtml(brand.name)} ${escapeHtml(brand.nameTh)}</span></div>
<div class="row"><span class="label">เลขซ่อม</span><span class="value" style="font-family:monospace;font-size:16px;font-weight:bold">${escapeHtml(code.toUpperCase())}</span></div>
<div class="row"><span class="label">อุปกรณ์</span><span class="value">${escapeHtml(repair.deviceModel)} (${escapeHtml(repair.deviceType)})</span></div>
<div class="row"><span class="label">อาการ</span><span class="value">${escapeHtml(repair.symptoms)}</span></div>
</div>
<div class="footer">${escapeHtml(brand.name)} ${escapeHtml(brand.nameTh)}</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] || char));
}

function cssColor(value: unknown): string {
  const color = String(value ?? "");
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : "#0F1720";
}

function parseRepairMeta(value: string | null | undefined): { returnAddress?: string; specs?: string } | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
