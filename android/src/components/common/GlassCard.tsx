import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../config/theme';

interface GlassCardProps extends ViewProps {
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, glow, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        glow && styles.cardGlow,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.timerDark.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.timerDark.cardBorder,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGlow: {
    borderColor: COLORS.timerDark.emerald,
    shadowColor: COLORS.timerDark.emerald,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
