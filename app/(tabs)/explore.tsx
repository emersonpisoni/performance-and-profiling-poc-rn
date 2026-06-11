import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const DEMOS: { href: '/perf/js-thread' | '/perf/re-renders' | '/perf/list-virtualization' | '/perf/animations'; title: string; desc: string }[] = [
  {
    href: '/perf/js-thread',
    title: '1 · JS thread vs UI thread',
    desc: 'Bloqueie a JS thread e veja a UI congelar enquanto a animação na UI thread segue suave.',
  },
  {
    href: '/perf/re-renders',
    title: '2 · Re-renders & memoização',
    desc: 'Visualize quais componentes re-renderizam e como React.memo ajuda (ou falha).',
  },
  {
    href: '/perf/list-virtualization',
    title: '3 · Listas & virtualização',
    desc: 'Compare ScrollView+map contra FlatList virtualizada com 3000 itens.',
  },
  {
    href: '/perf/animations',
    title: '4 · Animações: JS vs UI thread',
    desc: 'Animação por setState vs Reanimated worklet, sob carga da JS thread.',
  },
];

export default function PerfLabScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Lab de Performance</ThemedText>
      <ThemedText style={styles.intro}>
        Experimentos para validar o estudo de profiling em React Native. Toque para abrir cada demo.
        O resumo teórico completo está no README do projeto.
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
