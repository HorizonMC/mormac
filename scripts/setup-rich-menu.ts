import { createCanvas } from "@napi-rs/canvas";

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const API = "https://api.line.me/v2/bot";
const API_DATA = "https://api-data.line.me/v2/bot";

const C = {
  dark: "#0F1720",
  dark2: "#1A2634",
  accent: "#28EF33",
  mint: "#85C1B2",
  teal: "#4A7A8A",
  white: "#FFFFFF",
};

async function lineAPI(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

function drawWrenchIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = size * 0.12;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.4;
  // Wrench handle
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, s * 0.8);
  ctx.lineTo(s * 0.2, -s * 0.2);
  ctx.stroke();
  // Wrench head
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.4, s * 0.45, -Math.PI * 0.7, Math.PI * 0.3, false);
  ctx.stroke();
  // Phone outline
  ctx.strokeStyle = C.mint;
  ctx.lineWidth = size * 0.08;
  const pw = s * 0.55, ph = s * 0.9;
  ctx.beginPath();
  ctx.roundRect(-pw - s * 0.3, -ph * 0.3, pw, ph, s * 0.1);
  ctx.stroke();

  ctx.restore();
}

function drawClipboardIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = "round";

  const s = size * 0.4;
  // Clipboard body
  ctx.beginPath();
  ctx.roundRect(-s * 0.65, -s * 0.5, s * 1.3, s * 1.4, s * 0.12);
  ctx.stroke();
  // Clip top
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  ctx.roundRect(-s * 0.3, -s * 0.7, s * 0.6, s * 0.35, s * 0.08);
  ctx.fill();
  // Check lines
  ctx.strokeStyle = C.mint;
  ctx.lineWidth = size * 0.06;
  for (let i = 0; i < 3; i++) {
    const y = -s * 0.05 + i * s * 0.35;
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, y);
    ctx.lineTo(s * 0.35, y);
    ctx.stroke();
  }
  // Checkmark on first line
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, -s * 0.05);
  ctx.lineTo(-s * 0.25, s * 0.08);
  ctx.lineTo(-s * 0.05, -s * 0.15);
  ctx.stroke();

  ctx.restore();
}

function drawSearchIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";

  const s = size * 0.4;
  // Magnifying glass circle
  ctx.beginPath();
  ctx.arc(-s * 0.1, -s * 0.15, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  // Handle
  ctx.lineWidth = size * 0.12;
  ctx.beginPath();
  ctx.moveTo(s * 0.25, s * 0.2);
  ctx.lineTo(s * 0.7, s * 0.65);
  ctx.stroke();
  // QR hint inside
  ctx.strokeStyle = C.mint;
  ctx.lineWidth = size * 0.05;
  const qs = s * 0.18;
  ctx.strokeRect(-s * 0.3, -s * 0.35, qs, qs);
  ctx.strokeRect(-s * 0.0, -s * 0.35, qs, qs);
  ctx.strokeRect(-s * 0.3, -s * 0.05, qs, qs);

  ctx.restore();
}

async function uploadImage(richMenuId: string) {
  const W = 2500, H = 843;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, C.dark);
  grad.addColorStop(0.5, C.dark2);
  grad.addColorStop(1, C.dark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = `${C.teal}15`;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Column areas with hover-like cards
  const cols = [
    { x: 416, draw: drawWrenchIcon, label: "แจ้งซ่อม", sub: "REPORT REPAIR" },
    { x: 1250, draw: drawClipboardIcon, label: "เช็คสถานะ", sub: "CHECK STATUS" },
    { x: 2083, draw: drawSearchIcon, label: "ค้นหาเลขซ่อม", sub: "TRACK ONLINE" },
  ];

  for (const col of cols) {
    // Card background
    ctx.fillStyle = `${C.teal}18`;
    ctx.beginPath();
    (ctx as any).roundRect(col.x - 340, 50, 680, H - 100, 30);
    ctx.fill();

    // Card border
    ctx.strokeStyle = `${C.mint}30`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    (ctx as any).roundRect(col.x - 340, 50, 680, H - 100, 30);
    ctx.stroke();

    // Icon
    col.draw(ctx as any, col.x, 280, 220);

    // Label - Thai
    ctx.fillStyle = C.white;
    ctx.font = "bold 60px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(col.label, col.x, 520);

    // Sub label - English
    ctx.fillStyle = C.teal;
    ctx.font = "500 30px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText(col.sub, col.x, 575);
    ctx.letterSpacing = "0px";

    // Bottom accent bar
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    (ctx as any).roundRect(col.x - 40, 650, 80, 6, 3);
    ctx.fill();

    // Glow effect on accent bar
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = C.accent;
    ctx.beginPath();
    (ctx as any).roundRect(col.x - 30, 652, 60, 2, 1);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Dividers
  ctx.strokeStyle = `${C.mint}25`;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(833, 80); ctx.lineTo(833, H - 80);
  ctx.moveTo(1667, 80); ctx.lineTo(1667, H - 80);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top brand bar
  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, W, 4);

  const buffer = canvas.toBuffer("image/png");
  const res = await fetch(`${API_DATA}/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "image/png" },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  console.log("Image uploaded");
}

async function main() {
  console.log("Setting up MorMac Rich Menu v2...");

  const existing = await fetch(`${API}/richmenu/list`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then(r => r.json());

  if (existing.richmenus?.length) {
    for (const m of existing.richmenus) {
      await fetch(`${API}/richmenu/${m.richMenuId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${TOKEN}` },
      });
      console.log("Deleted old menu:", m.richMenuId);
    }
  }

  const menu = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "MorMac Menu v2",
    chatBarText: "เมนูหมอแมค",
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: "message", text: "แจ้งซ่อม" } },
      { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: { type: "message", text: "เช็คสถานะ" } },
      { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: { type: "uri", uri: "https://mormac.vercel.app/track" } },
    ],
  };

  const result = await lineAPI("/richmenu", menu);
  const richMenuId = result.richMenuId;
  console.log("Rich Menu created:", richMenuId);

  await uploadImage(richMenuId);

  const res = await fetch(`${API}/user/all/richmenu/${richMenuId}`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Set default failed: ${res.status}`);
  console.log("Set as default");
  console.log("Done! Rich Menu ID:", richMenuId);
}

main().catch(console.error);
