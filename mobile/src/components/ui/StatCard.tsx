import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type StatVariant = 'blue' | 'green' | 'amber' | 'gray' | 'purple';

const VARIANTS: Record<StatVariant, { bg: string; fg: string }> = {
  blue: { bg: colors.infoSoft, fg: colors.info },
  green: { bg: colors.successSoft, fg: colors.success },
  amber: { bg: colors.warningSoft, fg: colors.warning },
  gray: { bg: colors.bg, fg: colors.textSecondary },
  purple: { bg: colors.purpleSoft, fg: colors.purple },
};

export function StatCard({
  label,
  value,
  icon,
  variant = 'blue',
}: {
  label: string;
  value: number;
  icon: IconName;
  variant?: StatVariant;
}) {
  const v = VARIANTS[variant];
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: v.bg }]}>
        <Ionicons name={icon} size={18} color={v.fg} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minWidth: 0,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
