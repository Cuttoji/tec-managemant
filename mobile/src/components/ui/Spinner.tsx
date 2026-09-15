import React from 'react';
import { ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/theme';

export function Spinner({ size = 'small', color = colors.brandLight, style }: { size?: 'small' | 'large'; color?: string; style?: ViewStyle }) {
  return <ActivityIndicator size={size} color={color} style={style} />;
}

export function LoadingView() {
  return (
    <ActivityIndicator
      size="large"
      color={colors.brandLight}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
