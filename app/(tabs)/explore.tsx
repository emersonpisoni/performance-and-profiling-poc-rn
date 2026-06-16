import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const DEMOS: { href: '/perf/js-thread' | '/perf/re-renders' | '/perf/list-virtualization' | '/perf/animations'; title: string; desc: string }[] = [
  {
    href: '/perf/js-thread',
    title: '1 · JS thread vs UI thread',
    desc: 'Block the JS thread and watch the UI freeze while the UI-thread animation stays smooth.',
  },
  {
    href: '/perf/re-renders',
    title: '2 · Re-renders & memoization',
    desc: 'Visualize which components re-render and how React.memo helps (or fails).',
  },
  {
    href: '/perf/list-virtualization',
    title: '3 · Lists & virtualization',
    desc: 'Compare ScrollView+map against a virtualized FlatList with 3000 items.',
  },
  {
    href: '/perf/animations',
    title: '4 · Animations: JS vs UI thread',
    desc: 'setState-driven animation vs a Reanimated worklet, under JS-thread load.',
  },
];

export default function PerfLabScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Performance Lab</ThemedText>
      <ThemedText style={styles.intro}>
        Experiments to validate the React Native profiling study. Tap to open each demo.
        The full theory summary lives in the project README.
      </ThemedText>

      {DEMOS.map((demo) => (
        <Link key={demo.href} href={demo.href} asChild>
          <Pressable>
            {({ pressed }) => (
              <ThemedView style={[styles.card, pressed && styles.cardPressed]}>
                <ThemedText type="subtitle">{demo.title}</ThemedText>
                <ThemedText style={styles.desc}>{demo.desc}</ThemedText>
              </ThemedView>
            )}
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingTop: 64 },
  intro: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#88888855',
    gap: 6,
  },
  cardPressed: { opacity: 0.6 },
  desc: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
});
