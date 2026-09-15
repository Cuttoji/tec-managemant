import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

export function EmptyState({ title, message, icon = 'file-tray-outline' }: { title: string; message?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }}>
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <Text style={[typography.h3, { marginTop: spacing.md, textAlign: 'center' }]}>{title}</Text>
      {message ? (
        <Text style={[typography.caption, { marginTop: spacing.xs, textAlign: 'center' }]}>{message}</Text>
      ) : null}
    </View>
  );
}
