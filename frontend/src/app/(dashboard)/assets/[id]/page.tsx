import type { Metadata } from 'next';
import { notFound }    from 'next/navigation';
import { auth }        from '@/lib/auth';
import { getAsset, getAssetMaintenanceHistory } from '@/features/assets/queries';
import { AssetDetailClient } from './asset-detail-client';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const asset = await getAsset(Number(params.id));
  return { title: asset?.assetTag ?? `Asset #${params.id}` };
}

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const session = await auth();
  const [asset, history] = await Promise.all([
    getAsset(id),
    getAssetMaintenanceHistory(id),
  ]);

  if (!asset) notFound();

  return (
    <AssetDetailClient
      asset={asset as any}
      history={history as any}
      user={session!.user}
    />
  );
}
