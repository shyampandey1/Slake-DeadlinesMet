import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Coins, Plus, CheckCircle2, Circle, Droplets, Dumbbell, Brain, Sparkles, X, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { GlassCard } from '../components/common/GlassCard';
import { COLORS, RADIUS, SPACING } from '../config/theme';
import { LifestyleCategory } from '../types';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { profileData } = useAuth();
  const { tasks, addTask, toggleTaskCompletion, quickLogHabit } = useTasks();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('25');
  const [selectedCategory, setSelectedCategory] = useState<LifestyleCategory>('Productivity');

  const streak = profileData?.streak?.currentStreak || 1;
  const coins = profileData?.slakeCoins ?? profileData?.slakeCredits ?? 1000;

  const categories: { label: LifestyleCategory; icon: any; color: string }[] = [
    { label: 'Productivity', icon: Brain, color: '#6366f1' },
    { label: 'Hydration', icon: Droplets, color: '#06b6d4' },
    { label: 'Fitness', icon: Dumbbell, color: '#f43f5e' },
    { label: 'Meditation', icon: Sparkles, color: '#10b981' },
  ];

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    const mins = parseInt(newTaskDuration, 10) || 25;
    await addTask(newTaskName.trim(), mins, selectedCategory);
    setNewTaskName('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 56) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Flame size={18} color="#f59e0b" />
              <Text style={styles.metricTitle}>STREAK</Text>
            </View>
            <Text style={styles.metricValue}>{streak} Days</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Coins size={18} color="#10b981" />
              <Text style={styles.metricTitle}>DM COINS</Text>
            </View>
            <Text style={styles.metricValue}>{coins.toLocaleString()}</Text>
          </GlassCard>
        </View>

        {/* Quick Lifestyle Habit Loggers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LIFESTYLE PILLARS</Text>
        </View>
        <View style={styles.pillarsGrid}>
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Pressable
                key={cat.label}
                onPress={() => quickLogHabit(cat.label, `Quick ${cat.label} Session`)}
                style={styles.pillarCard}
              >
                <View style={[styles.pillarIconWrapper, { backgroundColor: `${cat.color}20` }]}>
                  <IconComponent size={20} color={cat.color} />
                </View>
                <Text style={styles.pillarLabel}>{cat.label}</Text>
                <Text style={styles.pillarAction}>+ Log</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tasks & Routine Section */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>TODAY'S ROUTINE</Text>
          <Pressable onPress={() => setModalVisible(true)} style={styles.addTaskButton}>
            <Plus size={16} color="#10b981" />
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </Pressable>
        </View>

        <View style={styles.taskList}>
          {tasks.map((task) => (
            <Pressable
              key={task.id}
              onPress={() => toggleTaskCompletion(task.id)}
              style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
            >
              <View style={styles.taskLeft}>
                {task.completed ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : (
                  <Circle size={20} color="#64748b" />
                )}
                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskName,
                      task.completed && styles.taskNameCompleted,
                    ]}
                  >
                    {task.name}
                  </Text>
                  <Text style={styles.taskCategory}>
                    {task.category || 'Productivity'} • {task.duration} min
                  </Text>
                </View>
              </View>

              <View style={styles.taskCoinsBadge}>
                <Coins size={12} color="#10b981" />
                <Text style={styles.taskCoinsText}>+250</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Create Focus Task</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>TASK NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Read Research Paper"
              placeholderTextColor="#64748b"
              value={newTaskName}
              onChangeText={setNewTaskName}
            />

            <Text style={styles.inputLabel}>DURATION (MINUTES)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="25"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={newTaskDuration}
              onChangeText={setNewTaskDuration}
            />

            <Pressable style={styles.submitTaskButton} onPress={handleCreateTask}>
              <Text style={styles.submitTaskButtonText}>Add to Routine</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillarCard: {
    width: '48%',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  pillarIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pillarLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  pillarAction: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  addTaskButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  taskItemCompleted: {
    opacity: 0.6,
    backgroundColor: '#060910',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskCategory: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  taskCoinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  taskCoinsText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
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
  },
  submitTaskButton: {
    backgroundColor: '#10b981',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  submitTaskButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '800',
  },
});
