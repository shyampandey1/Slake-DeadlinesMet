import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, CheckSquare, Users, Trophy, Settings } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../config/theme';
import { HapticService } from '../../services/hapticService';

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? COLORS.timerDark.emerald : '#64748b';
    const size = 20;

    switch (routeName) {
      case 'Timer':
        return <Clock size={size} color={color} />;
      case 'Dashboard':
        return <CheckSquare size={size} color={color} />;
      case 'Reformers':
        return <Users size={size} color={color} />;
      case 'Rewards':
        return <Trophy size={size} color={color} />;
      case 'Settings':
        return <Settings size={size} color={color} />;
      default:
        return <Clock size={size} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              HapticService.light();
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              {getIcon(route.name, isFocused)}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? COLORS.timerDark.emerald : '#64748b' },
                ]}
              >
                {typeof label === 'string' ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    minWidth: 54,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
});
