import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/lib/api';
import { setSession } from '@/lib/session';

export default function LoginScreen() {
  const [animate, setAnimate] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        username,
        password,
      });

      await setSession(String(response.data?.id ?? ''), response.data?.username ?? username);
      router.replace('/(tabs)');
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="relative flex-1 overflow-hidden bg-[#f7f3ee]">
      <View className="absolute inset-0 bg-[#f7f3ee]" />
      <View className="absolute -left-28 -top-36 h-[420px] w-[420px] rounded-full bg-[#d6e1d6]/55" />
      <View className="absolute -bottom-24 -right-16 h-[320px] w-[320px] rounded-full bg-[#eadccc]/60" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="relative flex-1 items-center justify-center px-6">
        <View
          className={`absolute left-1/2 z-20 items-center -translate-x-1/2 ${
            animate ? 'top-10 scale-75 opacity-95' : 'top-1/2 -translate-y-1/2 scale-100 opacity-100'
          }`}>
          <Text className="text-6xl font-semibold tracking-[0.25em] text-[#2f3b33]">MindOrbit</Text>
          <Text className="mt-4 max-w-xl text-center text-[11px] uppercase tracking-[0.15em] text-[#6e786f]">
            your daily ritual for clarity, balance and self-reflection
          </Text>
        </View>

        <View
          className={`w-full max-w-md rounded-[32px] border border-white/50 bg-white/70 px-10 py-12 shadow-lg ${
            animate ? 'translate-y-20 opacity-100' : 'pointer-events-none translate-y-32 opacity-0'
          }`}>
          <View className="mb-10 items-center">
            <Text className="text-3xl font-semibold text-[#2f3b33]">Welcome back</Text>
            <Text className="mt-3 text-base text-[#7d867f]">
              Enter your account and continue your journey.
            </Text>
          </View>

          <View className="gap-5">
            <View>
              <Text className="mb-2 text-sm text-[#556157]">Username</Text>
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor="#9aa39d"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/50 px-5 py-4 text-base text-[#2f3b33]"
              />
            </View>

            <View>
              <Text className="mb-2 text-sm text-[#556157]">Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#9aa39d"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/50 px-5 py-4 text-base text-[#2f3b33]"
              />
            </View>

            {!!errorMessage && <Text className="text-sm font-medium text-red-500">{errorMessage}</Text>}

            <Pressable
              className={`w-full rounded-xl bg-[#2f3b33] py-4 ${isLoading ? 'opacity-70' : ''}`}
              disabled={isLoading}
              onPress={handleSubmit}>
              <Text className="text-center text-sm font-bold tracking-[0.15em] text-white">
                {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
              </Text>
            </Pressable>
          </View>

          <View className="mt-8 border-t border-gray-100 pt-6">
            <Text className="text-center text-sm text-[#7d867f]">
              Hey, create an account{' '}
              <Text className="font-semibold text-[#2f3b33] underline" onPress={() => router.push('/register' as any)}>
                here
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
