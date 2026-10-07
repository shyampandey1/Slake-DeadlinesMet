import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Zap, Gift, CheckCircle2, X, ChevronRight, Award } from 'lucide-react-native';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { RewardItem, CoReformerMember } from '../types';
import { COLORS, RADIUS, SPACING } from '../config/theme';
import { HapticService } from '../services/hapticService';

export const RewardsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, profileData, awardCoins } = useAuth();

  const [activeTab, setActiveTab] = useState<'redeem' | 'leaderboard'>('redeem');
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<CoReformerMember[]>([]);

  const coins = profileData?.slakeCoins ?? profileData?.slakeCredits ?? 1000;

  const rewardItems: RewardItem[] = [
    { id: 1, name: 'Direct UPI Payout', desc: '₹10 transferred directly to your UPI ID', credits: 10000, icon: '₹' },
    { id: 2, name: 'Riderz Hub Cafe Voucher', desc: '₹59 value. Special coffee & snack credit', credits: 60000, icon: '☕' },
    { id: 3, name: 'Amazon Shopping Voucher', desc: 'Minimum ₹99 gift card voucher', credits: 100000, icon: '🛒' },
    { id: 4, name: 'NimkiThekua Box', desc: 'Delivered reward for 1-week hydration streak', credits: 1000000, icon: '🍪' },
    { id: 5, name: 'Solana Crypto (₹500)', desc: 'Direct SOL wallet transfer', credits: 5000000, icon: '💎' },
    { id: 6, name: 'Bitcoin (₹500)', desc: 'Direct BTC satoshis transfer', credits: 5000000, icon: '₿' },
  ];

  // Query live leaderboard with fallback
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('slakeCoins', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CoReformerMember[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.displayName || 'Reformer',
            avatar: (data.displayName || 'RF').slice(0, 2).toUpperCase(),
            streak: data.streak?.currentStreak || 1,
            coins: data.slakeCoins ?? data.slakeCredits ?? 0,
            city: data.region || 'Global',
            routine: data.profile || 'General',
            isMe: user ? d.id === user.uid : false,
          });
        });
        if (list.length > 0) {
          setLeaderboard(list);
        }
      },
      (err) => {
        console.warn("Leaderboard snapshot running offline:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleRedeemClick = (item: RewardItem) => {
    setSelectedReward(item);
    setUpiId('');
    setModalVisible(true);
    HapticService.light();
  };

  const submitRedemption = async () => {
    if (!selectedReward || !upiId.trim() || !user) return;
    setIsSubmitting(true);
    HapticService.medium();

    try {
      // Optimistically deduct coins
      await awardCoins(-selectedReward.credits);

      // Record redemption request in Firestore
      try {
        await addDoc(collection(db, 'redemption_requests'), {
          userId: user.uid,
          userName: profileData?.displayName || 'Anonymous',
          amount: selectedReward.credits / 1000,
          creditsRedeemed: selectedReward.credits,
          upiId: upiId.trim(),
          rewardName: selectedReward.name,
          status: 'pending',
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Offline redemption ticket queued:", err);
      }

      HapticService.success();
      setModalVisible(false);
      Alert.alert(
        "Redemption Ticket Dispatched! 🎉",
        `Your request for ${selectedReward.name} has been placed. Balance updated.`
      );
    } catch (e) {
      console.warn("Redemption error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 56) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Slake Coins Balance Card */}
        <GlassCard style={styles.balanceCard} glow>
          <View style={styles.balanceHeader}>
            <Zap size={20} color="#10b981" />
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          </View>
          <View style={styles.balanceAmountRow}>
            <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
            <Text style={styles.balanceUnit}>DM Coins</Text>
          </View>
        </GlassCard>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabButton, activeTab === 'redeem' && styles.tabButtonActive]}
            onPress={() => setActiveTab('redeem')}
          >
            <Gift size={16} color={activeTab === 'redeem' ? '#10b981' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'redeem' && styles.tabTextActive]}>
              Redeem Rewards
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'leaderboard' && styles.tabButtonActive]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Trophy size={16} color={activeTab === 'leaderboard' ? '#10b981' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Leaderboard
            </Text>
          </Pressable>
        </View>

        {activeTab === 'redeem' ? (
          <View style={styles.rewardsList}>
            {rewardItems.map((item) => {
              const isUnlocked = coins >= item.credits;
              const progressPct = Math.min(100, Math.floor((coins / item.credits) * 100));

              return (
                <View key={item.id} style={[styles.rewardCard, isUnlocked && styles.rewardCardUnlocked]}>
                  <View style={styles.rewardHeader}>
                    <View style={styles.rewardIconWrapper}>
                      <Text style={styles.rewardIconText}>{item.icon}</Text>
                    </View>
                    <View style={styles.rewardMeta}>
                      <Text style={styles.rewardName}>{item.name}</Text>
                      <Text style={styles.rewardDesc}>{item.desc}</Text>
                    </View>
                  </View>

                  <View style={styles.rewardProgressTrack}>
                    <View style={[styles.rewardProgressBar, { width: `${progressPct}%` }]} />
                  </View>

                  <View style={styles.rewardFooter}>
                    <Text style={styles.costText}>{item.credits.toLocaleString()} Coins</Text>
                    <Pressable
                      style={[styles.redeemButton, !isUnlocked && styles.redeemButtonDisabled]}
                      onPress={() => handleRedeemClick(item)}
                      disabled={!isUnlocked}
                    >
                      <Text style={[styles.redeemButtonText, !isUnlocked && styles.redeemButtonTextDisabled]}>
                        {isUnlocked ? 'Redeem' : `${progressPct}%`}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.leaderboardList}>
            {leaderboard.map((member, idx) => (
              <View
                key={member.id}
                style={[styles.leaderboardRow, member.isMe && styles.leaderboardRowMe]}
              >
                <Text style={styles.rankText}>#{idx + 1}</Text>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                </View>
                <View style={styles.leaderboardMeta}>
                  <Text style={styles.leaderboardName}>
                    {member.name} {member.isMe ? '(You)' : ''}
                  </Text>
                  <Text style={styles.leaderboardSub}>
                    {member.routine} • {member.streak}d streak
                  </Text>
                </View>
                <Text style={styles.leaderboardCoins}>{member.coins.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Redemption Modal */}
      {selectedReward && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Redeem {selectedReward.name}</Text>
                <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                  <X size={18} color="#94a3b8" />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>
                Cost: <Text style={styles.bold}>{selectedReward.credits.toLocaleString()} DM Coins</Text>
              </Text>

              <Text style={styles.inputLabel}>ENTER UPI ID (e.g. yourname@ybl / @okaxis)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="yourname@ybl"
                placeholderTextColor="#64748b"
                value={upiId}
                onChangeText={setUpiId}
              />

              <Pressable
                style={[styles.confirmButton, (!upiId.trim() || isSubmitting) && styles.confirmButtonDisabled]}
                onPress={submitRedemption}
                disabled={!upiId.trim() || isSubmitting}
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? 'Processing...' : 'Confirm Redemption'}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  balanceCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  balanceUnit: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#10b981',
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  rewardCardUnlocked: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  rewardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rewardIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIconText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10b981',
  },
  rewardMeta: {
    flex: 1,
  },
  rewardName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  rewardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  rewardProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  rewardProgressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  redeemButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  redeemButtonDisabled: {
    backgroundColor: '#1e293b',
  },
  redeemButtonText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: '800',
  },
  redeemButtonTextDisabled: {
    color: '#64748b',
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  leaderboardRowMe: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  rankText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '900',
    width: 28,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  leaderboardMeta: {
    flex: 1,
  },
  leaderboardName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  leaderboardSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  leaderboardCoins: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: '#090d16',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  bold: {
    color: '#10b981',
    fontWeight: '700',
  },
  inputLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: SPACING.lg,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
});
