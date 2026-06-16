import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { Card, DemoButton, Metric } from '@/components/perf/ui';
import { ThemedText } from '@/components/themed-text';

const COUNT = 3000;

type Mode = 'none' | 'scroll' | 'flat';

function Row({ item }: { item: { id: number; title: string } }) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.rowTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.rowSub}>id #{item.id}</ThemedText>
      </View>
    </View>
  );
}

/** Reports how long it took from the tap until the content was mounted/committed. */
function MountTimer({ start, onMeasured }: { start: number; onMeasured: (ms: number) => void }) {
  useEffect(() => {
    onMeasured(Math.round(performance.now() - start));
  }, [start, onMeasured]);
  return null;
}

export default function ListDemo() {
  const [mode, setMode] = useState<Mode>('none');
  const [mountMs, setMountMs] = useState<number | null>(null);
  const startRef = useRef(0);

  const data = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => ({ id: i, title: `Item number ${i}` })),
    [],
  );

  const open = (next: Mode) => {
    setMountMs(null);
    startRef.current = performance.now();
    setMode(next);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Lists & virtualization' }} />

      <Card style={styles.controls}>
        <ThemedText type="subtitle">{COUNT} items</ThemedText>
        <View style={styles.row}>
          <Metric label="mount time" value={mountMs == null ? '—' : `${mountMs}ms`} />
          <Metric label="mode" value={mode === 'none' ? '—' : mode} />
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DemoButton variant="danger" label="ScrollView + map" onPress={() => open('scroll')} />
          </View>
          <View style={{ flex: 1 }}>
            <DemoButton label="FlatList" onPress={() => open('flat')} />
          </View>
        </View>
        <ThemedText style={styles.note}>
          ScrollView mounts all {COUNT} items at once (high mount time). FlatList virtualizes: it
          only renders what fits on screen, so it mounts almost instantly.
        </ThemedText>
      </Card>

      {mode === 'scroll' && (
        <ScrollView style={styles.list}>
          <MountTimer start={startRef.current} onMeasured={setMountMs} />
          {data.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </ScrollView>
      )}

      {mode === 'flat' && (
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <Row item={item} />}
          ListHeaderComponent={<MountTimer start={startRef.current} onMeasured={setMountMs} />}
          // getItemLayout avoids measurement and speeds up scrolling for fixed heights.
          getItemLayout={(_, index) => ({ length: 64, offset: 64 * index, index })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  controls: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  note: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  list: { flex: 1 },
  rowItem: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#88888833',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0a7ea455' },
  rowTitle: { fontWeight: '600' },
  rowSub: { fontSize: 12, opacity: 0.6 },
});
