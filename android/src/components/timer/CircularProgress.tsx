import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../../config/theme';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  children?: React.ReactNode;
  isFlashing?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  children,
  isFlashing = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference - clampedProgress * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#10b981" />
            <Stop offset="100%" stopColor="#06b6d4" />
          </LinearGradient>
          <LinearGradient id="flashingGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#10b981" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Dynamic Progress Indicator */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isFlashing ? "url(#flashingGradient)" : "url(#emeraldGradient)"}
          strokeWidth={isFlashing ? strokeWidth + 2 : strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center Label / Timer display */}
      <View style={[StyleSheet.absoluteFillObject, styles.centerContent]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
