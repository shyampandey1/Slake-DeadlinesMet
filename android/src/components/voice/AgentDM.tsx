import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { Mic, MicOff, Sparkles, X, Play, Pause, Droplets, CheckCircle2 } from 'lucide-react-native';
import { useVoice } from '../../context/VoiceContext';
import { AudioWaveform } from './AudioWaveform';
import { COLORS, RADIUS, SPACING } from '../../config/theme';
import { HapticService } from '../../services/hapticService';

export const AgentDM: React.FC = () => {
  const {
    agentState,
    feedbackText,
    waveformLevels,
    startVoiceListening,
    stopVoiceListening,
    submitVoiceCommand,
    cancelVoiceInteraction,
  } = useVoice();

  const [modalVisible, setModalVisible] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const getStatusColor = () => {
    switch (agentState) {
      case 'LISTENING':
        return '#10b981'; // Emerald
      case 'THINKING':
        return '#f59e0b'; // Amber
      case 'EXECUTING':
        return '#06b6d4'; // Cyan
      case 'SPEAKING':
        return '#a855f7'; // Purple
      default:
        return '#64748b'; // Slate
    }
  };

  const quickPrompts = [
    { label: 'Start 25m Focus', text: 'Start timer for 25 minutes' },
    { label: 'Pause Timer', text: 'Pause timer' },
    { label: 'Interval 5m', text: 'Set interval 5 minutes' },
    { label: 'Log Water', text: 'Log 1 glass of water' },
    { label: 'Task Done', text: 'Task completed' },
  ];

  const handleQuickPrompt = (prompt: string) => {
    setModalVisible(false);
    submitVoiceCommand(prompt);
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    setModalVisible(false);
    submitVoiceCommand(customInput);
    setCustomInput('');
  };

  return (
    <>
      {/* Floating HUD Pill */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            HapticService.light();
            setModalVisible(true);
          }}
          style={[
            styles.pill,
            agentState !== 'IDLE' && { borderColor: getStatusColor() },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />

          <Text style={styles.pillTitle}>Agent DM</Text>

          <AudioWaveform levels={waveformLevels} color={getStatusColor()} />

          <Pressable
            onPress={() => {
              if (agentState === 'LISTENING') {
                stopVoiceListening();
              } else if (agentState === 'IDLE') {
                startVoiceListening();
              } else {
                cancelVoiceInteraction();
              }
            }}
            hitSlop={8}
            style={styles.micButton}
          >
            {agentState === 'LISTENING' ? (
              <MicOff size={16} color="#ef4444" />
            ) : (
              <Mic size={16} color="#10b981" />
            )}
          </Pressable>
        </Pressable>

        {/* Live Feedback Sub-Banner */}
        {feedbackText ? (
          <View style={styles.feedbackBanner}>
            <Sparkles size={12} color="#10b981" />
            <Text style={styles.feedbackText} numberOfLines={1}>
              {feedbackText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Interactive Command Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitle}>
                <Sparkles size={18} color="#10b981" />
                <Text style={styles.modalTitle}>Neural Voice Control</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Tap a quick canonical command or type an instruction:
            </Text>

            {/* Quick action chips */}
            <View style={styles.chipsRow}>
              {quickPrompts.map((p, idx) => (
                <Pressable
                  key={idx}
                  style={styles.chip}
                  onPress={() => handleQuickPrompt(p.text)}
                >
                  <Text style={styles.chipText}>{p.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Custom text command input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Set focus interval to 10 minutes"
                placeholderTextColor="#64748b"
                value={customInput}
                onChangeText={setCustomInput}
                onSubmitEditing={handleCustomSubmit}
                returnKeyType="send"
              />
              <Pressable style={styles.sendButton} onPress={handleCustomSubmit}>
                <Text style={styles.sendButtonText}>Send</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  micButton: {
    padding: 4,
    marginLeft: 2,
  },
  feedbackBanner: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  feedbackText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
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
  modalHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  chip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendButton: {
    backgroundColor: '#10b981',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#020617',
    fontWeight: '700',
    fontSize: 13,
  },
});
