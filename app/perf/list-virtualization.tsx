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

/** Reporta quanto tempo levou do toque até o conteúdo estar montado/comitado. */
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
    () => Array.from({ length: COUNT }, (_, i) => ({ id: i, title: `Item número ${i}` })),
    [],
  );

  const open = (next: Mode) => {
    setMountMs(null);
    startRef.current = performance.now();
    setMode(next);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Listas & virtualização' }} />

      <Card style={styles.controls}>
        <ThemedText type="subtitle">{COUNT} itens</ThemedText>
        <View style={styles.row}>
          <Metric label="tempo de montagem" value={mountMs == null ? '—' : `${mountMs}ms`} />
          <Metric label="modo" value={mode === 'none' ? '—' : mode} />
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
          ScrollView monta os {COUNT} itens de uma vez (alto tempo de montagem). A FlatList
          virtualiza: só renderiza o que cabe na tela, então monta quase instantânea.
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
          // getItemLayout evita medições e acelera o scroll para alturas fixas.
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
