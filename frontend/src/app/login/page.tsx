'use client';

import { useState, FormEvent } from 'react';
import { signIn }   from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Alert }    from '@/components/ui/alert';
import { Spinner }  from '@/components/ui/spinner';

const DEMO_ACCOUNTS = [
  { label: 'Admin',      email: 'admin@demo.com', pass: 'demo1234' },
  { label: 'Technician', email: 'tech@demo.com',  pass: 'demo1234' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email, password, redirect: false,
      });
      if (res?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2563eb]">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-14 text-white">
        <div className="text-4xl mb-5">⚙️</div>
        <h1 className="text-3xl font-extrabold mb-3 leading-tight">TechManage</h1>
        <p className="text-lg opacity-80 max-w-xs leading-relaxed">
          ระบบจัดการครุภัณฑ์และติดตามการซ่อมบำรุง สำหรับทีมเทคนิค
        </p>
        <ul className="mt-10 space-y-3">
          {[
            { icon: '🖥️', text: 'ติดตามสถานะครุภัณฑ์แบบ real-time' },
            { icon: '🔧', text: 'จัดการงานซ่อมตั้งแต่รับงานถึงปิดงาน' },
            { icon: '📊', text: 'วิเคราะห์สถิติและประวัติการซ่อม' },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-3 opacity-90 text-sm">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-[460px] flex-shrink-0 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[340px]">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">เข้าสู่ระบบ</h2>
          <p className="text-sm text-gray-500 mb-8">กรุณาใส่ข้อมูลผู้ใช้งานของคุณ</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" autoFocus required
                placeholder="yourname@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" required
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Spinner className="h-4 w-4" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-600">🧪 Demo Accounts</p>
            {DEMO_ACCOUNTS.map(({ label, email: e, pass }) => (
              <button
                key={e}
                type="button"
                onClick={() => { setEmail(e); setPassword(pass); }}
                className="flex w-full justify-between rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold">{label}</span>
                <span className="opacity-60">{e}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
