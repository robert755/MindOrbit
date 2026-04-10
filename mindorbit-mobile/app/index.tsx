import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { loadSession } from '@/lib/session';

export default function IndexPage() {
  const [target, setTarget] = useState<'/login' | '/(tabs)' | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const session = await loadSession();
      if (!mounted) return;
      setTarget(session.userId ? '/(tabs)' : '/login');
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (!target) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href={target as any} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f7f3ee' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
