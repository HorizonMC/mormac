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
  const qrDataUrl = await generateTrackingQR(code);
  const c = {
    dark: cssColor(brand.colors.dark),
    teal: cssColor(brand.colors.teal),
    accent: cssColor(brand.colors.accent),
  };
  const date = new Date(repair.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const customer = repair.customer || { name: "", phone: null, lineUserId: null };
  const safeCode = escapeHtml(code.toUpperCase());
  const safeBrand = {
    name: escapeHtml(brand.name),
    nameTh: escapeHtml(brand.nameTh),
    tagline: escapeHtml(brand.tagline || ""),
    address: escapeHtml(brand.address || ""),
    phone: escapeHtml(brand.phone || ""),
    logo: safeImageSrc(brand.logo),
  };
  const safeRepair = {
    deviceModel: escapeHtml(repair.deviceModel),
    deviceType: escapeHtml(repair.deviceType),
    serialNo: escapeHtml(repair.serialNo || "—"),
    imei: escapeHtml(repair.imei || "—"),
    symptoms: escapeHtml(repair.symptoms),
  };
  const safeCustomer = {
    name: escapeHtml(customer.name || ""),
    phone: escapeHtml(customer.phone || ""),
    line: customer.lineUserId ? "เชื่อมต่อแล้ว" : "—",
  };

  const section = (title: string, copy: string) => `
  <div class="sheet">
    <div class="sheet-header">
      <div class="brand-col">
        ${safeBrand.logo ? `<img src="${safeBrand.logo}" class="brand-logo" alt="">` : ""}
        <div class="brand-name">${safeBrand.name}</div>
        <div class="brand-sub">${safeBrand.nameTh}${safeBrand.tagline ? ` — ${safeBrand.tagline}` : ""}</div>
        ${safeBrand.address ? `<div class="brand-addr">${safeBrand.address}</div>` : ""}
        ${safeBrand.phone ? `<div class="brand-addr">โทร: ${safeBrand.phone}</div>` : ""}
      </div>
      <div class="doc-col">
        <div class="doc-title">${title}</div>
        <div class="doc-no">${safeCode}</div>
        <div class="doc-copy">${copy}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <div class="section-title">ข้อมูลลูกค้า</div>
        <div class="field-row">
          <div class="field"><span class="flabel">ชื่อลูกค้า</span><span class="fvalue">${safeCustomer.name}</span></div>
          <div class="field"><span class="flabel">เบอร์โทร</span><span class="fvalue">${safeCustomer.phone}</span></div>
        </div>
        <div class="field-row">
          <div class="field"><span class="flabel">LINE</span><span class="fvalue">${safeCustomer.line}</span></div>
          <div class="field"><span class="flabel">วันที่รับ</span><span class="fvalue">${date}</span></div>
        </div>
      </div>

      <div class="info-section">
        <div class="section-title">ข้อมูลเครื่อง</div>
        <div class="field-row">
          <div class="field"><span class="flabel">รุ่น/ยี่ห้อ</span><span class="fvalue">${safeRepair.deviceModel}</span></div>
          <div class="field"><span class="flabel">ประเภท</span><span class="fvalue">${safeRepair.deviceType}</span></div>
        </div>
        <div class="field-row">
          <div class="field"><span class="flabel">S/N</span><span class="fvalue">${safeRepair.serialNo}</span></div>
          <div class="field"><span class="flabel">IMEI</span><span class="fvalue">${safeRepair.imei}</span></div>
        </div>
      </div>
    </div>

    <div class="symptoms-box">
      <div class="section-title">อาการเสีย / ปัญหาที่พบ</div>
      <div class="symptoms-text">${safeRepair.symptoms}</div>
    </div>

    <div class="extras-row">
      <div class="extras-box">
        <div class="section-title">อุปกรณ์ที่รับมาด้วย</div>
        <div class="check-grid">
          <label class="check-item"><span class="checkbox"></span> Adapter/สายชาร์จ</label>
          <label class="check-item"><span class="checkbox"></span> เคส/ฟิล์ม</label>
          <label class="check-item"><span class="checkbox"></span> กล่อง</label>
          <label class="check-item"><span class="checkbox"></span> อื่นๆ: ___________</label>
        </div>
      </div>
      <div class="qr-box">
        <img src="${qrDataUrl}" class="qr-img" alt="QR">
        <div class="qr-label">สแกนดูสถานะ</div>
      </div>
    </div>

    ${repair.quotedPrice ? `
    <div class="price-row">
      <div class="price-item"><span class="flabel">ราคาประเมิน</span><span class="price-val">฿${repair.quotedPrice.toLocaleString()}</span></div>
      <div class="price-item"><span class="flabel">ค่าแรง</span><span class="price-val">${repair.laborCost ? `฿${repair.laborCost.toLocaleString()}` : "—"}</span></div>
      <div class="price-item"><span class="flabel">ค่าอะไหล่</span><span class="price-val">${repair.partsCost ? `฿${repair.partsCost.toLocaleString()}` : "—"}</span></div>
    </div>` : ""}

    <div class="terms">
      <div class="section-title">เงื่อนไขการให้บริการ</div>
      <ol>
        <li>ลูกค้ากรุณาเก็บใบรับซ่อมนี้ไว้เป็นหลักฐานในการรับเครื่องคืน</li>
        <li>ร้านจะแจ้งราคาก่อนดำเนินการซ่อม ลูกค้ายืนยันก่อนเริ่มซ่อม</li>
        <li>ลูกค้าสามารถเช็คสถานะได้ทาง LINE หรือสแกน QR Code</li>
        <li>กรุณารับเครื่องภายใน 30 วัน หลังแจ้งซ่อมเสร็จ</li>
        <li>อะไหล่ที่เปลี่ยนรับประกัน 30 วัน (ไม่รวมความเสียหายจากการใช้งาน)</li>
      </ol>
    </div>

    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">ลงชื่อลูกค้า</div>
        <div class="sig-sub">(${safeCustomer.name || "______________________"})</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">ผู้รับเครื่อง</div>
        <div class="sig-sub">(______________________)</div>
      </div>
    </div>

    <div class="sheet-footer">${safeBrand.name} ${safeBrand.nameTh} — ${safeBrand.tagline}</div>
  </div>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ใบรับซ่อม ${safeCode}</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif; color: #222; font-size: 12px; line-height: 1.4; }
  @media print { .no-print { display: none !important; } .page-break { page-break-before: always; } }

  .print-btn { position: fixed; top: 12px; right: 12px; padding: 10px 20px; background: ${c.dark}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; z-index: 100; }
  .cut-line { border: none; border-top: 2px dashed #ccc; margin: 6mm 0; position: relative; }
  .cut-line::after { content: '✂'; position: absolute; top: -10px; left: 20px; background: white; padding: 0 4px; color: #ccc; font-size: 14px; }

  .sheet { border: 1px solid #ddd; border-radius: 8px; padding: 16px 20px; margin: 4px 0; }
  .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${c.dark}; padding-bottom: 10px; margin-bottom: 12px; }
  .brand-col { flex: 1; }
  .brand-logo { height: 36px; margin-bottom: 4px; }
  .brand-name { font-size: 22px; font-weight: 700; color: ${c.dark}; }
  .brand-sub { font-size: 11px; color: ${c.teal}; }
  .brand-addr { font-size: 10px; color: #999; }
  .doc-col { text-align: right; }
  .doc-title { font-size: 16px; font-weight: 700; color: ${c.dark}; border: 2px solid ${c.dark}; display: inline-block; padding: 2px 12px; border-radius: 4px; }
  .doc-no { font-size: 20px; font-weight: 700; font-family: monospace; letter-spacing: 1px; color: ${c.dark}; margin-top: 4px; }
  .doc-copy { font-size: 10px; color: ${c.teal}; margin-top: 2px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .info-section { border: 1px solid #eee; border-radius: 6px; padding: 8px 12px; }
  .section-title { font-size: 11px; font-weight: 700; color: ${c.teal}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #f0f0f0; padding-bottom: 3px; }
  .field-row { display: flex; gap: 12px; margin-bottom: 4px; }
  .field { flex: 1; }
  .flabel { font-size: 10px; color: #999; display: block; }
  .fvalue { font-size: 12px; font-weight: 600; color: #222; }

  .symptoms-box { border: 1px solid #eee; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }
  .symptoms-text { font-size: 13px; font-weight: 500; min-height: 24px; padding: 4px 0; }

  .extras-row { display: flex; gap: 12px; margin-bottom: 10px; }
  .extras-box { flex: 1; border: 1px solid #eee; border-radius: 6px; padding: 8px 12px; }
  .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
  .check-item { font-size: 11px; display: flex; align-items: center; gap: 4px; }
  .checkbox { width: 12px; height: 12px; border: 1.5px solid #ccc; border-radius: 2px; display: inline-block; flex-shrink: 0; }
  .qr-box { width: 100px; text-align: center; flex-shrink: 0; }
  .qr-img { width: 80px; height: 80px; }
  .qr-label { font-size: 9px; color: ${c.teal}; }

  .price-row { display: flex; gap: 12px; margin-bottom: 10px; border: 1px solid #eee; border-radius: 6px; padding: 8px 12px; }
  .price-item { flex: 1; text-align: center; }
  .price-val { font-size: 16px; font-weight: 700; color: ${c.dark}; }

  .terms { border: 1px solid #eee; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; }
  .terms ol { padding-left: 16px; font-size: 9px; color: #666; }
  .terms li { margin-bottom: 1px; }

  .sig-row { display: flex; gap: 40px; justify-content: center; margin: 12px 0 8px; }
  .sig-box { text-align: center; width: 180px; }
  .sig-line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 4px; }
  .sig-label { font-size: 11px; font-weight: 600; }
  .sig-sub { font-size: 10px; color: #999; }

  .sheet-footer { text-align: center; font-size: 9px; color: #ccc; margin-top: 6px; }
</style>
</head><body>
<button class="no-print print-btn" onclick="window.print()">🖨️ พิมพ์ใบรับซ่อม</button>

${section("ใบรับซ่อม", "ต้นฉบับ — เก็บไว้ที่ร้าน")}

<div class="cut-line no-print"></div>
<hr class="cut-line" style="display:none;" media="print">

${section("ใบรับซ่อม", "สำเนา — มอบให้ลูกค้า")}

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

function safeImageSrc(value: unknown): string {
  const src = String(value ?? "");
  if (src.startsWith("/") || /^https:\/\/[^\s"'<>]+$/i.test(src) || /^data:image\/[a-z+.-]+;base64,[a-z0-9+/=]+$/i.test(src)) {
    return escapeHtml(src);
  }
  return "";
}
