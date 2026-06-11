import { Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Card, DemoButton } from '@/components/perf/ui';
import { ThreadMonitor } from '@/components/perf/thread-monitor';
import { ThemedText } from '@/components/themed-text';

/** Trabalho síncrono pesado: ocupa a JS thread por aproximadamente `ms`. */
function busyWait(ms: number) {
  const end = Date.now() + ms;
  let x = 0;
  while (Date.now() < end) {
    x += Math.sqrt(x + 1);
  }
  return x;
}

/**
 * Mesma carga, porém quebrada em fatias. Entre cada fatia devolvemos o controle
 * ao event loop (setTimeout 0), então a JS thread consegue processar o
 * setInterval do monitor, toques, etc. — sem congelar a UI.
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
        <ThemedText type="subtitle">O que observar</ThemedText>
        <ThreadMonitor />
        <ThemedText style={styles.note}>
          O quadrado azul gira na UI thread (Reanimated). O contador é atualizado pela JS thread.
          Quando você bloqueia a JS thread, o contador congela e &quot;maior travada&quot; dispara —
          mas o quadrado continua girando. Isso prova que são threads diferentes.
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">1. Bloquear a JS thread</ThemedText>
        <ThemedText style={styles.note}>
          Loop síncrono de ~2s. Tudo na JS thread para: contador, toques e navegação.
        </ThemedText>
        <DemoButton
          variant="danger"
          label="Bloquear JS por 2s"
          onPress={() => {
            busyWait(2000);
          }}
        />
      </Card>

      <Card>
        <ThemedText type="subtitle">2. Mesma carga, em fatias</ThemedText>
        <ThemedText style={styles.note}>
          A mesma ~2s de trabalho, mas em pedaços de 16ms devolvendo o controle ao event loop.
          O contador continua subindo e a UI responde.
        </ThemedText>
        <DemoButton
          label={running ? 'Processando…' : 'Rodar em fatias (16ms)'}
          onPress={() => {
            if (running) return;
            setRunning(true);
            busyWaitChunked(2000, 16, () => setRunning(false));
          }}
        />
      </Card>

      <Card>
        <ThemedText type="subtitle">Conclusão</ThemedText>
        <ThemedText style={styles.note}>
          Trabalho pesado e síncrono na JS thread é a causa #1 de jank. Soluções: dividir em
          fatias, adiar com InteractionManager/requestIdleCallback, mover para fora da JS thread
          (worklets, módulos nativos) ou simplesmente fazer menos trabalho.
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
