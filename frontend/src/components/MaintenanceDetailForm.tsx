import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { get, put, post } from '../lib/api';

interface ComponentRow { part: string; quantity: number }

interface RepairFormValues {
  symptom: string;
  partReplacedAt: string;
  brand: string;
  totalPageAtRepair: string;
  repairDetails: string;
  usedLoaner: boolean;
  loanerAssetId: string;
  loanerPageStart: string;
  loanerPageEnd: string;
  components: ComponentRow[];
}

interface Props {
  maintenanceId: number;
  /** Pre-fill from the parent asset */
  assetModel?: string | null;
  latestPage?: number | null;
  /** existing values when editing */
  existing?: Partial<RepairFormValues & { components: ComponentRow[] }>;
  onSuccess: () => void;
  onCancel: () => void;
  /** 'complete' = submit via POST /:id/complete | 'edit' = submit via PUT /:id/details */
  mode: 'complete' | 'edit';
}

export default function MaintenanceDetailForm({
  maintenanceId,
  assetModel,
  latestPage,
  existing,
  onSuccess,
  onCancel,
  mode,
}: Props) {
  const { data: assetsData } = useSWR('/assets?limit=100', () => get('/assets?limit=100'));

  const [values, setValues] = useState<RepairFormValues>({
    symptom: existing?.symptom ?? '',
    partReplacedAt: existing?.partReplacedAt ?? '',
    brand: existing?.brand ?? assetModel ?? '',
    totalPageAtRepair: existing?.totalPageAtRepair != null
      ? String(existing.totalPageAtRepair)
      : latestPage != null ? String(latestPage) : '',
    repairDetails: existing?.repairDetails ?? '',
    usedLoaner: existing?.usedLoaner ?? false,
    loanerAssetId: existing?.loanerAssetId ? String(existing.loanerAssetId) : '',
    loanerPageStart: existing?.loanerPageStart != null ? String(existing.loanerPageStart) : '',
    loanerPageEnd: existing?.loanerPageEnd != null ? String(existing.loanerPageEnd) : '',
    components: existing?.components ?? [{ part: '', quantity: 1 }],
  });
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof RepairFormValues>(key: K, value: RepairFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addComponent() {
    setField('components', [...values.components, { part: '', quantity: 1 }]);
  }

  function removeComponent(idx: number) {
    setField('components', values.components.filter((_, i) => i !== idx));
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: string | number) {
    const next = values.components.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setField('components', next);
  }

  async function submit() {
    if (!values.repairDetails.trim()) {
      alert('กรุณากรอกรายละเอียดการซ่อม');
      return;
    }
    if (values.usedLoaner && !values.loanerAssetId) {
      alert('กรุณาเลือกเครื่องสำรอง');
      return;
    }

    setLoading(true);
    try {
      const body = {
        repairDetails: values.repairDetails,
        symptom: values.symptom || undefined,
        partReplacedAt: values.partReplacedAt || undefined,
        brand: values.brand || undefined,
        totalPageAtRepair: values.totalPageAtRepair ? Number(values.totalPageAtRepair) : undefined,
        usedLoaner: values.usedLoaner,
        loanerAssetId: values.loanerAssetId ? Number(values.loanerAssetId) : undefined,
        loanerPageStart: values.loanerPageStart ? Number(values.loanerPageStart) : undefined,
        loanerPageEnd: values.loanerPageEnd ? Number(values.loanerPageEnd) : undefined,
      };

      if (mode === 'complete') {
        await post(`/maintenance/${maintenanceId}/complete`, body);
      } else {
        await put(`/maintenance/${maintenanceId}/details`, body);
      }

      // Save components (add any filled rows)
      for (const c of values.components) {
        if (c.part.trim() && c.quantity >= 1) {
          await post(`/maintenance/${maintenanceId}/components`, { part: c.part, quantity: c.quantity });
        }
      }

      onSuccess();
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 };
  const sectionStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, background: '#fafafa' }}>
      <h3 style={{ marginTop: 0 }}>
        {mode === 'complete' ? 'บันทึกรายละเอียดการซ่อม' : 'แก้ไขรายละเอียดการซ่อม'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* อาการเสีย */}
        <div style={sectionStyle}>
          <label style={labelStyle}>อาการเสีย</label>
          <input style={inputStyle} value={values.symptom} onChange={(e) => setField('symptom', e.target.value)} placeholder="เช่น กระดาษติด, พิมพ์ไม่ออก" />
        </div>

        {/* วันที่/เวลาเปลี่ยนอะไหล่ */}
        <div style={sectionStyle}>
          <label style={labelStyle}>วันที่/เวลาเปลี่ยนอะไหล่</label>
          <input style={inputStyle} type="datetime-local" value={values.partReplacedAt} onChange={(e) => setField('partReplacedAt', e.target.value)} />
        </div>

        {/* แบรนด์/รุ่น */}
        <div style={sectionStyle}>
          <label style={labelStyle}>แบรนด์/รุ่น</label>
          <input style={inputStyle} value={values.brand} onChange={(e) => setField('brand', e.target.value)} placeholder="pre-fill จาก asset" />
        </div>

        {/* Total Page */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Total Page (ขณะซ่อม)</label>
          <input style={inputStyle} type="number" min={0} value={values.totalPageAtRepair} onChange={(e) => setField('totalPageAtRepair', e.target.value)} placeholder="pre-fill จาก page counter ล่าสุด" />
        </div>
      </div>

      {/* รายละเอียดการซ่อม */}
      <div style={sectionStyle}>
        <label style={labelStyle}>รายละเอียดการซ่อม *</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={values.repairDetails}
          onChange={(e) => setField('repairDetails', e.target.value)}
          placeholder="อธิบายขั้นตอนการซ่อม..."
        />
      </div>

      {/* รายการอะไหล่ */}
      <div style={sectionStyle}>
        <label style={labelStyle}>รายการอะไหล่</label>
        {values.components.map((c, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 3, padding: '7px 10px' }}
              placeholder="ชื่ออะไหล่"
              value={c.part}
              onChange={(e) => updateComponent(idx, 'part', e.target.value)}
            />
            <input
              style={{ flex: 1, padding: '7px 10px' }}
              type="number"
              min={1}
              placeholder="จำนวน"
              value={c.quantity}
              onChange={(e) => updateComponent(idx, 'quantity', Number(e.target.value))}
            />
            <button
              type="button"
              onClick={() => removeComponent(idx)}
              style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
              disabled={values.components.length === 1}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={addComponent} style={{ fontSize: 13, padding: '4px 12px' }}>
          + เพิ่มอะไหล่
        </button>
      </div>

      {/* เครื่องสำรอง */}
      <div style={sectionStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={values.usedLoaner}
            onChange={(e) => setField('usedLoaner', e.target.checked)}
          />
          <span style={{ fontWeight: 500 }}>ใช้เครื่องสำรอง</span>
        </label>

        {values.usedLoaner && (
          <div style={{ paddingLeft: 24, borderLeft: '3px solid #3b82f6' }}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>ชื่อเครื่อง / Serial Number</label>
              <select
                style={{ ...inputStyle }}
                value={values.loanerAssetId}
                onChange={(e) => setField('loanerAssetId', e.target.value)}
              >
                <option value="">— เลือกเครื่องสำรอง —</option>
                {(assetsData?.items || []).map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag || a.serialNumber || `Asset #${a.id}`} — {a.model || a.type}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Page Start</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={values.loanerPageStart}
                  onChange={(e) => setField('loanerPageStart', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Page End</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={values.loanerPageEnd}
                  onChange={(e) => setField('loanerPageEnd', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={submit}
          disabled={loading}
          style={{ padding: '9px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {loading ? 'กำลังบันทึก...' : mode === 'complete' ? 'ปิดงาน' : 'บันทึก'}
        </button>
        <button onClick={onCancel} style={{ padding: '9px 16px' }} disabled={loading}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
