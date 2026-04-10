import axios from 'axios';
import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/lib/api';
import { getSession, loadSession } from '@/lib/session';

const moods = [
  { name: 'Excited', color: '#FFD166', glow: 'rgba(255, 209, 102, 0.45)', description: 'Energetic, inspired and full of momentum.' },
  { name: 'Happy', color: '#F4D06F', glow: 'rgba(244, 208, 111, 0.45)', description: 'Light, warm and open.' },
  { name: 'Grateful', color: '#E7C76B', glow: 'rgba(231, 199, 107, 0.40)', description: 'Appreciative, fulfilled and grounded.' },
  { name: 'Calm', color: '#A8C3B8', glow: 'rgba(168, 195, 184, 0.35)', description: 'Peaceful, steady and at ease.' },
  { name: 'Neutral', color: '#bab3a6', glow: 'rgba(194, 185, 170, 0.35)', description: 'Balanced, steady and present.' },
  { name: 'Tired', color: '#94A3A8', glow: 'rgba(148, 163, 168, 0.30)', description: 'Low energy, slow and drained.' },
  { name: 'Stressed', color: '#8a7767', glow: 'rgba(185, 133, 91, 0.35)', description: 'Tense, pressured and unsettled.' },
  { name: 'Overwhelmed', color: '#7E6A8A', glow: 'rgba(126, 106, 138, 0.35)', description: 'Heavy, overloaded and emotionally crowded.' },
  { name: 'Anxious', color: '#6F88A3', glow: 'rgba(111, 136, 163, 0.35)', description: 'Restless, uncertain and uneasy.' },
  { name: 'Sad', color: '#4D6A87', glow: 'rgba(77, 106, 135, 0.35)', description: 'Heavy, quiet and low.' },
];

const moodColorMap = Object.fromEntries(moods.map((m) => [m.name, m]));

type VoiceResult = {
  mood?: string;
  moodConfidence?: number;
  energyLevel?: number;
  voiceTranscription?: string;
  voiceAnalysis?: string;
};

export default function DailyCheckInScreen() {
  const [moodIndex, setMoodIndex] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dateRef = useRef(date);
  const activityRef = useRef(activity);
  dateRef.current = date;
  activityRef.current = activity;

  const currentMood = moods[moodIndex];
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadSession();
      if (mounted) {
        setUserId(getSession().userId);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const energyDots = useMemo(() => {
    const total = 10;
    const radius = 125;
    const center = 150;
    return Array.from({ length: total }, (_, index) => {
      const angle = (-90 + index * 36) * (Math.PI / 180);
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { id: index + 1, x, y, active: index < energyLevel };
    });
  }, [energyLevel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const submitVoiceCheckIn = async (uri: string) => {
    if (!userId) {
      setMessage('User ID not found. Please log in again.');
      return;
    }
    setVoiceLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      // Use audio/mp4 — matches Expo .m4a and Spring's allowed types; RN often sends octet-stream otherwise.
      formData.append('audio', { uri, name: 'recording.m4a', type: 'audio/mp4' } as any);
      formData.append('date', dateRef.current);
      formData.append('activity', (activityRef.current ?? '').trim());

      const response = await axios.post(`${API_BASE_URL}/checkins/user/${userId}/voice`, formData);
      const checkIn: VoiceResult = response.data;
      setVoiceResult(checkIn);

      const detectedIdx = moods.findIndex((m) => m.name === checkIn.mood);
      if (detectedIdx >= 0) setMoodIndex(detectedIdx);
      if (checkIn.energyLevel) setEnergyLevel(checkIn.energyLevel);
      setMessage('Voice check-in saved! Your real mood has been detected.');
    } catch (error: any) {
      if (__DEV__) {
        console.error('Voice check-in error:', error?.message, error?.response?.status, error?.response?.data);
      }
      const msg =
        error?.response?.data?.message ||
        (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error'
          ? `Cannot reach API at ${API_BASE_URL}. Same Wi‑Fi? Firewall? Correct IP in .env?`
          : null);
      setMessage(msg || 'Could not analyze voice. Please try again.');
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
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      setIsRecording(true);
      setRecordingTime(0);
      setVoiceResult(null);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (e) {
      if (__DEV__) console.error('startRecording:', e);
      setMessage(
        Platform.OS === 'ios'
          ? 'Could not start recording. Check microphone permission in Settings.'
          : 'Could not start recording. Check microphone permission for the app.'
      );
    }
  };

  const stopRecording = async () => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!uri) {
        setMessage('Recording file was not created. Try again.');
        return;
      }
      await submitVoiceCheckIn(uri);
    } catch (e) {
      if (__DEV__) console.error('stopRecording:', e);
      setMessage('Could not finish recording. Please try again.');
      setIsRecording(false);
    }
  };

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
      if (error?.response?.data?.message) setMessage(error.response.data.message);
      else if (typeof error?.response?.data === 'string') setMessage(error.response.data);
      else setMessage('Could not save check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f3ee]">
      <ScrollView contentContainerClassName="items-center px-4 pt-8 pb-14">
        <View className="w-full max-w-3xl mt-6 mb-10 px-2">
          <Text className="uppercase tracking-[0.25em] text-xs text-[#7c857d] mb-3 text-center">Daily Check-In</Text>
          <Text className="text-4xl font-semibold text-[#2f3b33] leading-tight text-center">
            Choose the orbit that feels closest to you today.
          </Text>
          <Text className="mt-5 text-base text-[#667067] leading-7 text-center">
            Move through your moods, choose your energy level, and leave a short reflection about
            your day.
          </Text>
        </View>

        <View className="w-full max-w-[700px] mb-8">
          <View className="bg-white/70 rounded-[34px] p-6 shadow-lg">
            <View className="items-center mb-6">
              <Text className="uppercase text-xs tracking-[0.2em] text-[#7b857d]">Voice Check-In</Text>
              <Text className="text-2xl font-semibold mt-2 text-[#2f3b33]">Tell us how your day was</Text>
              <Text className="text-[#6b746d] mt-2 text-sm text-center">
                Speak freely - we analyze your voice tone to detect your real mood, so you do not
                have to pretend you are okay.
              </Text>
            </View>

            <View className="items-center gap-3">
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ba39d"
                className="w-full rounded-xl border border-[#dbe3da] px-4 py-3 text-sm bg-[#fcfbf8] text-[#2f3b33]"
              />
              <TextInput
                value={activity}
                onChangeText={setActivity}
                placeholder="What were you doing today?"
                placeholderTextColor="#9ba39d"
                className="w-full rounded-xl border border-[#dbe3da] px-4 py-3 text-sm bg-[#fcfbf8] text-[#2f3b33]"
              />
            </View>

            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              disabled={voiceLoading}
              className={`w-24 h-24 rounded-full items-center justify-center mt-5 self-center ${
                isRecording ? 'bg-red-500' : 'bg-[#2f3b33]'
              } ${voiceLoading ? 'opacity-50' : ''}`}>
              <Text className="text-white text-3xl">{voiceLoading ? '...' : isRecording ? '■' : '🎤'}</Text>
            </Pressable>

            <Text className="text-sm text-[#6b746d] text-center mt-3">
              {voiceLoading
                ? 'Analyzing your voice...'
                : isRecording
                  ? `Recording... ${formatTime(recordingTime)} - tap to stop`
                  : 'Tap the microphone and describe your day'}
            </Text>

            {voiceResult && (
              <View className="mt-7">
                <View className="flex-row items-center justify-center gap-3">
                  <View
                    className="w-14 h-14 rounded-full"
                    style={{
                      backgroundColor: moodColorMap[voiceResult.mood || '']?.color || '#bab3a6',
                      shadowColor: moodColorMap[voiceResult.mood || '']?.glow || '#000',
                      shadowOpacity: 0.5,
                      shadowRadius: 14,
                      elevation: 4,
                    }}
                  />
                  <View>
                    <Text className="text-xl font-semibold text-[#2f3b33]">{voiceResult.mood}</Text>
                    <Text className="text-xs text-[#7b857d]">
                      Detected mood - {Math.round((voiceResult.moodConfidence || 0) * 100)}%
                      confidence - Energy {voiceResult.energyLevel}/10
                    </Text>
                  </View>
                </View>

                {!!voiceResult.voiceTranscription && (
                  <View className="bg-[#f0ebe4] rounded-xl p-4 mt-4">
                    <Text className="text-xs uppercase tracking-wider text-[#7b857d] mb-1">
                      What you said
                    </Text>
                    <Text className="text-sm text-[#2f3b33] italic">"{voiceResult.voiceTranscription}"</Text>
                  </View>
                )}

                {!!voiceResult.voiceAnalysis && (
                  <View className="bg-[#e8ede9] rounded-xl p-4 mt-3">
                    <Text className="text-xs uppercase tracking-wider text-[#7b857d] mb-1">
                      Voice Tone Analysis
                    </Text>
                    <Text className="text-sm text-[#2f3b33]">{voiceResult.voiceAnalysis}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-center items-center mb-8 w-full">
          <View className="h-px flex-1 bg-[#c5c0b8]" />
          <Text className="uppercase text-[10px] tracking-[0.25em] text-[#9a958d] mx-3">
            or check in manually
          </Text>
          <View className="h-px flex-1 bg-[#c5c0b8]" />
        </View>

        <View className="w-full gap-5 max-w-[700px]">
          <View className="bg-white/60 rounded-[34px] p-6 shadow-lg">
            <View className="items-center mb-6">
              <Text className="uppercase text-xs tracking-[0.2em] text-[#7b857d]">Mood Orbit</Text>
              <Text className="text-3xl font-semibold mt-2 text-[#2f3b33]">{currentMood.name}</Text>
              <Text className="text-[#6b746d] mt-2 text-center">{currentMood.description}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setMoodIndex((prev) => (prev === 0 ? moods.length - 1 : prev - 1))}
                className="w-12 h-12 rounded-full border border-[#d7ddd7] bg-white/80 items-center justify-center">
                <Text className="text-2xl text-[#2f3b33]">‹</Text>
              </Pressable>

              <View className="relative w-[300px] h-[300px]">
                {energyDots.map((dot) => (
                  <Pressable
                    key={dot.id}
                    onPress={() => setEnergyLevel(dot.id)}
                    style={{
                      position: 'absolute',
                      left: dot.x - (dot.active ? 10 : 8),
                      top: dot.y - (dot.active ? 10 : 8),
                      width: dot.active ? 20 : 16,
                      height: dot.active ? 20 : 16,
                      borderRadius: 999,
                      backgroundColor: dot.active ? currentMood.color : '#d7ddd7',
                    }}
                  />
                ))}

                <View className="absolute inset-0 items-center justify-center pointer-events-none">
                  <View
                    className="w-[180px] h-[180px] rounded-full items-center justify-center"
                    style={{
                      backgroundColor: currentMood.color,
                      shadowColor: currentMood.glow,
                      shadowOpacity: 0.55,
                      shadowRadius: 24,
                      elevation: 8,
                    }}>
                    <Text className="uppercase text-sm tracking-[0.15em] text-[#2f3b33]">Mood</Text>
                    <Text className="text-3xl font-semibold mt-1 text-[#2f3b33]">{currentMood.name}</Text>
                    <Text className="text-sm mt-1 text-[#2f3b33]">Energy {energyLevel}/10</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setMoodIndex((prev) => (prev === moods.length - 1 ? 0 : prev + 1))}
                className="w-12 h-12 rounded-full border border-[#d7ddd7] bg-white/80 items-center justify-center">
                <Text className="text-2xl text-[#2f3b33]">›</Text>
              </Pressable>
            </View>
          </View>

          <View className="bg-white/70 rounded-[34px] p-6 shadow-lg">
            <View className="items-center mb-7">
              <Text className="uppercase tracking-[0.2em] text-xs text-[#7b857d]">Reflection Details</Text>
              <Text className="text-3xl font-semibold mt-2 text-[#2f3b33]">Complete your entry</Text>
            </View>

            <View className="gap-4">
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ba39d"
                className="w-full rounded-xl border border-[#dbe3da] px-4 py-3 bg-[#fcfbf8] text-[#2f3b33]"
              />
              <TextInput
                value={activity}
                onChangeText={setActivity}
                placeholder="What were you doing today?"
                placeholderTextColor="#9ba39d"
                className="w-full rounded-xl border border-[#dbe3da] px-4 py-3 bg-[#fcfbf8] text-[#2f3b33]"
              />
              <TextInput
                multiline
                numberOfLines={6}
                value={notes}
                onChangeText={setNotes}
                placeholder="Write a few words about your day..."
                placeholderTextColor="#9ba39d"
                className="w-full rounded-xl border border-[#dbe3da] px-4 py-3 min-h-[120px] bg-[#fcfbf8] text-[#2f3b33]"
                textAlignVertical="top"
              />

              {!!message && <Text className="text-sm text-[#556157]">{message}</Text>}

              <Pressable
                onPress={handleSave}
                disabled={loading}
                className={`w-full bg-[#2f3b33] py-3 rounded-xl ${loading ? 'opacity-70' : ''}`}>
                <Text className="text-white text-center font-bold tracking-wider">
                  {loading ? 'Saving...' : 'SAVE CHECK-IN'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
