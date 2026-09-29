'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MAX_LINES = 10; // จำนวนรายการ (เมนูที่ไม่ซ้ำกัน) ต่อการส่ง 1 ครั้ง
const MAX_QTY = 5; // จำนวนต่อรายการ

const C = {
  ink: '#2b2118',
  paper: '#fffaf3',
  line: '#e6dccd',
  brown: '#8a5a3b',
  green: '#3f6b4f',
  danger: '#c92a2a',
};

const round = (bg, color = '#fff', disabled = false) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  border: 'none',
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1,
  background: disabled ? '#d8d0c4' : bg,
  color,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const pill = (bg, color = '#fff') => ({
  minHeight: 52,
  padding: '0 20px',
  borderRadius: 12,
  border: 'none',
  fontSize: 20,
  fontWeight: 700,
  background: bg,
  color,
  cursor: 'pointer',
});

function FullMessage({ title, sub, action }) {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 30, margin: 0 }}>{title}</h1>
      {sub && <p style={{ fontSize: 18, margin: 0, color: '#6b5b4b' }}>{sub}</p>}
      {action}
    </main>
  );
}

export default function OrderPage({ params }) {
  const { tableNumber } = use(params); // params เป็น Promise ต้อง unwrap ด้วย use()
  const tableNo = Number(tableNumber);

  const [status, setStatus] = useState('loading'); // loading | unavailable | error | ready | done
  const [session, setSession] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState({}); // ชื่อเมนู -> จำนวน
  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isInteger(tableNo) || tableNo < 1) {
        setStatus('unavailable');
        return;
      }
      try {
        const { data: open, error: e1 } = await supabase
          .from('sessions')
          .select('id, adult_count, child_count')
          .eq('table_number', tableNo)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1);
        if (e1) throw e1;
        if (cancelled) return;
        if (!open || open.length === 0) {
          setStatus('unavailable');
          return;
        }
        const [cats, its] = await Promise.all([
          supabase.from('menu_categories').select('id, name, sort_order').order('sort_order'),
          supabase.from('menu_items').select('id, category_id, name').order('id'),
        ]);
        if (cats.error) throw cats.error;
        if (its.error) throw its.error;
        if (cancelled) return;
        setSession(open[0]);
        setCategories(cats.data);
        setItems(its.data);
        setActiveCat(cats.data[0]?.id ?? null);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'ไม่ทราบสาเหตุ');
        setStatus('error');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tableNo]);

  const lines = Object.entries(cart);
  const lineCount = lines.length;
  const cupCount = lines.reduce((s, [, q]) => s + q, 0);

  function add(name) {
    setNotice('');
    setCart((c) => {
      const q = c[name] || 0;
      if (q >= MAX_QTY) return c;
      if (q === 0 && Object.keys(c).length >= MAX_LINES) return c;
      return { ...c, [name]: q + 1 };
    });
  }

  function remove(name) {
    setCart((c) => {
      const q = c[name] || 0;
      const next = { ...c };
      if (q <= 1) delete next[name];
      else next[name] = q - 1;
      return next;
    });
  }

  async function submitOrder() {
    if (lineCount === 0) return;
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.from('orders').insert({
        session_id: session.id,
        table_number: tableNo,
        items: lines.map(([name, quantity]) => ({ name, quantity })),
        status: 'received',
      });
      if (err) throw err;
      setCart({});
      setCartOpen(false);
      setNotice('ส่งออเดอร์แล้ว');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setError(`ส่งออเดอร์ไม่สำเร็จ: ${err.message || 'ไม่ทราบสาเหตุ'} — กดส่งอีกครั้ง`);
    } finally {
      setBusy(false);
    }
  }

  async function closeSession() {
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', session.id)
        .eq('status', 'open');
      if (err) throw err;
      setBillOpen(false);
      setStatus('done');
    } catch (err) {
      setBillOpen(false);
      setError(`เรียกเก็บเงินไม่สำเร็จ: ${err.message || 'ไม่ทราบสาเหตุ'} — ลองอีกครั้ง`);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') return <FullMessage title="กำลังโหลดเมนู..." />;
  if (status === 'unavailable') {
    return <FullMessage title="โต๊ะนี้ยังไม่เปิดใช้งาน กรุณาแจ้งพนักงาน" />;
  }
  if (status === 'error') {
    return (
      <FullMessage
        title="โหลดข้อมูลไม่สำเร็จ"
        sub={error}
        action={<button type="button" onClick={() => window.location.reload()} style={pill(C.ink)}>ลองใหม่</button>}
      />
    );
  }
  if (status === 'done') return <FullMessage title="ขอบคุณที่ใช้บริการ" sub="cha_lalalala" />;

  const shown = items.filter((i) => i.category_id === activeCat);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 130 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>cha_lalalala</div>
          <div style={{ fontSize: 18, color: '#6b5b4b' }}>โต๊ะ {tableNo}</div>
        </div>
        <button type="button" onClick={() => setBillOpen(true)} style={pill(C.brown)}>
          เรียกเก็บเงิน
        </button>
      </header>

      <nav
        aria-label="หมวดเมนู"
        style={{ position: 'sticky', top: 0, zIndex: 5, background: C.paper, display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 16px', borderBottom: `1px solid ${C.line}` }}
      >
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.id)}
            aria-pressed={c.id === activeCat}
            style={{ ...pill(c.id === activeCat ? C.ink : '#efe6d8', c.id === activeCat ? '#fff' : C.ink), flex: '0 0 auto', fontSize: 18 }}
          >
            {c.name}
          </button>
        ))}
      </nav>

      {notice && (
        <p role="status" style={{ margin: '12px 16px 0', padding: 14, borderRadius: 10, background: '#e3f1e7', color: C.green, fontSize: 20, fontWeight: 700 }}>
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" style={{ margin: '12px 16px 0', padding: 14, borderRadius: 10, background: '#fdeaea', color: C.danger, fontSize: 18 }}>
          {error}
        </p>
      )}
      {lineCount >= MAX_LINES && (
        <p style={{ margin: '12px 16px 0', fontSize: 16, color: '#6b5b4b' }}>เลือกครบ {MAX_LINES} รายการแล้ว ส่งออเดอร์นี้ก่อนแล้วสั่งเพิ่มได้</p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: '8px 16px' }}>
        {shown.map((item) => {
          const q = cart[item.name] || 0;
          const blocked = q >= MAX_QTY || (q === 0 && lineCount >= MAX_LINES);
          return (
            <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 22 }}>{item.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {q > 0 && (
                  <>
                    <button type="button" aria-label={`ลด ${item.name}`} onClick={() => remove(item.name)} style={round('#efe6d8', C.ink)}>−</button>
                    <span style={{ fontSize: 22, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{q}</span>
                  </>
                )}
                <button type="button" aria-label={`เพิ่ม ${item.name}`} disabled={blocked} onClick={() => add(item.name)} style={round(C.green, '#fff', blocked)}>+</button>
              </span>
            </li>
          );
        })}
        {shown.length === 0 && <li style={{ padding: 24, fontSize: 18 }}>ยังไม่มีเมนูในหมวดนี้</li>}
      </ul>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10, background: '#fff', borderTop: `2px solid ${C.line}`, boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {cartOpen && lineCount > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: '8px 16px', maxHeight: '40vh', overflowY: 'auto', borderBottom: `1px solid ${C.line}` }}>
              {lines.map(([name, q]) => (
                <li key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0' }}>
                  <span style={{ fontSize: 20 }}>{name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" aria-label={`ลด ${name}`} onClick={() => remove(name)} style={round('#efe6d8', C.ink)}>−</button>
                    <span style={{ fontSize: 20, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{q}</span>
                    <button type="button" aria-label={`เพิ่ม ${name}`} disabled={q >= MAX_QTY} onClick={() => add(name)} style={round(C.green, '#fff', q >= MAX_QTY)}>+</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
            <button type="button" onClick={() => setCartOpen((o) => !o)} disabled={lineCount === 0} style={{ ...pill('#efe6d8', C.ink), flex: 1, textAlign: 'left', fontSize: 18 }}>
              ตะกร้า {lineCount}/{MAX_LINES} รายการ · {cupCount} แก้ว {lineCount > 0 ? (cartOpen ? '▾' : '▴') : ''}
            </button>
            <button type="button" onClick={submitOrder} disabled={lineCount === 0 || busy} style={{ ...pill(lineCount === 0 || busy ? '#d8d0c4' : C.green), cursor: lineCount === 0 || busy ? 'not-allowed' : 'pointer' }}>
              {busy ? 'กำลังส่ง...' : 'ส่งออเดอร์'}
            </button>
          </div>
        </div>
      </div>

      {billOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="bill-title" style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 400 }}>
            <h2 id="bill-title" style={{ fontSize: 26, margin: '0 0 12px' }}>เรียกเก็บเงิน</h2>
            <p style={{ fontSize: 22, margin: '0 0 4px' }}>โต๊ะ {tableNo}</p>
            <p style={{ fontSize: 20, margin: '0 0 12px' }}>ผู้ใหญ่ {session.adult_count} · เด็ก {session.child_count}</p>
            <p style={{ fontSize: 18, margin: '0 0 20px', color: '#6b5b4b' }}>เมื่อยืนยันแล้วจะปิดโต๊ะและสั่งเพิ่มไม่ได้อีก</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setBillOpen(false)} disabled={busy} style={{ ...pill('#efe6d8', C.ink), flex: 1 }}>ยกเลิก</button>
              <button type="button" onClick={closeSession} disabled={busy} style={{ ...pill(C.brown), flex: 1 }}>{busy ? 'กำลังปิด...' : 'ยืนยัน'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
