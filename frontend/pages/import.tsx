import { useState } from 'react';
import { post } from '../src/lib/api';

export default function ImportPage() {
  const [fileText, setFileText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function upload() {
    setLoading(true);
    try {
      const res = await post('/import/bradmin/csv', fileText, 'text/csv');
      setResult(res);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally { setLoading(false); }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Import BRAdmin CSV</h1>
      <p>Paste CSV content or upload small CSV files.</p>
      <textarea style={{ width: '100%', height: 300 }} value={fileText} onChange={e => setFileText(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={upload} disabled={loading}>Upload</button>
      </div>
      {result && <pre style={{ marginTop: 12 }}>{JSON.stringify(result, null, 2)}</pre>} 
    </main>
  );
}
