import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearSession, getSession } from '@/lib/session';

export default function HomeScreen() {
  const router = useRouter();
  const { username } = getSession();

  return (
    <SafeAreaView className="flex-1 bg-[#f7f3ee]">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-4">
        <Animated.View entering={FadeInDown.duration(700)} className="mb-7 mt-3">
          <Text className="mb-4 text-center text-5xl font-semibold tracking-[7px] text-[#2f3b33]">
            MindOrbit
          </Text>
          <View className="mb-3 items-center">
            {!username ? (
              <Pressable
                className="rounded-xl border border-[#d2d9d2] bg-white/70 px-4 py-2"
                onPress={() => router.push('/login' as any)}>
                <Text className="text-sm font-semibold text-[#2f3b33]">Sign in</Text>
              </Pressable>
            ) : (
              <Pressable
                className="rounded-xl border border-[#d2d9d2] bg-white/70 px-4 py-2"
                onPress={async () => {
                  await clearSession();
                  router.replace('/login' as any);
                }}>
                <Text className="text-sm font-semibold text-[#2f3b33]">Logout ({username})</Text>
              </Pressable>
            )}
          </View>
          <Text className="mb-3 text-center text-lg leading-7 text-[#4f5d54]">
            MindOrbit is a quiet space designed to help you reflect on your emotions, understand
            your inner patterns and build healthier habits through daily reflection.
          </Text>
          <Text className="text-center text-base italic leading-6 text-[#2f3b33]">
            "Taking care of your mental health is not a luxury - it is a necessity."
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(700)} className="gap-4">
          <View className="gap-3 rounded-[28px] border border-white/60 bg-white/70 px-6 py-6 shadow">
            <Text className="text-center text-[30px] font-semibold text-[#2f3b33]">Daily Check-In</Text>
            <Text className="text-center text-[17px] leading-7 text-[#5e6961]">
              Record how you feel today and track your emotional state.
            </Text>
            <Pressable
              className="mt-2 self-center rounded-2xl bg-[#2f3b33] px-7 py-3"
              onPress={() => router.push('/(tabs)/explore')}>
              <Text className="text-base font-semibold text-white">Start</Text>
            </Pressable>
          </View>

          <View className="gap-3 rounded-[28px] border border-white/60 bg-white/70 px-6 py-6 shadow">
            <Text className="text-center text-[30px] font-semibold text-[#2f3b33]">
              Reflection Journal
            </Text>
            <Text className="text-center text-[17px] leading-7 text-[#5e6961]">
              Explore your past entries and emotional patterns.
            </Text>
            <Pressable
              className="mt-2 self-center rounded-2xl bg-[#2f3b33] px-7 py-3"
              onPress={() => router.push('/reflection' as any)}>
              <Text className="text-base font-semibold text-white">Open</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
