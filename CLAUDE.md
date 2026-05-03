# MorMac — หมอแมค

> Apple Device Repair Management System

## Overview

ระบบบริหารจัดการร้านซ่อม Apple Devices (MacBook, iPhone, iPad, Apple Watch)
- รับซื้อเครื่องเสีย → ซ่อม → ขาย (refurb)
- รับซ่อมจากลูกค้า
- Multi-shop support (เจ้าของดูหลายสาขา)

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **DB**: Prisma + SQLite (dev) → PostgreSQL (prod)
- **Customer Interface**: LINE OA + LIFF (primary), Web (secondary)
- **Admin**: Next.js pages (shadcn/ui)
- **Runtime**: Bun

## Key Concepts

- **Repair Code**: `MOR-YYMM-XXXX` — unique per repair job
- **QR Code**: Links to `/track/:code` for public status tracking
- **Statuses**: submitted → received → diagnosing → quoted → confirmed → repairing → qc → done → shipped → returned

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── line/webhook/    # LINE webhook handler
│   │   └── repairs/         # Repair CRUD + status updates
│   ├── track/[code]/        # Public tracking page
│   └── admin/               # Admin panel (TODO)
├── lib/
│   ├── prisma.ts            # DB client
│   ├── line.ts              # LINE SDK + helpers
│   ├── qr.ts               # QR code generation
│   └── repair-code.ts      # Code generator
└── generated/prisma/        # Prisma client
```

## Commands

```bash
bun dev                      # Start dev server
bunx prisma migrate dev      # Run migrations
bunx prisma studio           # DB browser
```

## LINE Integration

- Webhook URL: `https://<domain>/api/line/webhook`
- LIFF apps registered in LINE Developers Console
- Rich Menu keywords: "แจ้งซ่อม", "เช็คสถานะ"
