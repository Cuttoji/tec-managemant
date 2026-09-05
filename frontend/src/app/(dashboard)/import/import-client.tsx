'use client';

import { useRef, useState } from 'react';
import { useRouter }        from 'next/navigation';
import { Button }           from '@/components/ui/button';
import { Textarea }         from '@/components/ui/textarea';
import { Badge }            from '@/components/ui/badge';
import { Alert }            from '@/components/ui/alert';
import { Spinner }          from '@/components/ui/spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast }         from '@/components/ui/toast';
import { importBrAdminCsvAction } from '@/features/import/actions';
import { formatDateTH }     from '@/lib/utils';

export function ImportClient({ recentLogs }: { recentLogs: any[] }) {
  const router  = useRouter();
  const toast   = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileText,  setFileText]  = useState('');
  const [fileName,  setFileName]  = useState('');
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileText(String(ev.target?.result ?? ''));
    reader.readAsText(f, 'utf-8');
  }

  async function upload() {
    if (!fileText.trim()) { toast.error('กรุณาเลือกไฟล์หรือวาง CSV'); return; }
    setLoading(true);
    const res = await importBrAdminCsvAction(fileText, fileName || 'upload.csv');
    setLoading(false);
    if (!res.success) { setResult({ error: res.error }); return; }
    setResult(res.data);
    toast.success(`Import สำเร็จ: สร้าง ${res.data?.created} เครื่อง, อัปเดต ${res.data?.updated} เครื่อง`);
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Upload card */}
      <Card>
        <CardHeader><CardTitle>อัปโหลดไฟล์ CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
            <div className="text-4xl mb-3">📥</div>
            <div className="font-semibold text-sm">{fileName || 'คลิกเพื่อเลือกไฟล์'}</div>
            <div className="text-xs text-gray-400 mt-1">หรือวาง CSV content ด้านล่าง</div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500 mb-1.5">CSV Content</div>
            <Textarea
              className="font-mono text-xs min-h-[180px]"
              value={fileText}
              onChange={(e) => setFileText(e.target.value)}
              placeholder="วาง CSV content ที่นี่..."
            />
          </div>

          <Button onClick={upload} disabled={loading || !fileText.trim()} className="w-full sm:w-auto">
            {loading ? <><Spinner className="h-4 w-4" /> กำลัง Import...</> : '📤 Import'}
          </Button>

          {/* Result */}
          {result && (
            <div className="mt-2">
              {result.error ? (
                <Alert variant="error">{result.error}</Alert>
              ) : (
                <Alert variant="success">
                  <div className="space-y-1">
                    <div>✅ Import สำเร็จ</div>
                    <div className="text-xs">
                      พบ {result.devices} เครื่อง &bull;
                      สร้างใหม่ {result.created} &bull;
                      อัปเดต {result.updated} &bull;
                      ไม่ตรง {result.unmatched}
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right column */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>ℹ️ วิธีใช้</CardTitle></CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Export CSV จาก BRAdmin Pro หรือ BRAdmin Light</li>
              <li>เลือกไฟล์ .csv หรือวาง content โดยตรง</li>
              <li>กด Import เพื่อนำเข้าข้อมูล</li>
              <li>ระบบจะสร้าง Asset ใหม่ (รอ Review) อัตโนมัติ</li>
            </ol>
          </CardContent>
        </Card>

        {recentLogs.length > 0 && (
          <Card>
            <CardHeader><CardTitle>📋 Import ล่าสุด</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-gray-700 truncate">{log.filename}</span>
                      <Badge variant={log.unmatchedCount > 0 ? 'warning' : 'success'}>
                        ไม่ตรง {log.unmatchedCount}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {formatDateTH(log.createdAt)} &bull; {log.createdByUser?.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
