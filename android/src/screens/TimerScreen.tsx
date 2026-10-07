import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Square, Volume2, VolumeX, Users, Bell, Flame } from 'lucide-react-native';
import { useTimer } from '../context/TimerContext';
import { useTasks } from '../context/TaskContext';
import { CircularProgress } from '../components/timer/CircularProgress';
import { GlassCard } from '../components/common/GlassCard';
import { COLORS, RADIUS, SPACING } from '../config/theme';
import { HapticService } from '../services/hapticService';

export const TimerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    timeLeft,
    duration,
    isRunning,
    isPaused,
    activeTaskName,
    focusInterval,
    isIntervalFlashing,
    soundEnabled,
    isCoOpActive,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setFocusInterval,
    toggleSound,
  } = useTimer();

  const { tasks, toggleTaskCompletion } = useTasks();
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  const presets = [
    { name: 'Deep Work Sprint', minutes: 25 },
    { name: 'Ultra Focus Block', minutes: 50 },
    { name: 'Power Focus Sprint', minutes: 15 },
    { name: 'Box Breathing Reset', minutes: 5 },
  ];

  const intervals = [3, 5, 10, 15];

  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleStartPreset = (name: string, mins: number) => {
    startTimer(name, mins);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 56) }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar with Sound Toggle positioned prominently & safely */}
        <View style={styles.topBar}>
          {isCoOpActive ? (
            <View style={styles.coOpBadge}>
              <Users size={14} color="#10b981" />
              <Text style={styles.coOpBadgeText}>Co-Op Sync Active</Text>
            </View>
          ) : (
            <View style={styles.idleBadge}>
              <Flame size={14} color="#f59e0b" />
              <Text style={styles.idleBadgeText}>Solo Focus Mode</Text>
            </View>
          )}

          {/* Sound Toggle - Elevated & completely accessible */}
          <Pressable
            onPress={toggleSound}
            style={[styles.iconButton, soundEnabled && styles.iconButtonActive]}
            hitSlop={12}
          >
            {soundEnabled ? (
              <Volume2 size={18} color="#10b981" />
            ) : (
              <VolumeX size={18} color="#64748b" />
            )}
          </Pressable>
        </View>

        {/* Task Title Header */}
        <View style={styles.titleSection}>
          <Text style={styles.activeTaskLabel}>CURRENT FOCUS TARGET</Text>
          <Text style={styles.activeTaskTitle} numberOfLines={2}>
            {activeTaskName}
          </Text>
        </View>

        {/* Circular Countdown Gauge */}
        <View style={styles.gaugeContainer}>
          <CircularProgress
            size={260}
            strokeWidth={14}
            progress={progress}
            isFlashing={isIntervalFlashing}
          >
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerDisplay}>{formattedTime}</Text>
              <Text style={styles.timerSublabel}>
                {isRunning ? (isPaused ? 'PAUSED' : 'FOCUSING') : 'READY'}
              </Text>
            </View>
          </CircularProgress>
        </View>

        {/* Interval Marker Banner */}
        <View style={[styles.intervalBanner, isIntervalFlashing && styles.intervalBannerFlashing]}>
          <Bell size={14} color={isIntervalFlashing ? "#f59e0b" : "#10b981"} />
          <Text style={styles.intervalText}>
            {isIntervalFlashing
              ? `⚡ Interval Alert! ${focusInterval}m milestone reached`
              : `Chime & Haptic Alert Every ${focusInterval} Minutes`}
          </Text>
        </View>

        {/* Primary Controls */}
        <View style={styles.controlsRow}>
          {!isRunning ? (
            <Pressable
              style={styles.primaryActionButton}
              onPress={() => {
                const current = presets[selectedPresetIndex];
                handleStartPreset(current.name, current.minutes);
              }}
            >
              <Play size={22} color="#020617" fill="#020617" />
              <Text style={styles.primaryActionText}>START FOCUS</Text>
            </Pressable>
          ) : (
            <>
              {isPaused ? (
                <Pressable style={styles.resumeButton} onPress={resumeTimer}>
                  <Play size={20} color="#020617" fill="#020617" />
                  <Text style={styles.resumeButtonText}>RESUME</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.pauseButton} onPress={pauseTimer}>
                  <Pause size={20} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.pauseButtonText}>PAUSE</Text>
                </Pressable>
              )}

              <Pressable style={styles.stopButton} onPress={stopTimer}>
                <Square size={18} color="#ef4444" fill="#ef4444" />
                <Text style={styles.stopButtonText}>STOP</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Interval Selector */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>INTERVAL ALERTS</Text>
          <View style={styles.chipsRow}>
            {intervals.map((mins) => (
              <Pressable
                key={mins}
                onPress={() => setFocusInterval(mins)}
                style={[
                  styles.intervalChip,
                  focusInterval === mins && styles.intervalChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.intervalChipText,
                    focusInterval === mins && styles.intervalChipTextActive,
                  ]}
                >
                  {mins} min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Sprint Presets */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SPRINT PRESETS</Text>
          <View style={styles.presetsGrid}>
            {presets.map((preset, index) => (
              <Pressable
                key={preset.name}
                onPress={() => {
                  setSelectedPresetIndex(index);
                  if (!isRunning) {
                    handleStartPreset(preset.name, preset.minutes);
                  }
                }}
                style={[
                  styles.presetCard,
                  selectedPresetIndex === index && styles.presetCardActive,
                ]}
              >
                <Text style={styles.presetTitle}>{preset.name}</Text>
                <Text style={styles.presetDuration}>{preset.minutes} min</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Forever dark
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  coOpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  coOpBadgeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  idleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  idleBadgeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconButtonActive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  activeTaskLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.5,
  },
  activeTaskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  gaugeContainer: {
    marginVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextContainer: {
    alignItems: 'center',
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerSublabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 2,
    marginTop: 4,
  },
  intervalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  intervalBannerFlashing: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  intervalText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryActionText: {
    color: '#020617',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  resumeButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '800',
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  stopButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalChip: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  intervalChipActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  intervalChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  intervalChipTextActive: {
    color: '#10b981',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  presetCardActive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  presetTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  presetDuration: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
