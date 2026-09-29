# cha_lalalala — ระบบสั่งเครื่องดื่ม

Stack: Next.js (App Router, **JavaScript ไม่ใช่ TypeScript**) + Supabase, deploy บน Vercel

## กฎสำคัญ: Dynamic Route params เป็น Promise

โปรเจกต์นี้ใช้ Next.js เวอร์ชันล่าสุด ซึ่ง `params` (และ `searchParams`) ของ Dynamic Route เป็น **Promise**
ต้อง unwrap ทุกครั้ง ห้ามเข้าถึง `params.xxx` ตรง ๆ

**Client Component** (`'use client'`) — unwrap ด้วย `use()` จาก React:

```js
'use client';
import { use } from 'react';

export default function OrderPage({ params }) {
  const { sessionId } = use(params);
  // ...
}
```

**Server Component** — `use()` ใช้ได้ แต่ถ้าเป็น `async function` ให้ใช้ `await params` แทน:

```js
export default async function OrderPage({ params }) {
  const { sessionId } = await params;
  // ...
}
```

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

ตั้งค่าใน `.env.local` (ตอนพัฒนา) และใน Vercel Project Settings > Environment Variables (ตอน deploy)
ห้าม commit `.env.local`

Supabase client: `import { supabase } from '@/lib/supabaseClient';`

## โครงสร้างฐานข้อมูล (มีอยู่แล้วใน Supabase — ห้ามสร้างใหม่)

**sessions**
- `id`
- `table_number`
- `adult_count`
- `child_count`
- `status`
- `created_at`

**menu_categories**
- `id`
- `name`
- `sort_order`

**menu_items**
- `id`
- `category_id` → `menu_categories.id`
- `name`

**orders**
- `id`
- `session_id` → `sessions.id`
- `table_number`
- `items` (jsonb)
- `status`
- `created_at`

## หน้าที่วางแผนไว้

- `/` — หน้าแรก (ทดสอบ deploy)
- `/generate-qr` — สร้าง QR ประจำโต๊ะ
- `/kitchen` — หน้าชงเครื่องดื่ม ดูออเดอร์
- หน้าสั่งเครื่องดื่มของลูกค้า (Dynamic Route — ดูกฎ params ด้านบน)

## ข้อมูลเมนู (ร้านน้ำชา cha_lalalala)

5 หมวด 20 รายการ — seed อยู่ที่ `supabase/seed.sql`

| sort_order | หมวด | รายการ |
|---|---|---|
| 1 | ชาไทย | ชาไทยเย็น, ชาไทยร้อน, ชาไทยปั่น, ชาไทยนมสด |
| 2 | ชาเขียว | ชาเขียวเย็น, ชาเขียวร้อน, ชาเขียวมัทฉะ, ชาเขียวนมสด |
| 3 | ชาไต้หวัน | ชาไต้หวันไข่มุก, ชาอู่หลงไต้หวัน, ชาไต้หวันนมสด, ชาไต้หวันบราวน์ชูการ์ |
| 4 | ชาดำ | ชาดำเย็น, ชาดำร้อน, ชาดำมะนาว, ชาดำน้ำผึ้งมะนาว |
| 5 | ชานมเย็น | ชานมเย็น, ชานมไข่มุก, ชานมบราวน์ชูการ์, ชานมพุดดิ้ง |
