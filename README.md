# cha_lalalala

ระบบสั่งเครื่องดื่มร้าน cha_lalalala — Next.js (App Router, JavaScript) + Supabase

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า Supabase จริง
npm run dev
```

เปิด http://localhost:3000

## Deploy บน Vercel

1. Push โค้ดขึ้น Git repository
2. Import โปรเจกต์ใน Vercel
3. ตั้ง Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## หมายเหตุสำหรับนักพัฒนา

ดูกฎการใช้ `params` ของ Dynamic Route (เป็น Promise ต้อง unwrap ด้วย `use()`) และโครงสร้างตารางฐานข้อมูลใน [CLAUDE.md](./CLAUDE.md)
123
