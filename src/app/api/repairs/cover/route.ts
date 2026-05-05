import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-client";
import { getBrand } from "@/lib/brand";
import { generateTrackingQR } from "@/lib/qr";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const repair = await db.repairs.getByCode(code);
  if (!repair) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brand = await getBrand();
  const qrDataUrl = await generateTrackingQR(code);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ใบปะหน้าซอง — ${code}</title>
<style>@page{size:A5;margin:10mm}body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:20px;color:#333}.header{text-align:center;border-bottom:2px solid ${brand.colors.dark};padding-bottom:10px;margin-bottom:15px}.header h1{margin:0;font-size:24px;color:${brand.colors.dark}}.header p{margin:2px 0;font-size:12px;color:${brand.colors.teal}}.qr{text-align:center;margin:15px 0}.qr img{width:150px;height:150px}.code{text-align:center;font-size:28px;font-weight:bold;font-family:monospace;letter-spacing:2px;margin:10px 0}.info{border:1px solid #ddd;border-radius:8px;padding:12px;margin:10px 0}.info .row{display:flex;margin:4px 0;font-size:13px}.info .label{width:80px;color:${brand.colors.teal};flex-shrink:0}.info .value{font-weight:500}.footer{text-align:center;font-size:10px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:10px}.cut{border-top:2px dashed #ccc;margin:20px 0}.note{font-size:11px;color:${brand.colors.teal};text-align:center}@media print{.no-print{display:none}}</style>
</head><body>
<button class="no-print" onclick="window.print()" style="position:fixed;top:10px;right:10px;padding:8px 16px;background:${brand.colors.dark};color:white;border:none;border-radius:6px;cursor:pointer">🖨️ พิมพ์</button>
<div class="header"><h1>${brand.name}</h1><p>${brand.nameTh} — ${brand.tagline}</p></div>
<div class="qr"><img src="${qrDataUrl}" alt="QR"/></div>
<div class="code">${code}</div>
<div class="info">
<div class="row"><span class="label">ลูกค้า</span><span class="value">${repair.customer?.name || ""}</span></div>
<div class="row"><span class="label">โทร</span><span class="value">${repair.customer?.phone || "—"}</span></div>
<div class="row"><span class="label">อุปกรณ์</span><span class="value">${repair.deviceModel}</span></div>
<div class="row"><span class="label">อาการ</span><span class="value">${repair.symptoms}</span></div>
<div class="row"><span class="label">วันที่</span><span class="value">${new Date(repair.createdAt).toLocaleDateString("th-TH")}</span></div>
</div>
<div class="note">กรุณาแปะใบนี้ไว้ที่ซองหรือกล่องส่งเครื่อง</div>
<div class="cut"></div>
<div class="info">
<div class="row"><span class="label">สำหรับร้าน</span><span class="value">${repair.shop?.name || brand.name}</span></div>
<div class="row"><span class="label">เลขซ่อม</span><span class="value" style="font-family:monospace;font-size:16px;font-weight:bold">${code}</span></div>
<div class="row"><span class="label">อุปกรณ์</span><span class="value">${repair.deviceModel} (${repair.deviceType})</span></div>
<div class="row"><span class="label">อาการ</span><span class="value">${repair.symptoms}</span></div>
</div>
<div class="footer">${brand.name} ${brand.nameTh}</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
