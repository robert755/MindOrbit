import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
    <SafeAreaView className="flex-1 bg-[#f7f3ee]">
      <View className="absolute -left-12 -top-28 h-[360px] w-[360px] rounded-full bg-[#d6e1d6]/60" />
      <View className="absolute -bottom-24 -right-16 h-[320px] w-[320px] rounded-full bg-[#eadccc]/70" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="min-h-full justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInUp.duration(800)} className="mb-6 items-center">
            <Text className={`font-semibold text-[#2f3b33] ${animate ? 'text-4xl tracking-[6px]' : 'text-5xl tracking-[8px]'}`}>
              MindOrbit
            </Text>
            <Text className="mt-2 max-w-[330px] text-center text-[11px] tracking-[2px] text-[#6e786f]">
              YOUR DAILY RITUAL FOR CLARITY, BALANCE AND SELF-REFLECTION
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).duration(850)}
            className="mx-auto w-full max-w-[430px] rounded-[32px] border border-white/50 bg-white/70 px-6 py-7 shadow">
            <View className="mb-6 items-center">
              <Text className="text-3xl font-semibold text-[#2f3b33]">Welcome back</Text>
              <Text className="mt-1 text-center text-[15px] text-[#7d867f]">
                Enter your account and continue your journey.
              </Text>
            </View>

            <View className="gap-3">
              <View>
                <Text className="mb-2 text-[13px] text-[#556157]">Username</Text>
                <TextInput
                  placeholder="Enter your username"
                  placeholderTextColor="#9aa39d"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/80 px-4 py-3 text-[#2f3b33]"
                />
              </View>

              <View>
                <Text className="mb-2 text-[13px] text-[#556157]">Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9aa39d"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/80 px-4 py-3 text-[#2f3b33]"
                />
              </View>

              {!!errorMessage && <Text className="text-[13px] font-medium text-red-500">{errorMessage}</Text>}

              <Pressable
                className="mt-1 w-full items-center justify-center rounded-xl bg-[#2f3b33] py-3"
                disabled={isLoading}
                onPress={handleSubmit}>
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-[13px] font-bold tracking-[1.2px] text-white">SIGN IN</Text>
                )}
              </Pressable>

              <View className="mt-2 border-t border-[#f0f0f0] pt-3" />
              <Text className="text-center text-sm text-[#7d867f]">
                Hey, create an account{' '}
                <Text
                  className="font-semibold text-[#2f3b33] underline"
                  onPress={() => router.push('/register' as any)}>
                  here
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
