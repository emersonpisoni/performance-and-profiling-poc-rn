import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

export function ThreadMonitor() {
  const rotation = useSharedValue(0);
  const [jsTicks, setJsTicks] = useState(0);
  const [worstGapMs, setWorstGapMs] = useState(0);
  const lastTick = useRef(Date.now());

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTick.current;
      lastTick.current = now;
      setWorstGapMs((prev) => Math.max(prev, gap));
      setJsTicks((t) => t + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Animated.View style={[styles.spinner, spinnerStyle]} />
        <ThemedText style={styles.label}>UI thread{'\n'}(Reanimated)</ThemedText>
      </View>
      <View style={styles.cell}>
        <ThemedText style={styles.ticks}>{jsTicks}</ThemedText>
        <ThemedText style={styles.label}>JS thread{'\n'}(100ms ticks)</ThemedText>
      </View>
      <View style={styles.cell}>
        <ThemedText style={[styles.ticks, worstGapMs > 250 && styles.bad]}>
          {worstGapMs}ms
        </ThemedText>
        <ThemedText style={styles.label}>worst JS thread{'\n'}stall</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cell: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  ticks: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  bad: {
    color: '#c0392b',
  },
  label: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 14,
  },
});
