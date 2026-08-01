import useSWR from 'swr';
import { useState } from 'react';
import { get } from '../../src/lib/api';

export default function ImportLogs() {
  const [page, setPage] = useState(1);
  const key = `/import/logs?page=${page}&limit=20`;
  const { data, error } = useSWR(key, () => get(key));

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Logs</h1>
          <p className="page-subtitle">ประวัติการ import ข้อมูลทั้งหมด</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-error card-body">โหลดข้อมูลไม่สำเร็จ</div>}
        {!data && !error && <div className="page-loading"><div className="spinner" /><span>กำลังโหลด...</span></div>}
        {data && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>ไฟล์</th>
                    <th>ไม่ตรง Serial</th>
                    <th>วันที่ Import</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <div className="empty-text">ยังไม่มีประวัติ Import</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.items.map((l: any) => (
                    <tr key={l.id}>
                      <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>#{l.id}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.filename}</span>
                      </td>
                      <td>
                        <span className={`badge ${l.unmatchedCount > 0 ? 'badge-yellow' : 'badge-green'}`}>
                          {l.unmatchedCount} รายการ
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                        {new Date(l.createdAt).toLocaleString('th-TH')}
                      </td>
                      <td><span className="badge badge-green">✓ สำเร็จ</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← ก่อนหน้า</button>
                <span className="text-sm text-muted">หน้า {page} / {totalPages}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>ถัดไป →</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
