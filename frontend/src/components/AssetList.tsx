type Asset = {
  id: number;
  serialNumber?: string | null;
  assetTag?: string | null;
  type?: string | null;
};

export default function AssetList({ items }: { items: Asset[] }) {
  if (!items || items.length === 0) return <div>No assets</div>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
          <th style={{ textAlign: 'left', padding: 8 }}>Serial</th>
          <th style={{ textAlign: 'left', padding: 8 }}>Tag</th>
          <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
        </tr>
      </thead>
      <tbody>
        {items.map(a => (
          <tr key={a.id} style={{ borderTop: '1px solid #eee' }}>
            <td style={{ padding: 8 }}>{a.id}</td>
            <td style={{ padding: 8 }}>{a.serialNumber}</td>
            <td style={{ padding: 8 }}>{a.assetTag}</td>
            <td style={{ padding: 8 }}>{a.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
