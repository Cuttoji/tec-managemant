import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-bold text-gray-200">404</div>
      <h2 className="text-xl font-semibold text-gray-700">ไม่พบหน้าที่ต้องการ</h2>
      <p className="text-sm text-gray-500">URL ที่คุณเข้ามาไม่มีอยู่ในระบบ</p>
      <Button asChild variant="outline">
        <Link href="/dashboard">กลับหน้าหลัก</Link>
      </Button>
    </div>
  );
}
