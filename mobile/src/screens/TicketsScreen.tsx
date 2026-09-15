import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '@/lib/api';
import { formatDateTimeTH } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import type { TicketRow, TicketListResult, MaintenanceStatus } from '@/types';
import { MAINTENANCE_STATUS_LABEL } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingView, Spinner } from '@/components/ui/Spinner';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Tickets'>,
  NativeStackScreenProps<RootStackParamList>
>;

const LIMIT = 20;

const FILTERS: { key: MaintenanceStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'OPEN', label: 'รอรับงาน' },
  { key: 'IN_PROGRESS', label: 'กำลังซ่อม' },
  { key: 'COMPLETED', label: 'รอ Review' },
  { key: 'REVIEWED', label: 'เสร็จสิ้น' },
];

const STATUS_BADGE: Record<MaintenanceStatus, 'warning' | 'info' | 'purple' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'purple',
  REVIEWED: 'success',
};

export default function TicketsScreen({ navigation }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [items, setItems] = useState<TicketRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (status: MaintenanceStatus | 'ALL', pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', String(LIMIT));
      if (status !== 'ALL') params.set('status', status);
      const res = await apiGet<TicketListResult>(`/maintenance?${params.toString()}`);
      setTotal(res.total);
      setPage(res.page);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      console.warn('Tickets load failed', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(selectedStatus, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSelectStatus(status: MaintenanceStatus | 'ALL') {
    setSelectedStatus(status);
    load(status, 1, false);
  }

  function onEndReached() {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    load(selectedStatus, page + 1, true);
  }

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>งานซ่อม</Text>
        <Text style={styles.subtitle}>{total} รายการ</Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => {
          const active = selectedStatus === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onSelectStatus(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(selectedStatus, 1, false);
            }}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState title="ไม่พบงานซ่อม" message="ลองเปลี่ยนตัวกรองสถานะ" icon="construct-outline" />
        }
        ListFooterComponent={
          loadingMore ? <Spinner style={{ marginVertical: spacing.lg }} /> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
            activeOpacity={0.7}
          >
            <Card style={styles.row}>
              <View style={styles.rowTop}>
                <Badge
                  label={MAINTENANCE_STATUS_LABEL[item.status] ?? item.status}
                  variant={STATUS_BADGE[item.status] ?? 'neutral'}
                />
                <Text style={styles.rowDate}>{formatDateTimeTH(item.createdAt)}</Text>
              </View>
              <View style={styles.rowMiddle}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.asset.assetTag ?? item.asset.model ?? `#${item.assetId}`}
                </Text>
                <Text style={styles.rowIssue} numberOfLines={2}>
                  {item.issueDetails}
                </Text>
              </View>
              {item.technician ? (
                <View style={styles.rowBottom}>
                  <Ionicons name="person-circle-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.techName}>{item.technician.name}</Text>
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chips: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  rowMiddle: {
    marginTop: spacing.sm,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowIssue: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  techName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
