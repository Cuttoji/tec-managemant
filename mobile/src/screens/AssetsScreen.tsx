import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiGet } from '@/lib/api';
import { formatDateTH } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import type { AssetRow, AssetListResult } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingView, Spinner } from '@/components/ui/Spinner';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Assets'>,
  NativeStackScreenProps<RootStackParamList>
>;

const LIMIT = 20;

const TYPE_LABEL: Record<string, string> = {
  PRINTER: 'เครื่องพิมพ์',
  COMPUTER: 'คอมพิวเตอร์',
  SCANNER: 'เครื่องสแกน',
  OTHER: 'อื่นๆ',
};

export default function AssetsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<AssetRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search: string, pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', String(LIMIT));
      if (search.trim()) params.set('model', search.trim());
      const res = await apiGet<AssetListResult>(`/assets?${params.toString()}`);
      setTotal(res.total);
      setPage(res.page);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      console.warn('Assets load failed', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(query, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(text: string) {
    setQuery(text);
    load(text, 1, false);
  }

  function onEndReached() {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    load(query, page + 1, true);
  }

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>ครุภัณฑ์</Text>
        <Text style={styles.subtitle}>{total} รายการ</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาจากรุ่น, แท็ก, ซีเรียล..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={onSearch}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => onSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(query, 1, false);
            }}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState title="ไม่พบครุภัณฑ์" message="ลองเปลี่ยนคำค้นหา" icon="hardware-chip-outline" />
        }
        ListFooterComponent={
          loadingMore ? <Spinner style={{ marginVertical: spacing.lg }} /> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('AssetDetail', { id: item.id })}
            activeOpacity={0.7}
          >
            <Card style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name={item.type === 'PRINTER' ? 'print' : item.type === 'COMPUTER' ? 'desktop' : item.type === 'SCANNER' ? 'scan' : 'cube'}
                  size={22}
                  color={colors.brandLight}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.assetTag ?? item.model ?? item.serialNumber ?? `#${item.id}`}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {TYPE_LABEL[item.type] ?? item.type}
                  {item.location ? ` · ${item.location.name}` : ''}
                </Text>
                <Text style={styles.rowDate}>{formatDateTH(item.createdAt)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Badge label={item.isActive ? 'ใช้งาน' : 'ปลดระวาง'} variant={item.isActive ? 'success' : 'neutral'} />
                {item.needsReview ? <Badge label="รอตรวจ" variant="warning" /> : null}
              </View>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
