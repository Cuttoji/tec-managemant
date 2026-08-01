import { useState, useRef } from 'react';
import { post } from '../src/lib/api';

export default function ImportPage() {
  const [fileText,  setFileText]  = useState('');
  const [fileName,  setFileName]  = useState('');
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = ev => setFileText(String(ev.target?.result || ''));
    reader.readAsText(f, 'utf-8');
  }

  async function upload() {
    if (!fileText.trim()) { alert('กรุณาเลือกไฟล์หรือวาง CSV'); return; }
    setLoading(true);
    try {
      const res = await post('/import/bradmin/csv', fileText, 'text/csv');
      setResult(res);
    } catch (err: any) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import BRAdmin</h1>
          <p className="page-subtitle">นำเข้าข้อมูลเครื่องจาก BRAdmin CSV</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Main upload card */}
        <div className="card">
          <div className="card-header"><span className="card-title">อัปโหลดไฟล์ CSV</span></div>
          <div className="card-body">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--gray-300)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--gray-50)',
                transition: 'border-color .15s, background .15s',
                marginBottom: 16,
              }}
              onMouseEnter={e => { (e.currentTarget as any).style.borderColor = 'var(--primary)'; (e.currentTarget as any).style.background = 'var(--primary-light)'; }}
              onMouseLeave={e => { (e.currentTarget as any).style.borderColor = 'var(--gray-300)'; (e.currentTarget as any).style.background = 'var(--gray-50)'; }}
            >
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={onFile} />
              <div style={{ fontSize: 36, marginBottom: 10 }}>📥</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {fileName || 'คลิกเพื่อเลือกไฟล์'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>หรือวาง CSV content ด้านล่าง</div>
            </div>

            <div className="form-group">
              <label className="form-label">CSV Content (สามารถวางข้อความโดยตรง)</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12 }}
                value={fileText}
                onChange={e => setFileText(e.target.value)}
                placeholder="วาง CSV content ที่นี่..."
              />
            </div>

            <button className="btn btn-primary" onClick={upload} disabled={loading || !fileText.trim()}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> กำลัง Import...</> : '📤 Import'}
            </button>
          </div>
        </div>

        {/* Info card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">ℹ️ วิธีใช้</span></div>
            <div className="card-body" style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7 }}>
              <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Export CSV จาก BRAdmin Pro หรือ BRAdmin Light</li>
                <li>เลือกไฟล์ .csv หรือวาง content โดยตรง</li>
                <li>กด Import เพื่อนำเข้าข้อมูล</li>
                <li>ระบบจะสร้าง Asset ใหม่อัตโนมัติ (status: รอ Review)</li>
              </ol>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  {result.error ? '❌ ผิดพลาด' : '✅ Import สำเร็จ'}
                </span>
              </div>
              <div className="card-body">
                {result.error ? (
                  <div className="alert alert-error">{result.error}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>ไฟล์</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.file}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>อุปกรณ์ที่พบ</span>
                      <span className="badge badge-green">{result.parsed?.devices?.length ?? 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>ไม่ตรง Serial</span>
                      <span className={`badge ${result.unmatchedCount > 0 ? 'badge-yellow' : 'badge-green'}`}>
                        {result.unmatchedCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
