import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card, DemoButton } from '@/components/perf/ui';
import { ThemedText } from '@/components/themed-text';

const TRAVEL = 240;

function busyWait(ms: number) {
  const end = Date.now() + ms;
  let x = 0;
  while (Date.now() < end) x += Math.sqrt(x + 1);
  return x;
}

/** Animation driven by the JS thread: each frame is a setState via requestAnimationFrame. */
function JsAnimatedBox() {
  const [x, setX] = useState(0);
  const dir = useRef(1);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      setX((prev) => {
        let next = prev + dir.current * 4;
        if (next > TRAVEL) {
          next = TRAVEL;
          dir.current = -1;
        } else if (next < 0) {
          next = 0;
          dir.current = 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <View style={[styles.box, { backgroundColor: '#c0392b', transform: [{ translateX: x }] }]} />;
}

/** Animation on the UI thread: the worklet runs independently of the JS thread. */
function ReanimatedBox() {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(TRAVEL, { duration: 1200, easing: Easing.linear }), -1, true);
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[styles.box, { backgroundColor: '#16a34a' }, style]} />;
}

export default function AnimationsDemo() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Animations: JS vs UI thread' }} />

      <Card>
        <ThemedText type="subtitle">JS thread (requestAnimationFrame + setState)</ThemedText>
        <View style={styles.track}>
          <JsAnimatedBox />
        </View>
        <ThemedText style={styles.note}>Each frame depends on the JS thread being free.</ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">UI thread (Reanimated worklet)</ThemedText>
        <View style={styles.track}>
          <ReanimatedBox />
        </View>
        <ThemedText style={styles.note}>Runs off the JS thread.</ThemedText>
      </Card>

      <Card>
        <ThemedText type="subtitle">Stress test</ThemedText>
        <ThemedText style={styles.note}>
          Block the JS thread and watch: the red box (JS) freezes; the green one (Reanimated) stays
          smooth. That&apos;s why animations should run on the UI thread whenever possible.
        </ThemedText>
        <DemoButton variant="danger" label="Block JS for 1.5s" onPress={() => busyWait(1500)} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  note: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  track: {
    height: 56,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#88888822',
    paddingHorizontal: 8,
  },
  box: { width: 40, height: 40, borderRadius: 8 },
});
