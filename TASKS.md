# DMC Notebook — Development Roadmap

## Phase 3: Operations (ทำต่อจาก Phase 2)

### 3.1 Warranty Tracking
- เพิ่ม field `warrantyDays` (default 180) ใน Repair model
- เพิ่ม field `warrantyExpiry` คำนวณจาก completedAt + warrantyDays
- หน้า track: แสดง "อยู่ในประกัน" หรือ "หมดประกัน" พร้อมวันที่
- ถ้าลูกค้าแจ้งซ่อมอาการเดิมภายในประกัน → แจ้ง admin อัตโนมัติ
- Admin repair detail: แสดง warranty status

### 3.2 Parts Auto-Reorder Alert
- เมื่อ stock ลดต่ำกว่า `alertAt` ของ Part → สร้าง notification
- เพิ่ม model `Notification` (id, type, message, read, createdAt)
- Admin dashboard: แสดง notification bell + count
- หน้า notifications list
- ส่ง LINE push ให้เจ้าของร้าน (ถ้ามี LINE OA ID)

### 3.3 Appointment Booking
- เพิ่ม model `Appointment` (id, customerId, date, time, deviceType, symptoms, status, createdAt)
- LINE chatbot: ถ้าลูกค้าพิมพ์ "จองคิว" → ถามวัน/เวลา → สร้าง appointment
- หน้า /admin/appointments: ดูคิวทั้งหมด, approve/reject
- หน้า /my-appointments สำหรับลูกค้า
- Calendar view ในหน้า admin

### 3.4 Multi-Branch Support
- Shop model มีอยู่แล้ว — เพิ่มให้ admin เลือก/สลับ shop
- Staff สังกัด shop ได้
- Reports filter by shop
- Repair สังกัด shop

## Phase 4: Business Intelligence

### 4.1 Customer LTV (Lifetime Value)
- คำนวณ total revenue per customer
- แสดงใน customer detail page
- Top customers report

### 4.2 Device Failure Patterns
- Report: model ไหนเสียบ่อย, อาการอะไร
- กราฟ device type vs symptoms
- ช่วยสั่ง stock อะไหล่ล่วงหน้า

### 4.3 Tech Performance Dashboard
- เวลาซ่อมเฉลี่ย per tech (created → done)
- อัตราซ่อมซ้ำ (warranty claims per tech)
- Revenue generated per tech
- Rating average per tech

### 4.4 Monthly P&L Dashboard
- Revenue, COGS (parts), Labor, Gross Profit
- Chart: revenue vs cost trend 12 เดือน
- Compare month-over-month
- Export PDF report

## Priority Order
1. 3.1 Warranty Tracking (simple, high value)
2. 3.2 Parts Auto-Reorder (prevents stock-out)
3. 4.3 Tech Performance (already have data)
4. 4.4 Monthly P&L (already have reports/summary)
5. 3.3 Appointment Booking (new feature)
6. 4.1 Customer LTV (analytics)
7. 4.2 Device Failure Patterns (analytics)
8. 3.4 Multi-Branch (architecture change)
