import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '@/lib/api';
import { formatDateTH } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';
import type { AssetDetail } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingView } from '@/components/ui/Spinner';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetDetail'>;

const TYPE_LABEL: Record<string, string> = {
  PRINTER: 'เครื่องพิมพ์',
  COMPUTER: 'คอมพิวเตอร์',
  SCANNER: 'เครื่องสแกน',
  OTHER: 'อื่นๆ',
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function AssetDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<AssetDetail>(`/assets/${id}`);
      setAsset(data);
    } catch (e) {
      console.warn('Asset detail load failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!asset) return <LoadingView />;

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {/* Header card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons
            name={asset.type === 'PRINTER' ? 'print' : asset.type === 'COMPUTER' ? 'desktop' : asset.type === 'SCANNER' ? 'scan' : 'cube'}
            size={32}
            color={colors.brandLight}
          />
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.title}>{asset.assetTag ?? asset.model ?? `#${asset.id}`}</Text>
          <Text style={styles.subtitle}>{TYPE_LABEL[asset.type] ?? asset.type}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label={asset.isActive ? 'ใช้งานอยู่' : 'ปลดระวาง'} variant={asset.isActive ? 'success' : 'neutral'} />
          {asset.needsReview ? <Badge label="รอตรวจสอบ" variant="warning" /> : null}
        </View>
      </Card>

      {/* Info */}
      <Card padded style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลทั่วไป</Text>
        <Row label="Serial Number" value={asset.serialNumber} />
        <Row label="รุ่น" value={asset.model} />
        <Row label="สถานที่" value={asset.location?.name} />
        <Row label="วันที่สร้าง" value={formatDateTH(asset.createdAt)} />
      </Card>

      {/* Page counters */}
      <Card padded style={styles.section}>
        <Text style={styles.sectionTitle}>ยอดตัวนับหน้า</Text>
        {asset.pageCounters?.length ? (
          asset.pageCounters.map((pc) => (
            <View key={pc.id} style={styles.counterRow}>
              <Text style={styles.counterLabel}>{formatDateTH(pc.recordedAt)}</Text>
              <Text style={styles.counterValue}>{pc.total.toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>ไม่พบข้อมูลตัวนับหน้า</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerBody: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  counterLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  counterValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
