'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const C = {
  ink: '#2b2118',
  paper: '#fffaf3',
  line: '#d9cfc2',
  warnBg: '#fff1e0',
  warn: '#d9480f',
  danger: '#c92a2a',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  fontSize: 28,
  padding: '12px 14px',
  borderRadius: 10,
  border: `2px solid ${C.line}`,
  background: '#fff',
  color: C.ink,
};

const labelStyle = { display: 'block', fontSize: 20, fontWeight: 600, marginBottom: 6 };

const btn = (bg, color = '#fff') => ({
  fontSize: 22,
  fontWeight: 600,
  padding: '14px 20px',
  borderRadius: 10,
  border: 'none',
  background: bg,
  color,
  cursor: 'pointer',
});

export default function GenerateQrPage() {
  const [table, setTable] = useState('');
  const [adult, setAdult] = useState('');
  const [child, setChild] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null); // session เก่าที่ยังเปิดอยู่
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [minutesOpen, setMinutesOpen] = useState(0);
  const [created, setCreated] = useState(null); // { table, adult, child, url }
  const [copied, setCopied] = useState(false);

  const tableNo = Number(table);
  const adultNo = Number(adult || 0);
  const childNo = Number(child || 0);

  function changeTable(v) {
    setTable(v);
    setConflict(null); // เลขโต๊ะเปลี่ยน คำเตือนเดิมใช้ไม่ได้แล้ว
    setError('');
  }

  async function handleOpenTable(e) {
    e.preventDefault();
    setError('');

    if (!Number.isInteger(tableNo) || tableNo < 1) {
      setError('กรุณากรอกเลขโต๊ะเป็นตัวเลข');
      return;
    }
    if (!Number.isInteger(adultNo) || adultNo < 0 || !Number.isInteger(childNo) || childNo < 0) {
      setError('จำนวนคนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');
      return;
    }

    setBusy(true);
    try {
      const { data: open, error: checkErr } = await supabase
        .from('sessions')
        .select('id, adult_count, child_count, created_at')
        .eq('table_number', tableNo)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1);
      if (checkErr) throw checkErr;

      if (open && open.length > 0) {
        setConflict(open[0]);
        return;
      }

      const { error: insErr } = await supabase.from('sessions').insert({
        table_number: tableNo,
        adult_count: adultNo,
        child_count: childNo,
        status: 'open',
      });
      if (insErr) throw insErr;

      setCreated({
        table: tableNo,
        adult: adultNo,
        child: childNo,
        url: `${window.location.origin}/order/${tableNo}`,
      });
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message || 'ไม่ทราบสาเหตุ'} — ลองกดอีกครั้ง`);
    } finally {
      setBusy(false);
    }
  }

  function askCloseOld() {
    const mins = Math.floor((Date.now() - new Date(conflict.created_at).getTime()) / 60000);
    setMinutesOpen(Math.max(0, mins));
    setConfirmOpen(true);
  }

  async function confirmCloseOld() {
    setBusy(true);
    setError('');
    try {
      // เช็คซ้ำว่ายังเป็น 'open' กันการกดซ้ำซ้อน
      const { error: updErr } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', conflict.id)
        .eq('status', 'open');
      if (updErr) throw updErr;

      setConfirmOpen(false);
      setConflict(null); // กลับไปที่ฟอร์มเดิม ค่าที่กรอกยังอยู่ ให้พนักงานกด "เปิดโต๊ะ" เอง
    } catch (err) {
      setConfirmOpen(false);
      setError(`ปิดโต๊ะเดิมไม่สำเร็จ: ${err.message || 'ไม่ทราบสาเหตุ'} — ลองกดอีกครั้ง`);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('คัดลอกไม่สำเร็จ กรุณาเลือกลิงก์แล้วคัดลอกเอง');
    }
  }

  function reset() {
    setTable('');
    setAdult('');
    setChild('');
    setCreated(null);
    setConflict(null);
    setError('');
    setCopied(false);
  }

  const wrap = { maxWidth: 480, margin: '0 auto', padding: 20 };

  // ---------- ผลลัพธ์ QR ----------
  if (created) {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(created.url)}`;
    return (
      <main style={{ ...wrap, textAlign: 'center' }}>
        <h1 style={{ fontSize: 30, margin: '8px 0 16px' }}>เปิดโต๊ะสำเร็จ</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt={`QR Code โต๊ะ ${created.table}`}
          width={300}
          height={300}
          style={{ background: '#fff', padding: 12, borderRadius: 12, border: `2px solid ${C.line}` }}
        />
        <p style={{ fontSize: 26, fontWeight: 700, margin: '16px 0 8px' }}>
          โต๊ะ {created.table} · ผู้ใหญ่ {created.adult} · เด็ก {created.child}
        </p>
        <p style={{ fontSize: 18, wordBreak: 'break-all', margin: '0 0 12px' }}>{created.url}</p>
        <button type="button" onClick={copyLink} style={{ ...btn(C.ink), fontSize: 18, padding: '8px 16px' }}>
          {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
        </button>
        {error && <p style={{ color: C.danger, fontSize: 18 }}>{error}</p>}
        <div style={{ marginTop: 28 }}>
          <button type="button" onClick={reset} style={{ ...btn(C.warn), width: '100%' }}>
            เปิดโต๊ะใหม่
          </button>
        </div>
      </main>
    );
  }

  // ---------- ฟอร์ม ----------
  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 32, margin: '8px 0 20px' }}>เปิดโต๊ะ · cha_lalalala</h1>

      {conflict && (
        <div
          role="alert"
          style={{
            background: C.warnBg,
            border: `3px solid ${C.warn}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 22, fontWeight: 700, color: C.warn, margin: '0 0 12px' }}>
            โต๊ะนี้มีลูกค้าอยู่ระหว่างใช้บริการ กรุณาปิดออเดอร์เดิมก่อน
          </p>
          <button type="button" onClick={askCloseOld} disabled={busy} style={btn(C.danger)}>
            ปิดออเดอร์เดิม
          </button>
        </div>
      )}

      <form onSubmit={handleOpenTable} style={{ display: 'grid', gap: 18 }}>
        <div>
          <label htmlFor="table" style={labelStyle}>เลขโต๊ะ</label>
          <input
            id="table"
            type="number"
            inputMode="numeric"
            min="1"
            value={table}
            onChange={(e) => changeTable(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="adult" style={labelStyle}>จำนวนผู้ใหญ่</label>
          <input
            id="adult"
            type="number"
            inputMode="numeric"
            min="0"
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="child" style={labelStyle}>จำนวนเด็ก</label>
          <input
            id="child"
            type="number"
            inputMode="numeric"
            min="0"
            value={child}
            onChange={(e) => setChild(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && (
          <p role="alert" style={{ color: C.danger, fontSize: 20, margin: 0 }}>{error}</p>
        )}

        <button type="submit" disabled={busy} style={{ ...btn(C.ink), opacity: busy ? 0.6 : 1 }}>
          {busy ? 'กำลังทำงาน...' : 'เปิดโต๊ะ'}
        </button>
      </form>

      {confirmOpen && conflict && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            style={{
              background: '#fff',
              borderRadius: 14,
              border: `4px solid ${C.danger}`,
              padding: 22,
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h2 id="confirm-title" style={{ fontSize: 26, color: C.danger, margin: '0 0 12px' }}>
              ยืนยันปิดโต๊ะเดิม
            </h2>
            <p style={{ fontSize: 22, margin: '0 0 6px' }}>โต๊ะ {tableNo}</p>
            <p style={{ fontSize: 22, margin: '0 0 6px' }}>
              ผู้ใหญ่ {conflict.adult_count} · เด็ก {conflict.child_count}
            </p>
            <p style={{ fontSize: 22, margin: '0 0 20px' }}>เปิดมาแล้ว {minutesOpen} นาที</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                style={{ ...btn('#e9e2d8', C.ink), flex: 1 }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmCloseOld}
                disabled={busy}
                style={{ ...btn(C.danger), flex: 1, opacity: busy ? 0.6 : 1 }}
              >
                {busy ? 'กำลังปิด...' : 'ยืนยันปิดโต๊ะเดิม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
