import axios from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '@/lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/users`, formData);
      router.replace('/login' as any);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f3ee]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="min-h-full justify-center px-5 py-6"
          keyboardShouldPersistTaps="handled">
          <Animated.View
            entering={FadeInDown.duration(700)}
            className="w-full rounded-[20px] border border-white/50 bg-white/75 p-5 shadow">
            <Text className="text-center text-3xl font-semibold text-[#2f3b33]">Create account</Text>
            <Text className="mb-2 text-center text-sm text-[#7d867f]">
              Start tracking your mental wellbeing.
            </Text>

            <TextInput
              className="mb-2 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-3 py-3"
              placeholder="First name"
              value={formData.firstName}
              onChangeText={(v) => setFormData((p) => ({ ...p, firstName: v }))}
            />
            <TextInput
              className="mb-2 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-3 py-3"
              placeholder="Last name"
              value={formData.lastName}
              onChangeText={(v) => setFormData((p) => ({ ...p, lastName: v }))}
            />
            <TextInput
              className="mb-2 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-3 py-3"
              placeholder="Username"
              value={formData.username}
              onChangeText={(v) => setFormData((p) => ({ ...p, username: v }))}
              autoCapitalize="none"
            />
            <TextInput
              className="mb-2 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-3 py-3"
              placeholder="Email"
              value={formData.email}
              onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className="rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-3 py-3"
              placeholder="Password"
              value={formData.password}
              onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
              secureTextEntry
            />

            {!!error && <Text className="mt-2 text-center text-red-500">{error}</Text>}

            <Pressable
              className="mt-3 items-center rounded-xl bg-[#2f3b33] py-3"
              onPress={handleSubmit}
              disabled={loading}>
              <Text className="font-bold text-white">{loading ? 'Creating...' : 'Create account'}</Text>
            </Pressable>

            <Text className="mt-3 text-center text-sm text-[#7d867f]">
              Already have an account?{' '}
              <Text className="font-semibold text-[#2f3b33] underline" onPress={() => router.replace('/login' as any)}>
                Login
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
