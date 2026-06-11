import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, DemoButton } from '@/components/perf/ui';
import { ThemedText } from '@/components/themed-text';

/** Cores que ciclam a cada render, para "piscar" quando o componente re-renderiza. */
const COLORS = ['#0a7ea4', '#16a34a', '#d97706', '#9333ea', '#dc2626'];

function Box({ name, payload }: { name: string; payload?: { id: number } }) {
  const renders = useRef(0);
  renders.current += 1;
  const color = COLORS[renders.current % COLORS.length];
  return (
    <View style={[styles.box, { backgroundColor: color }]}>
      <ThemedText style={styles.boxText}>{name}</ThemedText>
      <ThemedText style={styles.boxText}>renders: {renders.current}</ThemedText>
    </View>
  );
}

// Versão memoizada: só re-renderiza se as props mudarem (comparação rasa).
const MemoBox = React.memo(Box);

export default function ReRendersDemo() {
  const [count, setCount] = useState(0);
  const [unstableProp, setUnstableProp] = useState(false);

  // Quando ligado, passamos um objeto NOVO a cada render -> quebra o React.memo.
  const memoPayload = unstableProp ? { id: count } : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Re-renders & memoização' }} />

      <Card>
        <ThemedText type="subtitle">Forçar re-render do pai</ThemedText>
        <ThemedText style={styles.note}>
          Cada toque incrementa o estado do pai. Observe quais filhos &quot;piscam&quot; (re-renderizam).
        </ThemedText>
        <DemoButton label={`Incrementar (${count})`} onPress={() => setCount((c) => c + 1)} />
      </Card>

      <Card>
        <ThemedText type="subtitle">Filhos SEM memo</ThemedText>
        <ThemedText style={styles.note}>Re-renderizam toda vez que o pai re-renderiza.</ThemedText>
        <View style={styles.row}>
          <Box name="A" />
          <Box name="B" />
        </View>
      </Card>

      <Card>
        <ThemedText type="subtitle">Filhos COM React.memo</ThemedText>
        <ThemedText style={styles.note}>
          Não re-renderizam — props estáveis. A não ser que você quebre a memoização abaixo.
        </ThemedText>
        <View style={styles.row}>
          <MemoBox name="C" payload={memoPayload} />
          <MemoBox name="D" payload={memoPayload} />
        </View>
        <DemoButton
          variant="neutral"
          label={unstableProp ? 'Prop instável: LIGADA' : 'Prop instável: desligada'}
          onPress={() => setUnstableProp((v) => !v)}
        />
        <ThemedText style={styles.note}>
          Com a prop instável ligada, passamos um objeto novo a cada render. O React.memo compara por
          referência, vê &quot;mudou&quot; e re-renderiza C e D — o erro clássico que useMemo/useCallback evitam.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">Conclusão</ThemedText>
        <ThemedText style={styles.note}>
          Re-render não é grátis. React.memo, useMemo e useCallback ajudam, mas só funcionam se as
          props/referências forem estáveis. Use o React DevTools Profiler (&quot;Highlight updates&quot;) para
          ver exatamente o que re-renderiza.
        </ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  note: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  box: {
    flex: 1,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  boxText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
