import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Volume2, Vibrate, Cloud, Database, User, ShieldCheck, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { GlassCard } from '../components/common/GlassCard';
import { COLORS, RADIUS, SPACING } from '../config/theme';
import { HapticService } from '../services/hapticService';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, profileData } = useAuth();
  const { soundEnabled, toggleSound } = useTimer();

  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleToggleVibration = (val: boolean) => {
    setVibrationEnabled(val);
    if (val) HapticService.medium();
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Reset Local Offline Cache?",
      "This will clear locally cached documents and re-sync from Firestore on your next connect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            HapticService.heavy();
            Alert.alert("Cache Cleared", "Local storage reset. Live sync re-initialized.");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 56) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User size={24} color="#10b981" />
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>
                {profileData?.displayName || user?.displayName || 'Anonymous Reformer'}
              </Text>
              <Text style={styles.profileRole}>
                {profileData?.profile || 'General'} • {profileData?.currency || 'INR'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Audio & Haptics Section */}
        <Text style={styles.sectionTitle}>HARDWARE CONTROLS</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Volume2 size={18} color="#10b981" />
              <View>
                <Text style={styles.settingLabel}>Focus Chimes & Soundscapes</Text>
                <Text style={styles.settingSub}>Procedural interval alerts & audio</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Vibrate size={18} color="#10b981" />
              <View>
                <Text style={styles.settingLabel}>Tactile Haptic Feedback</Text>
                <Text style={styles.settingSub}>Micro-pulses on interval markers</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleToggleVibration}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Offline & Cloud Sync Engine */}
        <Text style={styles.sectionTitle}>SYNC & PERSISTENCE</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Cloud size={18} color="#06b6d4" />
              <View>
                <Text style={styles.settingLabel}>Cloud Engine</Text>
                <Text style={styles.settingSub}>Firebase Firestore Real-Time</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>CONNECTED</Text>
            </View>
          </View>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingLeft}>
              <Database size={18} color="#10b981" />
              <View>
                <Text style={styles.settingLabel}>Offline-First Storage</Text>
                <Text style={styles.settingSub}>Local Cache & Optimistic Mutations</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>ACTIVE</Text>
            </View>
          </View>

          <Pressable
            style={[styles.settingRow, styles.settingRowBorder]}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <ShieldCheck size={18} color="#94a3b8" />
              <View>
                <Text style={styles.settingLabel}>Reset Local Cache</Text>
                <Text style={styles.settingSub}>Flush offline queue & re-index</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </Pressable>
        </View>

        {/* About App */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutVersion}>DeadlinesMet: Reformers Native Android</Text>
          <Text style={styles.aboutSub}>v1.0.0 (Pure Native Android • Zero WebView)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  profileRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusPillText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  aboutVersion: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  aboutSub: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
  },
});
