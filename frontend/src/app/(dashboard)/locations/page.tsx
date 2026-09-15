import type { Metadata } from 'next';
import { listLocations }   from '@/features/locations/queries';
import { LocationsClient } from './locations-client';

export const metadata: Metadata = { title: 'Locations' };

export default async function LocationsPage() {
  const locations = await listLocations();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <p className="text-sm text-gray-500 mt-0.5">จัดการสถานที่ติดตั้งครุภัณฑ์ ({locations.length} แห่ง)</p>
      </div>
      <LocationsClient locations={locations as any} />
    </div>
  );
}
