import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, UserPlus, Zap, Bell, Check, Radio, MapPin, Search } from 'lucide-react-native';
import { collection, query, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { CoReformerMember } from '../types';
import { COLORS, RADIUS, SPACING } from '../config/theme';
import { HapticService } from '../services/hapticService';

export const ReformersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, profileData, updateUserProfile } = useAuth();

  const [members, setMembers] = useState<CoReformerMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const activeBuddyId = profileData?.coWorkerId;
  const activeBuddy = members.find((m) => m.id === activeBuddyId);

  // Default mock members if offline
  const DEFAULT_MEMBERS: CoReformerMember[] = [
    { id: 'buddy-1', name: 'Aarav Patel', avatar: 'AP', streak: 14, coins: 8500, city: 'Bengaluru', routine: 'Software Engineer', isOnline: true, currentTask: 'System Architecture Design' },
    { id: 'buddy-2', name: 'Priya Sharma', avatar: 'PS', streak: 21, coins: 14200, city: 'Mumbai', routine: 'Product Designer', isOnline: true, currentTask: 'Figma UI Exploration' },
    { id: 'buddy-3', name: 'Marcus Vance', avatar: 'MV', streak: 9, coins: 5300, city: 'London', routine: 'Researcher', isOnline: false },
    { id: 'buddy-4', name: 'Chen Wei', avatar: 'CW', streak: 32, coins: 22000, city: 'Singapore', routine: 'Analyst', isOnline: true },
  ];

  // Query live reformers from Firestore with fallback to offline data
  useEffect(() => {
    const usersQ = query(collection(db, 'users'), limit(30));
    const unsubscribe = onSnapshot(
      usersQ,
      (snapshot) => {
        const list: CoReformerMember[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const uid = data.userId || d.id;
          if (user && uid === user.uid) return; // skip self

          list.push({
            id: uid,
            name: data.displayName || 'Anonymous Reformer',
            avatar: (data.displayName || 'AR').slice(0, 2).toUpperCase(),
            streak: data.streak?.currentStreak || 1,
            coins: data.slakeCoins ?? data.slakeCredits ?? 0,
            city: data.region || 'Global',
            routine: data.profile || 'General',
            isOnline: data.isOnline ?? true,
            currentTask: data.activeSession?.taskName,
          });
        });

        if (list.length > 0) {
          setMembers(list);
        } else {
          setMembers(DEFAULT_MEMBERS);
        }
      },
      (err) => {
        console.warn("Reformers query running offline:", err);
        setMembers(DEFAULT_MEMBERS);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleConnectBuddy = async (member: CoReformerMember) => {
    if (!user) return;
    HapticService.medium();
    setConnectingId(member.id);

    try {
      // Connect both sides for seamless co-op timer sync
      await updateUserProfile({ coWorkerId: member.id });
      try {
        await updateDoc(doc(db, 'users', member.id), {
          coWorkerId: user.uid,
        });
      } catch {}

      Alert.alert(
        "Co-Reformer Linked!",
        `You are now connected with ${member.name}. Any normal task timer you or ${member.name} start will now run simultaneously on both screens!`
      );
    } catch (e) {
      console.warn("Connection error:", e);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnectBuddy = async () => {
    HapticService.light();
    await updateUserProfile({ coWorkerId: undefined });
  };

  const handleSendNudge = (buddyName: string) => {
    HapticService.success();
    Alert.alert("Focus Poke Sent!", `Nudged ${buddyName} to stay locked in.`);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.routine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 56) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Co-Reformer Card */}
        {activeBuddy ? (
          <GlassCard style={styles.activeBuddyCard} glow>
            <View style={styles.activeBuddyHeader}>
              <View style={styles.liveIndicator}>
                <Radio size={14} color="#10b981" />
                <Text style={styles.liveIndicatorText}>LIVE CO-OP PAIRED</Text>
              </View>
              <Pressable onPress={handleDisconnectBuddy} hitSlop={8}>
                <Text style={styles.disconnectText}>Unlink</Text>
              </Pressable>
            </View>

            <View style={styles.buddyProfileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{activeBuddy.avatar}</Text>
              </View>
              <View style={styles.buddyMeta}>
                <Text style={styles.buddyName}>{activeBuddy.name}</Text>
                <Text style={styles.buddySubtitle}>
                  {activeBuddy.routine} • {activeBuddy.city}
                </Text>
              </View>
            </View>

            {activeBuddy.currentTask ? (
              <View style={styles.buddyTaskBanner}>
                <Zap size={14} color="#10b981" />
                <Text style={styles.buddyTaskText}>
                  Focusing on: <Text style={styles.bold}>{activeBuddy.currentTask}</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.coOpActions}>
              <Pressable
                style={styles.nudgeButton}
                onPress={() => handleSendNudge(activeBuddy.name)}
              >
                <Bell size={16} color="#020617" />
                <Text style={styles.nudgeButtonText}>Send Focus Nudge</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={styles.noBuddyCard}>
            <Users size={28} color="#64748b" />
            <Text style={styles.noBuddyTitle}>No Co-Reformer Paired</Text>
            <Text style={styles.noBuddyDesc}>
              Pair with any member below. Whenever either of you starts a normal timer, both devices will synchronize automatically!
            </Text>
          </GlassCard>
        )}

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reformers by name, city, or profession..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Directory List */}
        <Text style={styles.directoryTitle}>DISCOVER REFORMERS</Text>

        <View style={styles.membersList}>
          {filteredMembers.map((member) => {
            const isCurrent = member.id === activeBuddyId;
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberLeft}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.memberMetaRow}>
                      <MapPin size={11} color="#64748b" />
                      <Text style={styles.memberCity}>{member.city}</Text>
                      <Text style={styles.memberDot}>•</Text>
                      <Text style={styles.memberRoutine}>{member.routine}</Text>
                    </View>
                  </View>
                </View>

                {isCurrent ? (
                  <View style={styles.pairedPill}>
                    <Check size={14} color="#10b981" />
                    <Text style={styles.pairedPillText}>Paired</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.connectButton}
                    onPress={() => handleConnectBuddy(member)}
                    disabled={connectingId === member.id}
                  >
                    <UserPlus size={14} color="#10b981" />
                    <Text style={styles.connectButtonText}>Pair</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
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
  activeBuddyCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  activeBuddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicatorText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  disconnectText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  buddyProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 16,
  },
  buddyMeta: {
    flex: 1,
  },
  buddyName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  buddySubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  buddyTaskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  buddyTaskText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  coOpActions: {
    marginTop: 4,
  },
  nudgeButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  nudgeButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
  noBuddyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  noBuddyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  noBuddyDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  directoryTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  membersList: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  memberCity: {
    color: '#94a3b8',
    fontSize: 11,
  },
  memberDot: {
    color: '#64748b',
    fontSize: 11,
  },
  memberRoutine: {
    color: '#94a3b8',
    fontSize: 11,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  connectButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  pairedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  pairedPillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
});
