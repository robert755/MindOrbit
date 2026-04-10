import axios from 'axios';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/lib/api';
import { getSession } from '@/lib/session';

const moods = [
  { name: 'Excited', color: '#FFD166', description: 'Energetic, inspired and full of momentum.' },
  { name: 'Happy', color: '#F4D06F', description: 'Light, warm and open.' },
  { name: 'Grateful', color: '#E7C76B', description: 'Appreciative, fulfilled and grounded.' },
  { name: 'Calm', color: '#A8C3B8', description: 'Peaceful, steady and at ease.' },
  { name: 'Neutral', color: '#bab3a6', description: 'Balanced, steady and present.' },
  { name: 'Tired', color: '#94A3A8', description: 'Low energy, slow and drained.' },
  { name: 'Stressed', color: '#8a7767', description: 'Tense, pressured and unsettled.' },
  { name: 'Overwhelmed', color: '#7E6A8A', description: 'Heavy, overloaded and emotionally crowded.' },
  { name: 'Anxious', color: '#6F88A3', description: 'Restless, uncertain and uneasy.' },
  { name: 'Sad', color: '#4D6A87', description: 'Heavy, quiet and low.' },
];

export default function DailyCheckInScreen() {
  const [moodIndex, setMoodIndex] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMood = moods[moodIndex];
  const chips = useMemo(() => Array.from({ length: 10 }, (_, idx) => idx + 1), []);
  const { userId } = getSession();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    setMessage('');
    if (!userId) {
      setMessage('User ID not found. Please log in again.');
      return;
    }
    if (!activity.trim()) {
      setMessage('Please complete the activity field.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/checkins/user/${userId}`, {
        mood: currentMood.name,
        energyLevel,
        date,
        activity,
        notes,
      });
      setMessage('Check-in saved successfully.');
      setActivity('');
      setNotes('');
      setEnergyLevel(5);
      setMoodIndex(0);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Could not save check-in.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const submitVoiceCheckIn = async (uri: string) => {
    if (!userId) {
      setMessage('User ID not found. Please log in again.');
      return;
    }
    try {
      setVoiceLoading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('date', date);
      formData.append('activity', activity.trim());

      const response = await axios.post(`${API_BASE_URL}/checkins/user/${userId}/voice`, formData);
      const checkIn = response.data;
      setVoiceResult(checkIn);

      const detectedIdx = moods.findIndex((m) => m.name === checkIn?.mood);
      if (detectedIdx >= 0) {
        setMoodIndex(detectedIdx);
      }
      if (checkIn?.energyLevel) {
        setEnergyLevel(checkIn.energyLevel);
      }
      setMessage('Voice check-in saved! Your real mood has been detected.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Could not analyze voice. Please try again.');
    } finally {
      setVoiceLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage('Microphone access denied. Please allow microphone permissions.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      setVoiceResult(null);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      setMessage('Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (uri) {
        await submitVoiceCheckIn(uri);
      }
    } catch {
      setMessage('Could not stop recording.');
      setIsRecording(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Daily Check-In</Text>
        <Text style={styles.title}>Choose the orbit that feels closest to you today.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Voice Check-In</Text>
          <Text style={styles.voiceHint}>Speak freely, we detect your real mood from tone.</Text>
          <Pressable
            style={[styles.voiceButton, isRecording ? styles.voiceButtonRecording : null]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={voiceLoading}>
            <Text style={styles.voiceButtonText}>
              {voiceLoading
                ? 'Analyzing...'
                : isRecording
                  ? `Stop (${formatTime(recordingTime)})`
                  : 'Start Voice'}
            </Text>
          </Pressable>
          {!!voiceResult && (
            <Text style={styles.voiceResultText}>
              Detected mood: {voiceResult.mood} ({Math.round((voiceResult.moodConfidence || 0) * 100)}
              %) - Energy {voiceResult.energyLevel}/10
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mood Orbit</Text>
          <Text style={styles.moodName}>{currentMood.name}</Text>
          <Text style={styles.moodDescription}>{currentMood.description}</Text>

          <View style={styles.rowCentered}>
            <Pressable
              style={styles.arrowButton}
              onPress={() => setMoodIndex((prev) => (prev === 0 ? moods.length - 1 : prev - 1))}>
              <Text style={styles.arrowText}>{'<'}</Text>
            </Pressable>

            <View style={styles.orbitCenter}>
              <Text style={styles.orbitMood}>{currentMood.name}</Text>
              <Text style={styles.orbitEnergy}>Energy {energyLevel}/10</Text>
            </View>

            <Pressable
              style={styles.arrowButton}
              onPress={() => setMoodIndex((prev) => (prev === moods.length - 1 ? 0 : prev + 1))}>
              <Text style={styles.arrowText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.energyWrap}>
            {chips.map((value) => (
              <Pressable
                key={value}
                style={[
                  styles.energyChip,
                  value <= energyLevel
                    ? { backgroundColor: currentMood.color, borderColor: currentMood.color }
                    : styles.energyChipInactive,
                ]}
                onPress={() => setEnergyLevel(value)}>
                <Text style={styles.energyChipText}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reflection Details</Text>

          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#9ba39d"
            style={styles.input}
          />
          <TextInput
            value={activity}
            onChangeText={setActivity}
            placeholder="What were you doing today?"
            placeholderTextColor="#9ba39d"
            style={styles.input}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Write a few words about your day..."
            placeholderTextColor="#9ba39d"
            multiline
            numberOfLines={5}
            style={[styles.input, styles.notes]}
          />
          {!!message && <Text style={styles.message}>{message}</Text>}
          <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'SAVE CHECK-IN'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f3ee' },
  container: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, gap: 16 },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    fontSize: 12,
    color: '#7c857d',
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#2f3b33',
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '600',
    marginBottom: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 34,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#464646',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#7b857d',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
  },
  moodName: { fontSize: 34, fontWeight: '600', textAlign: 'center', color: '#2f3b33' },
  moodDescription: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6b746d',
    marginTop: 6,
    marginBottom: 18,
  },
  rowCentered: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7ddd7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: '#2f3b33', fontSize: 24, marginTop: -2 },
  orbitCenter: {
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#f5f0e8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#ebe6de',
  },
  orbitMood: { fontSize: 24, fontWeight: '600', color: '#2f3b33' },
  orbitEnergy: { color: '#4e5a53', marginTop: 4, fontSize: 14 },
  energyWrap: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  energyChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  energyChipInactive: { backgroundColor: '#d7ddd7', borderColor: '#d7ddd7' },
  energyChipText: { color: '#2f3b33', fontSize: 12, fontWeight: '600' },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe3da',
    backgroundColor: '#fcfbf8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#2f3b33',
  },
  notes: { minHeight: 120, textAlignVertical: 'top' },
  saveButton: {
    marginTop: 2,
    backgroundColor: '#2f3b33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  saveButtonText: {
    color: '#fff',
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 13,
  },
  message: {
    marginBottom: 10,
    color: '#556157',
    fontSize: 13,
  },
  voiceHint: {
    textAlign: 'center',
    color: '#6b746d',
    marginBottom: 12,
    fontSize: 14,
  },
  voiceButton: {
    alignSelf: 'center',
    backgroundColor: '#2f3b33',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginBottom: 10,
  },
  voiceButtonRecording: {
    backgroundColor: '#dc2626',
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  voiceResultText: {
    color: '#556157',
    textAlign: 'center',
    fontSize: 13,
  },
});
