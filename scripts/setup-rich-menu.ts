import { createCanvas } from "@napi-rs/canvas";

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const API = "https://api.line.me/v2/bot";
const API_DATA = "https://api-data.line.me/v2/bot";

const BRAND = {
  dark: "#0F1720",
  accent: "#28EF33",
  mint: "#85C1B2",
  white: "#FFFFFF",
};

async function lineAPI(path: string, body: unknown, base = API) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// Step 1: Create Rich Menu
async function createRichMenu() {
  const menu = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: "MorMac Main Menu",
    chatBarText: "เมนู",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "แจ้งซ่อม" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "message", text: "เช็คสถานะ" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "uri", uri: "https://mormac.vercel.app/track" },
      },
    ],
  };

  const result = await lineAPI("/richmenu", menu);
  console.log("Rich Menu created:", result.richMenuId);
  return result.richMenuId;
}

// Step 2: Generate and upload image
async function uploadImage(richMenuId: string) {
  const W = 2500, H = 843;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = BRAND.dark;
  ctx.fillRect(0, 0, W, H);

  // Dividers
  ctx.strokeStyle = `${BRAND.mint}44`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(833, 40); ctx.lineTo(833, H - 40);
  ctx.moveTo(1667, 40); ctx.lineTo(1667, H - 40);
  ctx.stroke();

  // Button areas
  const buttons = [
    { icon: "🔧", label: "แจ้งซ่อม", sub: "Report Repair", x: 416 },
    { icon: "📋", label: "เช็คสถานะ", sub: "Check Status", x: 1250 },
    { icon: "🔍", label: "ค้นหาเลขซ่อม", sub: "Track Online", x: 2083 },
  ];

  for (const btn of buttons) {
    // Icon
    ctx.font = "120px serif";
    ctx.textAlign = "center";
    ctx.fillText(btn.icon, btn.x, 320);

    // Label
    ctx.font = "bold 56px sans-serif";
    ctx.fillStyle = BRAND.white;
    ctx.fillText(btn.label, btn.x, 480);

    // Sub label
    ctx.font = "36px sans-serif";
    ctx.fillStyle = BRAND.mint;
    ctx.fillText(btn.sub, btn.x, 560);

    // Accent dot
    ctx.fillStyle = BRAND.accent;
    ctx.beginPath();
    ctx.arc(btn.x, 640, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const buffer = canvas.toBuffer("image/png");

  const res = await fetch(`${API_DATA}/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "image/png",
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  console.log("Image uploaded");
}

// Step 3: Set as default
async function setDefault(richMenuId: string) {
  const res = await fetch(`${API}/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Set default failed: ${res.status} ${await res.text()}`);
  console.log("Set as default rich menu");
}

// Run
async function main() {
  console.log("Setting up MorMac Rich Menu...");

  // Delete existing rich menus
  const existing = await fetch(`${API}/richmenu/list`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  }).then(r => r.json());

  if (existing.richmenus?.length) {
    for (const m of existing.richmenus) {
      await fetch(`${API}/richmenu/${m.richMenuId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      console.log("Deleted old menu:", m.richMenuId);
    }
  }

  const richMenuId = await createRichMenu();
  await uploadImage(richMenuId);
  await setDefault(richMenuId);
  console.log("Done! Rich Menu ID:", richMenuId);
}

main().catch(console.error);
