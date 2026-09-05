'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">⚠️</div>
      <h2 className="text-xl font-bold text-gray-800">เกิดข้อผิดพลาด</h2>
      <p className="text-sm text-gray-500 max-w-sm">{error.message || 'ไม่สามารถโหลดหน้านี้ได้'}</p>
      {error.digest && (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">ID: {error.digest}</code>
      )}
      <Button onClick={reset} variant="outline">ลองใหม่</Button>
    </div>
  );
}
