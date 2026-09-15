import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { formatDateTimeTH } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import type { Stats, TicketStats, TicketRow, MaintenanceStatus } from '@/types';
import { MAINTENANCE_STATUS_LABEL } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingView } from '@/components/ui/Spinner';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Dashboard'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_BADGE: Record<MaintenanceStatus, 'warning' | 'info' | 'purple' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'purple',
  REVIEWED: 'success',
};

export default function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [assetStats, setAssetStats] = useState<Stats | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [assets, tickets, recent] = await Promise.all([
        apiGet<Stats>('/assets/stats'),
        apiGet<TicketStats>('/maintenance/stats'),
        apiGet<{ items: TicketRow[] }>('/maintenance?limit=20'),
      ]);
      setAssetStats(assets);
      setTicketStats(tickets);
      setRecentTickets(
        recent.items.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').slice(0, 8)
      );
    } catch (e) {
      console.warn('Dashboard load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function confirmLogout() {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  if (loading) return <LoadingView />;

  const a = assetStats ?? { total: 0, active: 0, needsReview: 0, retired: 0 };
  const t = ticketStats ?? { open: 0, inProgress: 0, completed: 0, reviewed: 0 };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>สวัสดี, {user?.name}</Text>
            <Text style={styles.role}>{user?.role}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Assets stats */}
        <Text style={styles.sectionTitle}>Assets</Text>
        <View style={styles.statGrid}>
          <StatCard label="ทั้งหมด" value={a.total} icon="hardware-chip-outline" variant="blue" />
          <StatCard label="ใช้งานอยู่" value={a.active} icon="checkmark-circle-outline" variant="green" />
          <StatCard label="รอตรวจสอบ" value={a.needsReview} icon="alert-circle-outline" variant="amber" />
          <StatCard label="ปลดระวาง" value={a.retired} icon="trash-outline" variant="gray" />
        </View>

        {/* Ticket stats */}
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <View style={styles.statGrid}>
          <StatCard label="รอรับงาน" value={t.open} icon="document-text-outline" variant="amber" />
          <StatCard label="กำลังซ่อม" value={t.inProgress} icon="construct-outline" variant="blue" />
          <StatCard label="รอ Review" value={t.completed} icon="search-outline" variant="purple" />
          <StatCard label="เสร็จสิ้น" value={t.reviewed} icon="checkmark-done-outline" variant="green" />
        </View>

        {/* Recent tickets */}
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>งานซ่อมที่รอดำเนินการ</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tickets')}>
              <Text style={styles.link}>ดูทั้งหมด →</Text>
            </TouchableOpacity>
          </View>
          {recentTickets.length === 0 ? (
            <EmptyState title="ไม่มีงานค้างอยู่" icon="checkmark-circle-outline" />
          ) : (
            recentTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketRow}
                onPress={() => navigation.navigate('TicketDetail', { id: ticket.id })}
                activeOpacity={0.7}
              >
                <View style={styles.ticketLeft}>
                  <Badge
                    label={MAINTENANCE_STATUS_LABEL[ticket.status] ?? ticket.status}
                    variant={STATUS_BADGE[ticket.status] ?? 'neutral'}
                  />
                  <Text style={styles.ticketTitle} numberOfLines={1}>
                    {ticket.asset.assetTag ?? ticket.asset.model ?? `Ticket #${ticket.id}`}
                  </Text>
                </View>
                <View style={styles.ticketRight}>
                  <Text style={styles.ticketDate}>{formatDateTimeTH(ticket.createdAt)}</Text>
                  {ticket.technician ? (
                    <Text style={styles.ticketTech}>👤 {ticket.technician.name}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  role: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    fontSize: 13,
    color: colors.brandLight,
    fontWeight: '600',
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ticketLeft: {
    flex: 1,
    marginRight: spacing.md,
    gap: 6,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ticketRight: {
    alignItems: 'flex-end',
  },
  ticketDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  ticketTech: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
