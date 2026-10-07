import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../config/theme';

interface AudioWaveformProps {
  levels: number[];
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  levels,
  color = COLORS.timerDark.emerald,
}) => {
  return (
    <View style={styles.container}>
      {levels.map((lvl, idx) => {
        const height = Math.max(4, Math.min(22, lvl * 22));
        return (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
    paddingHorizontal: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
