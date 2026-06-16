import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Card, DemoButton } from '@/components/perf/ui';
import { ThreadMonitor } from '@/components/perf/thread-monitor';
import { ThemedText } from '@/components/themed-text';

/** Heavy synchronous work: occupies the JS thread for roughly `ms`. */
function busyWait(ms: number) {
  const end = Date.now() + ms;
  let x = 0;
  while (Date.now() < end) {
    x += Math.sqrt(x + 1);
  }
  return x;
}

/**
 * Same workload, but split into chunks. Between each chunk we yield control
 * back to the event loop (setTimeout 0), so the JS thread can process the
 * monitor's setInterval, touches, etc. — without freezing the UI.
 */
function busyWaitChunked(totalMs: number, chunkMs: number, onDone: () => void) {
  let remaining = totalMs;
  const step = () => {
    busyWait(Math.min(chunkMs, remaining));
    remaining -= chunkMs;
    if (remaining > 0) setTimeout(step, 0);
    else onDone();
  };
  step();
}

export default function JsThreadDemo() {
  const [running, setRunning] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'JS thread vs UI thread' }} />

      <Card>
        <ThemedText type="subtitle">What to observe</ThemedText>
        <ThreadMonitor />
        <ThemedText style={styles.note}>
          The blue square spins on the UI thread (Reanimated). The counter is updated by the JS
          thread. When you block the JS thread, the counter freezes and &quot;worst stall&quot; spikes —
          but the square keeps spinning. That proves they are different threads.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">1. Block the JS thread</ThemedText>
        <ThemedText style={styles.note}>
          A ~2s synchronous loop. Everything on the JS thread stops: counter, touches, navigation.
        </ThemedText>
        <DemoButton
          variant="danger"
          label="Block JS for 2s"
          onPress={() => {
            busyWait(2000);
          }}
        />
      </Card>

      <Card>
        <ThemedText type="subtitle">2. Same workload, chunked</ThemedText>
        <ThemedText style={styles.note}>
          The same ~2s of work, but in 16ms chunks that yield control back to the event loop.
          The counter keeps going up and the UI stays responsive.
        </ThemedText>
        <DemoButton
          label={running ? 'Processing…' : 'Run chunked (16ms)'}
          onPress={() => {
            if (running) return;
            setRunning(true);
            busyWaitChunked(2000, 16, () => setRunning(false));
          }}
        />
      </Card>

      <Card>
        <ThemedText type="subtitle">Takeaway</ThemedText>
        <ThemedText style={styles.note}>
          Heavy synchronous work on the JS thread is the #1 cause of jank. Fixes: split into chunks,
          defer with InteractionManager/requestIdleCallback, move off the JS thread (worklets, native
          modules), or simply do less work.
        </ThemedText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  note: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
});
