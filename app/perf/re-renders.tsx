import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, DemoButton } from '@/components/perf/ui';
import { ThemedText } from '@/components/themed-text';

/** Colors that cycle on each render, to "flash" when the component re-renders. */
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

// Memoized version: only re-renders if its props change (shallow comparison).
const MemoBox = React.memo(Box);

export default function ReRendersDemo() {
  const [count, setCount] = useState(0);
  const [unstableProp, setUnstableProp] = useState(false);

  // When on, we pass a NEW object on every render -> breaks React.memo.
  const memoPayload = unstableProp ? { id: count } : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Re-renders & memoization' }} />

      <Card>
        <ThemedText type="subtitle">Force a parent re-render</ThemedText>
        <ThemedText style={styles.note}>
          Each tap increments the parent state. Watch which children &quot;flash&quot; (re-render).
        </ThemedText>
        <DemoButton label={`Increment (${count})`} onPress={() => setCount((c) => c + 1)} />
      </Card>

      <Card>
        <ThemedText type="subtitle">Children WITHOUT memo</ThemedText>
        <ThemedText style={styles.note}>They re-render every time the parent re-renders.</ThemedText>
        <View style={styles.row}>
          <Box name="A" />
          <Box name="B" />
        </View>
      </Card>

      <Card>
        <ThemedText type="subtitle">Children WITH React.memo</ThemedText>
        <ThemedText style={styles.note}>
          They don&apos;t re-render — stable props. Unless you break memoization below.
        </ThemedText>
        <View style={styles.row}>
          <MemoBox name="C" payload={memoPayload} />
          <MemoBox name="D" payload={memoPayload} />
        </View>
        <DemoButton
          variant="neutral"
          label={unstableProp ? 'Unstable prop: ON' : 'Unstable prop: off'}
          onPress={() => setUnstableProp((v) => !v)}
        />
        <ThemedText style={styles.note}>
          With the unstable prop on, we pass a new object on every render. React.memo compares by
          reference, sees &quot;changed&quot; and re-renders C and D — the classic mistake that
          useMemo/useCallback prevent.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">Takeaway</ThemedText>
        <ThemedText style={styles.note}>
          Re-rendering isn&apos;t free. React.memo, useMemo, and useCallback help, but only work when
          props/references are stable. Use the React DevTools Profiler (&quot;Highlight updates&quot;) to see
          exactly what re-renders.
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
