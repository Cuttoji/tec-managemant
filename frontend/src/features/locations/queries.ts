import { db } from '@/lib/db';

export async function listLocations() {
  return db.location.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { assets: true } } },
  });
}

export async function getLocation(id: number) {
  return db.location.findUnique({
    where:   { id },
    include: { _count: { select: { assets: true } } },
  });
}
