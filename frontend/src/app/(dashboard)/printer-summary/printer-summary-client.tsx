'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Select }   from '@/components/ui/select';
import { Badge }    from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner }  from '@/components/ui/spinner';
import { formatDateTH } from '@/lib/utils';

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTHS_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

type Site = 'oboj' | 'taksin';

interface Props {
  data:         any;
  initialFrom?: string;
  initialTo?:   string;
}

export function PrinterSummaryClient({ data, initialFrom, initialTo }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, start] = useTransition();

  const [tab,      setTab]      = useState<Site>('oboj');
  const [mode,     setMode]     = useState<'month' | 'year' | 'custom'>('year');
  const [selYear,  setSelYear]  = useState(CURRENT_YEAR);
  const [selMonth, setSelMonth] = useState(CURRENT_MONTH);
  const [customFrom, setCustomFrom] = useState(initialFrom ?? '');
  const [customTo,   setCustomTo]   = useState(initialTo   ?? '');

  const yearOptions = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  function applyFilter() {
    let from = '';
    let to   = '';
    if (mode === 'year') {
      from = `${selYear}-01-01`;
      to   = `${selYear}-12-31`;
    } else if (mode === 'month') {
      const mm   = String(selMonth).padStart(2, '0');
      const last = new Date(selYear, selMonth, 0).getDate();
      from = `${selYear}-${mm}-01`;
      to   = `${selYear}-${mm}-${last}`;
    } else {
      from = customFrom;
      to   = customTo;
    }
    const p = new URLSearchParams(searchParams.toString());
    if (from) p.set('from', from); else p.delete('from');
    if (to)   p.set('to',   to);   else p.delete('to');
    start(() => router.push(`${pathname}?${p}`));
  }

  const rows     = (data?.rows ?? []) as any[];
  const oboj     = (data?.oboj ?? []) as any[];
  const taksin   = (data?.taksin ?? []) as any[];
  const totals   = data?.totals ?? { toner: 0, drum: 0, items: 0, printers: 0 };
  const monthly  = (data?.monthly ?? {}) as Record<string, { toner: number; drum: number }>;

  const activeRows = tab === 'oboj' ? oboj : taksin;
  const models     = [...new Set(activeRows.map((r: any) => r.model as string))].sort();

  // Monthly chart data for current year
  const chartMonths = Array.from({ length: 12 }, (_, i) =>
    `${selYear}-${String(i + 1).padStart(2, '0')}`
  );
  const maxVal = Math.max(
    ...chartMonths.map((ym) => Math.max(monthly[ym]?.toner ?? 0, monthly[ym]?.drum ?? 0)),
    1
  );

  const countFor = (rowSet: any[], type: 'toner' | 'drum') =>
    rowSet.reduce((s: number, r: any) =>
      s + (/toner/i.test(r.part) && type === 'toner' ? r.quantity
         : /drum/i.test(r.part)  && type === 'drum'  ? r.quantity : 0), 0);

  return (
    <>
      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">ช่วงเวลา</div>
            <div className="flex gap-1">
              {(['month','year','custom'] as const).map((m) => (
                <Button key={m} size="sm" variant={mode === m ? 'default' : 'outline'} onClick={() => setMode(m)}>
                  {m === 'month' ? 'รายเดือน' : m === 'year' ? 'รายปี' : 'กำหนดเอง'}
                </Button>
              ))}
            </div>
          </div>

          {(mode === 'year' || mode === 'month') && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">ปี</div>
              <Select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))} className="w-24">
                {yearOptions.map((y) => <option key={y} value={y}>{y + 543}</option>)}
              </Select>
            </div>
          )}
          {mode === 'month' && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">เดือน</div>
              <Select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))} className="w-36">
                {MONTHS_FULL.map((n, i) => <option key={i+1} value={i+1}>{n}</option>)}
              </Select>
            </div>
          )}
          {mode === 'custom' && (
            <>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">ตั้งแต่</div>
                <Input type="date" className="w-40" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">ถึง</div>
                <Input type="date" className="w-40" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </>
          )}

          <Button onClick={applyFilter} disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : 'กรอง'}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon="🖨️" value={totals.printers} label="เครื่องพิมพ์ที่มีงาน" color="bg-blue-100" />
        <StatCard icon="🟡" value={totals.toner}    label="Toner ที่เปลี่ยน"     color="bg-amber-100" />
        <StatCard icon="⭕" value={totals.drum}     label="Drum ที่เปลี่ยน"      color="bg-purple-100" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🖨️" title="ไม่มีข้อมูลในช่วงเวลานี้" subtitle="ลองเปลี่ยนช่วงเวลา" />
      ) : (
        <>
          {/* Monthly bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>📊 กราฟรายเดือน</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Toner</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" /> Drum</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-0">
                {/* Y-axis */}
                <div className="flex flex-col justify-between h-24 mr-2 pb-5 text-right">
                  {[maxVal, Math.round(maxVal / 2), 0].map((v) => (
                    <div key={v} className="text-[10px] text-gray-400">{v}</div>
                  ))}
                </div>
                {/* Bars */}
                <div className="flex flex-1 items-end gap-1.5 overflow-x-auto">
                  {chartMonths.map((ym) => {
                    const t = monthly[ym]?.toner ?? 0;
                    const d = monthly[ym]?.drum  ?? 0;
                    const th = maxVal > 0 ? Math.round((t / maxVal) * 80) : 0;
                    const dh = maxVal > 0 ? Math.round((d / maxVal) * 80) : 0;
                    return (
                      <div key={ym} className="flex flex-col items-center gap-1 min-w-[36px]">
                        <div className="flex items-end gap-0.5 h-20">
                          <div title={`Toner: ${t}`} style={{ height: `${th || 2}px` }}
                            className={`w-3 rounded-t transition-all ${th ? 'bg-amber-400' : 'bg-gray-200'}`} />
                          <div title={`Drum: ${d}`} style={{ height: `${dh || 2}px` }}
                            className={`w-3 rounded-t transition-all ${dh ? 'bg-purple-400' : 'bg-gray-200'}`} />
                        </div>
                        <div className="text-[10px] text-gray-400">{MONTHS_TH[parseInt(ym.slice(5, 7)) - 1]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site tabs */}
          <div className="flex gap-0 border-b border-border">
            {([
              { id: 'oboj',   label: '🏢 อบจ.',       rows: oboj   },
              { id: 'taksin', label: '🏫 รร.ตากสิน', rows: taksin },
            ] as const).map((t: any) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
                <Badge variant="gray" className="text-[10px]">
                  🟡{countFor(t.rows, 'toner')} ⭕{countFor(t.rows, 'drum')}
                </Badge>
              </button>
            ))}
          </div>

          {/* Per-model sections */}
          {activeRows.length === 0 ? (
            <EmptyState icon="🖨️" title="ไม่มีข้อมูลในช่วงนี้" />
          ) : (
            models.map((model) => {
              const modelRows   = activeRows.filter((r: any) => r.model === model);
              const monthlyMap: Record<string, { toner: number; drum: number }> = {};
              modelRows.forEach((r: any) => {
                if (!r.completedAt) return;
                const ym = (r.completedAt as string).slice(0, 7);
                if (!monthlyMap[ym]) monthlyMap[ym] = { toner: 0, drum: 0 };
                if (/toner/i.test(r.part)) monthlyMap[ym].toner += r.quantity;
                else if (/drum/i.test(r.part)) monthlyMap[ym].drum += r.quantity;
              });
              const tT = countFor(modelRows, 'toner');
              const dT = countFor(modelRows, 'drum');

              return (
                <Card key={model}>
                  <CardHeader>
                    <div>
                      <CardTitle>🖨️ {model}</CardTitle>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Set(modelRows.map((r: any) => r.assetId)).size} เครื่อง
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="yellow">🟡 Toner {tT}</Badge>
                      <Badge variant="purple">⭕ Drum {dT}</Badge>
                    </div>
                  </CardHeader>
                  {/* Chart for this model */}
                  <CardContent>
                    <div className="flex items-end gap-1.5 overflow-x-auto pb-2">
                      {chartMonths.map((ym) => {
                        const t = monthlyMap[ym]?.toner ?? 0;
                        const d = monthlyMap[ym]?.drum  ?? 0;
                        const mv = Math.max(...Object.values(monthlyMap).flatMap(v => [v.toner, v.drum]), 1);
                        const th = Math.round((t / mv) * 60);
                        const dh = Math.round((d / mv) * 60);
                        return (
                          <div key={ym} className="flex flex-col items-center gap-1 min-w-[32px]">
                            <div className="flex items-end gap-0.5 h-16">
                              <div title={`Toner: ${t}`} style={{ height: `${th || 2}px` }} className={`w-2.5 rounded-t ${t ? 'bg-amber-400' : 'bg-gray-200'}`} />
                              <div title={`Drum: ${d}`}  style={{ height: `${dh || 2}px` }} className={`w-2.5 rounded-t ${d ? 'bg-purple-400' : 'bg-gray-200'}`} />
                            </div>
                            <div className="text-[9px] text-gray-400">{MONTHS_TH[parseInt(ym.slice(5,7))-1]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </>
      )}
    </>
  );
}
