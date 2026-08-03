import useSWR from 'swr';
import { useState } from 'react';
import { get } from '../src/lib/api';

// ─── date helpers ─────────────────────────────────────────────────────────────
function monthStart(y: number, m: number) { return `${y}-${String(m).padStart(2,'0')}-01`; }
function monthEnd(y: number, m: number)   { return `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}`; }
function yearStart(y: number) { return `${y}-01-01`; }
function yearEnd(y: number)   { return `${y}-12-31`; }

const NOW           = new Date();
const CURRENT_YEAR  = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const MONTHS_TH   = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

// ─── brand detection ──────────────────────────────────────────────────────────
type Site = 'oboj' | 'taksin';
function getSite(model: string): Site {
  return /brother/i.test(model) ? 'oboj' : 'taksin';
}

// ─── chart components (pure CSS) ─────────────────────────────────────────────
function BarChart({ data, maxVal }: { data: { label: string; toner: number; drum: number }[]; maxVal: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        {/* Y-axis */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 96, marginRight: 8, paddingBottom: 20 }}>
          {[maxVal, Math.round(maxVal / 2), 0].map(v => (
            <div key={v} style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'right', lineHeight: 1 }}>{v}</div>
          ))}
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'flex-end', overflowX: 'auto' }}>
          {data.map(d => {
            const th = maxVal > 0 ? Math.round((d.toner / maxVal) * 80) : 0;
            const dh = maxVal > 0 ? Math.round((d.drum  / maxVal) * 80) : 0;
            return (
              <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 38 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  <div title={`Toner: ${d.toner}`} style={{ width: 13, height: th || 2, background: th ? '#f59e0b' : 'var(--gray-200)', borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                  <div title={`Drum: ${d.drum}`}   style={{ width: 13, height: dh || 2, background: dh ? '#a855f7' : 'var(--gray-200)', borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--gray-200)', marginTop: 4 }} />
    </div>
  );
}

// ─── section: renders stats + chart for one group ────────────────────────────
function SiteSection({
  title, subtitle, rows, mode, selYear, selMonth,
}: {
  title: string; subtitle: string; rows: any[];
  mode: string; selYear: number; selMonth: number;
}) {
  // monthly breakdown
  const monthlyMap: Record<string, { toner: number; drum: number }> = {};
  rows.forEach(r => {
    if (!r.completedAt) return;
    const ym = r.completedAt.slice(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = { toner: 0, drum: 0 };
    if (/toner/i.test(r.part))     monthlyMap[ym].toner += r.quantity;
    else if (/drum/i.test(r.part)) monthlyMap[ym].drum  += r.quantity;
  });

  const chartMonths: string[] = [];
  if (mode === 'year') {
    for (let m = 1; m <= 12; m++) chartMonths.push(`${selYear}-${String(m).padStart(2,'0')}`);
  } else if (mode === 'month') {
    chartMonths.push(`${selYear}-${String(selMonth).padStart(2,'0')}`);
  } else {
    Object.keys(monthlyMap).sort().forEach(ym => chartMonths.push(ym));
  }

  const chartData = chartMonths.map(ym => ({
    label: MONTHS_TH[parseInt(ym.slice(5,7)) - 1],
    toner: monthlyMap[ym]?.toner ?? 0,
    drum:  monthlyMap[ym]?.drum  ?? 0,
  }));
  const maxBarVal = Math.max(...chartData.map(d => Math.max(d.toner, d.drum)), 1);

  // totals
  let tonerTotal = 0, drumTotal = 0;
  rows.forEach(r => {
    if (/toner/i.test(r.part))     tonerTotal += r.quantity;
    else if (/drum/i.test(r.part)) drumTotal  += r.quantity;
  });

  if (rows.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <span className="card-title">{title}</span>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>
        <div className="empty-state" style={{ padding: '28px 20px' }}>
          <div className="empty-icon" style={{ fontSize: 28 }}>🖨️</div>
          <div className="empty-text">ไม่มีข้อมูลในช่วงเวลานี้</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {/* section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>{title}</h2>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span className="badge badge-yellow" style={{ fontSize: 13, padding: '4px 12px' }}>🟡 Toner {tonerTotal}</span>
          <span className="badge badge-purple" style={{ fontSize: 13, padding: '4px 12px' }}>⭕ Drum {drumTotal}</span>
        </div>
      </div>

      {/* monthly bar chart */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <span className="card-title">กราฟรายเดือน</span>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2, display: 'inline-block' }} /> Toner
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, background: '#a855f7', borderRadius: 2, display: 'inline-block' }} /> Drum
            </span>
          </div>
        </div>
        <div className="card-body">
          <BarChart data={chartData} maxVal={maxBarVal} />
        </div>
      </div>


    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function PrinterSummaryPage() {
  const [tab,        setTab]        = useState<'oboj' | 'taksin'>('oboj');
  const [mode,       setMode]       = useState<'month' | 'year' | 'custom'>('year');
  const [selYear,    setSelYear]    = useState(CURRENT_YEAR);
  const [selMonth,   setSelMonth]   = useState(CURRENT_MONTH);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');

  const { from, to } = (() => {
    if (mode === 'month') return { from: monthStart(selYear, selMonth), to: monthEnd(selYear, selMonth) };
    if (mode === 'year')  return { from: yearStart(selYear), to: yearEnd(selYear) };
    return { from: customFrom, to: customTo };
  })();

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const key = `/reports/printer-summary?${params}`;
  const { data, error } = useSWR(key, () => get(key));

  const allRows: any[] = data?.rows ?? [];

  // split by brand/site
  const obojRows   = allRows.filter(r => getSite(r.model) === 'oboj');
  const taksinRows = allRows.filter(r => getSite(r.model) === 'taksin');

  // totals per tab for badge in tab button
  const count = (rows: any[], type: 'toner'|'drum') =>
    rows.reduce((s, r) => s + (/toner/i.test(r.part) && type==='toner' ? r.quantity : /drum/i.test(r.part) && type==='drum' ? r.quantity : 0), 0);

  const yearOptions = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  return (
    <>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🖨️ สรุปวัสดุสิ้นเปลือง</h1>
          <p className="page-subtitle">Toner และ Drum แยกตามสถานที่</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ช่วงเวลา</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['month','year','custom'] as const).map(m => (
                <button key={m} className={`btn btn-sm ${mode===m?'btn-primary':'btn-ghost'}`} onClick={() => setMode(m)}>
                  {m==='month'?'รายเดือน':m==='year'?'รายปี':'กำหนดเอง'}
                </button>
              ))}
            </div>
          </div>

          {(mode === 'month' || mode === 'year') && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ปี</label>
              <select className="form-select" style={{ width: 100 }} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
                {yearOptions.map(y => <option key={y} value={y}>{y + 543}</option>)}
              </select>
            </div>
          )}
          {mode === 'month' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">เดือน</label>
              <select className="form-select" style={{ width: 140 }} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
                {MONTHS_FULL.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
              </select>
            </div>
          )}
          {mode === 'custom' && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ตั้งแต่</label>
                <input type="date" className="form-input" style={{ width: 160 }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ถึง</label>
                <input type="date" className="form-input" style={{ width: 160 }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', alignSelf: 'flex-end', paddingBottom: 2 }}>
            {from && to ? `${new Date(from+'T00:00:00').toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric'})} — ${new Date(to+'T00:00:00').toLocaleDateString('th-TH',{day:'2-digit',month:'short',year:'numeric'})}` : ''}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>โหลดข้อมูลไม่สำเร็จ</div>}
      {!data && !error && <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>}

      {data && (
        <>
          {/* ── Site tabs ── */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--gray-200)' }}>
            {([
              { id: 'oboj',   label: '🏢 อบจ.',         rows: obojRows   },
              { id: 'taksin', label: '🏫 รร.ตากสิน',    rows: taksinRows },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', padding: '10px 22px',
                  fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer',
                  color: tab === t.id ? 'var(--primary)' : 'var(--gray-500)',
                  borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -2, fontSize: 14, transition: 'color .15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {t.label}
                {data && (
                  <span className="badge badge-gray" style={{ fontSize: 11 }}>
                    🟡{count(t.rows,'toner')} ⭕{count(t.rows,'drum')}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── อบจ. tab — Brother แบ่งตาม model ── */}
          {tab === 'oboj' && (
            <>
              {/* แยกตาม model */}
              {(() => {
                const models = [...new Set(obojRows.map(r => r.model as string))].sort();
                if (models.length === 0) return (
                  <div className="card">
                    <div className="empty-state">
                      <div className="empty-icon">🖨️</div>
                      <div className="empty-text">ไม่มีข้อมูลในช่วงเวลานี้</div>
                    </div>
                  </div>
                );
                return models.map(model => {
                  const modelRows = obojRows.filter(r => r.model === model);
                  const printers  = [...new Set(modelRows.map(r => r.assetTag as string))];
                  return (
                    <SiteSection
                      key={model}
                      title={`🖨️ ${model}`}
                      subtitle={`${printers.length} เครื่อง — อบจ.`}
                      rows={modelRows}
                      mode={mode}
                      selYear={selYear}
                      selMonth={selMonth}
                    />
                  );
                });
              })()}
            </>
          )}

          {/* ── รร.ตากสิน tab — Fuji รวม ── */}
          {tab === 'taksin' && (
            <SiteSection
              title="🖨️ ApeosPort-VII P5021"
              subtitle="รร.ตากสิน"
              rows={taksinRows}
              mode={mode}
              selYear={selYear}
              selMonth={selMonth}
            />
          )}
        </>
      )}
    </>
  );
}
