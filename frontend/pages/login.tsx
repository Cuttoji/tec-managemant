import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { post, storeAuthResponse } from '../src/lib/api';

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === 'true';

export default function Login() {
  const [email, setEmail]       = useState(IS_MOCK ? 'admin@demo.com' : '');
  const [password, setPassword] = useState(IS_MOCK ? 'demo1234' : '');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const json = await post('/auth/login', { email, password });
      if (!json.token) throw new Error(json.error || 'Login failed');
      storeAuthResponse(json);
      router.push('/');
    } catch (err) {
      setError((err as Error).message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    }}>
      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 56px',
        color: '#fff',
      }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚙️</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          TechManage
        </h1>
        <p style={{ fontSize: 17, opacity: .85, maxWidth: 340, lineHeight: 1.6 }}>
          ระบบจัดการครุภัณฑ์และติดตามการซ่อมบำรุง สำหรับทีมเทคนิค
        </p>
        {IS_MOCK && (
          <div style={{ marginTop: 24, padding: '10px 14px', background: 'rgba(255,255,255,.15)', borderRadius: 8, fontSize: 13, border: '1px solid rgba(255,255,255,.25)' }}>
            🧪 <strong>Mock Mode</strong> — ทำงานโดยไม่ต้องรัน backend
          </div>
        )}
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '🖥️', text: 'ติดตามสถานะครุภัณฑ์แบบ real-time' },
            { icon: '🔧', text: 'จัดการงานซ่อมตั้งแต่รับงานถึงปิดงาน' },
            { icon: '📊', text: 'ดูสถิติและประวัติการซ่อมได้ครบถ้วน' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: .9 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: 460,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: 'var(--gray-900)' }}>
            เข้าสู่ระบบ
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 32 }}>
            {IS_MOCK ? '🧪 Mock Mode — กด เข้าสู่ระบบ ได้เลย' : 'กรุณาใส่ข้อมูลผู้ใช้งานของคุณ'}
          </p>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="yourname@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> กำลังเข้าสู่ระบบ...</>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop: 32,
            padding: '12px 14px',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-200)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
              🧪 Demo Accounts
            </p>
            {[
              { label: 'Admin',       email: 'admin@demo.com',  pass: 'demo1234' },
              { label: 'Technician',  email: 'tech@demo.com',   pass: 'demo1234' },
            ].map(({ label, email: e, pass }) => (
              <div
                key={e}
                onClick={() => { setEmail(e); setPassword(pass); }}
                style={{
                  cursor: 'pointer',
                  padding: '5px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'var(--gray-600)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'background .12s',
                }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--gray-100)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ opacity: .7 }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
