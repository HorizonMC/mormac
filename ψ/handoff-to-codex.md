# MorMac Handoff — Claude → Codex (2026-05-06)

## สรุปงานเมื่อวาน (2026-05-05)

### สิ่งที่ทำเสร็จ (committed)
1. **Reports page** — admin/reports พร้อม P&L, device breakdown, monthly trend, period filter
2. **LINE OA setup** — Channel Secret + Access Token ใส่ทั้ง .env + Vercel env
3. **LINE Webhook** — verified + enabled, URL: `https://mormac.vercel.app/api/line/webhook`
4. **Cloudflare tunnel** — trycloudflare สำหรับ DB server (URL เปลี่ยนทุก restart)
5. **Rich Menu v2** — gradient + vector icons + NotoSansThai font, 3 ปุ่ม (แจ้งซ่อม/เช็คสถานะ/ค้นหา)
6. **LINE Bot Flex Messages** — ทุก response เป็น branded Flex (status card, repair list, submit success, etc.)
7. **ใบรับซ่อม (Job Sheet)** — `/api/repairs/jobsheet?code=MOR-XXXX` A4 พิมพ์ได้ 2 ตอน (ร้าน+ลูกค้า)
8. **ADMIN_PIN** — เปลี่ยนจาก 1234 → [REDACTED]
9. **Customer Validation doc** — Mom Test approach, 20 ร้าน, conversation flow
10. **AI-powered LINE bot** — Ollama gemma3:4b + system prompt (`ai/repair-assistant.md`)
11. **Async AI architecture** — Vercel fire-and-forget → DB server runs LLM → LINE Push API

### ปัญหาที่ยังไม่แก้ตอน Claude หมด limit
- **"macbook pro ram16GB disk 1TB อาการจอแตก"** ยังไม่ได้รับ response (screenshot ล่าสุด)
- อาจเป็นเพราะ DB server ต้อง restart ด้วย LINE_CHANNEL_ACCESS_TOKEN
- หรือ Ollama ยังไม่ warm

### สถาปัตยกรรมปัจจุบัน
```
ลูกค้า → LINE → Vercel webhook (return 200 ทันที)
                      ↓ POST /ai/handle (fire-and-forget)
                 DB Server (artron:4100) via Cloudflare tunnel
                      ↓ Ollama gemma3:4b (2-8 วินาที)
                      ↓ สร้าง repair ถ้า intent=repair
                      ↓ LINE Push API → ตอบลูกค้า
```

### ไฟล์สำคัญ
- `ai/repair-assistant.md` — system prompt สำหรับ LLM
- `db-server/index.ts` — Hono server + AI endpoints
- `db-server/start.sh` — startup script (Ollama + DB + tunnel)
- `src/app/api/line/webhook/route.ts` — LINE webhook handler
- `src/lib/line.ts` — LINE SDK helpers + Flex Message builders
- `scripts/setup-rich-menu.ts` — Rich Menu image generator

### Vercel Env Vars
- DB_API_URL — trycloudflare URL (เปลี่ยนทุก restart)
- DB_API_KEY — `mormac-artron-2026`
- LINE_CHANNEL_ACCESS_TOKEN — set
- LINE_CHANNEL_SECRET — set (ค่าจริงคือ `22458e10b4b78bf1aa341a1e240f72d5`)
- ADMIN_PIN — `[REDACTED]`

### TODO ที่ยังไม่ได้ทำ
- [ ] แก้ปัญหา AI ไม่ตอบ (ต้องเช็ค DB server log + tunnel + LINE token)
- [ ] LIFF forms (สวยกว่า text-based)
- [ ] Custom domain
- [ ] LINE OA: ปิด auto-reply ใน LINE Official Account Manager
- [ ] Commit uncommitted changes (286 insertions จาก Codex)
