# Performance & Profiling in React Native — Study

A study POC about **performance and profiling** in React Native (Expo SDK 54, RN 0.81, New Architecture). Each concept has an interactive demo in [app/perf/](app/perf/), reachable from the **Perf Lab** tab.

> How to run: `npm install`, then `npm run ios` / `npm run android`. Open the **Perf Lab** tab and walk through the 4 demos. For reliable profiles, **always measure in release** (`npx expo run:ios --configuration Release`), not in dev — dev mode adds overhead that distorts everything.

---

## 1. The mental model: the threads

The rule that explains 90% of RN performance problems is understanding which threads exist and what runs on each:

| Thread | What runs on it | When it becomes the bottleneck |
| --- | --- | --- |
| **JS thread** | Your React code, business logic, handlers, `setState`, requests, `requestAnimationFrame` | Heavy synchronous work, too many re-renders, huge JSON, `setState`-driven animations |
| **UI thread** (main/native) | Layout, drawing, gestures, native animations (Reanimated worklets) | Very deep view trees, overdraw, animations that depend on the JS thread |
| **Render/Shadow thread** | Layout calculation (Yoga) and the tree _commit_ | Huge trees, mounting whole lists at once |

**Core insight:** the threads are independent. If the JS thread freezes, the UI thread can keep drawing an animation — as long as that animation doesn't depend on JS. That's exactly what **Demo 1** proves.

> 📐 **Diagrams:** see [docs/architecture.md](docs/architecture.md) for the visual walkthrough of how RN works, compared with **React Web** and **native code**.

### Frame budget
For 60 FPS, each frame has **~16.6 ms** (at 120 Hz, ~8.3 ms). If the JS thread or the UI thread blows that budget, a frame is dropped → **jank** (visible stutter). Profiling is, at its core, finding out who blew the 16 ms and why.

---

## 2. The New Architecture (key in 2025/2026)

Since RN 0.76 the **New Architecture** is the default (this project uses it). Worth understanding the terms to discuss the topic:

- **JSI (JavaScript Interface):** replaces the old asynchronous, JSON-serialization-based _bridge_. Lets JS call native functions **synchronously and without serializing**, via direct references. Kills the classic bridge bottleneck.
- **Fabric:** the new renderer. Enables concurrent rendering, better interop with the UI thread, and synchronous layout measurement.
- **TurboModules:** native modules loaded on demand (_lazy_) and typed via Codegen.
- **Hermes:** a JS engine optimized for mobile (fast startup, lower memory, precompiled bytecode). It's the default in Expo.

Why it matters: many old pieces of advice ("avoid the bridge", "use `useNativeDriver`") changed shape with the New Architecture. Knowing what still applies is what makes for an up-to-date discussion.

---

## 3. The most common causes of jank (and the demos)

### Demo 1 — JS thread vs UI thread · [app/perf/js-thread.tsx](app/perf/js-thread.tsx)
A synchronous 2s loop blocks the JS thread. **What to observe:** the JS-thread counter freezes and the "worst stall" metric spikes, but the Reanimated square **keeps spinning**. The second part shows the same workload split into 16 ms chunks (`setTimeout`), which keeps the UI responsive.
**Concept:** heavy synchronous work is the #1 cause of freezes. Fixes: chunk it, defer it (`InteractionManager.runAfterInteractions`), move it to worklets/native, or just do less work.

### Demo 2 — Re-renders & memoization · [app/perf/re-renders.tsx](app/perf/re-renders.tsx)
Components "flash" (change color) on every render. Children without `React.memo` re-render whenever the parent re-renders; memoized ones don't — **until** you pass an unstable prop (a new object on every render), which breaks `memo`'s shallow comparison.
**Concept:** `React.memo`, `useMemo`, and `useCallback` only work with **stable references**. Unnecessary renders are CPU cost on the JS thread. Tool to see it: React DevTools Profiler with _"Highlight updates when components render"_.

### Demo 3 — Lists & virtualization · [app/perf/list-virtualization.tsx](app/perf/list-virtualization.tsx)
3000 items rendered with `ScrollView + map` (mounts all at once) vs `FlatList` (virtualizes, renders only what's visible). The screen measures the **mount time** — the difference is dramatic.
**Concept:** never use `ScrollView + map` for long lists. Use virtualized lists. Best practices: stable `keyExtractor`, `getItemLayout` for fixed heights, memoized `renderItem`, avoid inline functions/objects. In production, **FlashList** (Shopify) is the recommended default because it's even faster.

### Demo 4 — Animations: JS vs UI thread · [app/perf/animations.tsx](app/perf/animations.tsx)
Two boxes move: the red one via `requestAnimationFrame + setState` (JS thread); the green one via a **Reanimated worklet** (UI thread). When you block the JS thread, the red one freezes and the green one stays smooth.
**Concept:** animations should run on the UI thread. **Reanimated 4** runs worklets off the JS thread, so animations and gestures don't suffer when JS is busy.

---

## 4. Profiling tools (what to use to measure)

| Tool | What for |
| --- | --- |
| **React DevTools — Profiler** | See renders/commits, component _flamegraph_, who re-renders and why |
| **Hermes Sampling Profiler** | Profile the JS thread (functions that burn the most CPU); opens in Chrome DevTools / React Native DevTools |
| **Perf Monitor** (Dev Menu) | JS- and UI-thread FPS in real time, right on the device |
| **React Native DevTools** | Network, performance, layout, and console inspection |
| **Xcode Instruments / Android Studio Profiler** | Native profiling: CPU, memory, GPU, _time profiler_ |
| **Sentry / Firebase Performance** | Production monitoring: cold start, slow screens, _frozen frames_ |
| **Expo Atlas** (`EXPO_ATLAS=true`) | Bundle size / dependency analysis |

**Method:** measure first (baseline) → change one thing → measure again. Always in **release**. On a real device, not just the simulator.

---

## 5. Metrics that matter

- **Cold/warm start (TTI):** time until the app is interactive.
- **FPS / dropped frames (JS and UI):** scroll and animation smoothness.
- **Tap/interaction latency:** time between the tap and the response.
- **Screen / list mount time.**
- **Memory usage** (leaks = listeners/timers not cleaned up, large images).
- **Bundle size** (affects startup, especially on web).

---

## 6. Optimization checklist (in order of impact)

1. Make sure **New Architecture + Hermes** are on (default in SDK 54).
2. Long lists → virtualized (**FlatList/FlashList**), never `ScrollView + map`.
3. Eliminate unnecessary **re-renders** (`memo`/`useMemo`/`useCallback` with stable refs).
4. Move animations/gestures to the **UI thread** (Reanimated worklets).
5. Take **heavy work** off the JS thread (chunk, defer, native).
6. Optimize **images** (`expo-image`, correct sizes, caching).
7. Shrink the **bundle** (tree-shaking, targeted imports, lazy loading of screens).

---

## Study structure in the code

```
app/
  (tabs)/explore.tsx        # "Perf Lab" menu linking to the demos
  perf/
    _layout.tsx             # demo stack
    js-thread.tsx           # Demo 1
    re-renders.tsx          # Demo 2
    list-virtualization.tsx # Demo 3
    animations.tsx          # Demo 4
components/perf/
  thread-monitor.tsx        # spinner (UI thread) + ticker (JS thread)
  ui.tsx                    # buttons/cards reused by the demos
```

## References

- Expo — Versioned docs SDK 54: https://docs.expo.dev/versions/v54.0.0/
- React Native — Performance: https://reactnative.dev/docs/performance
- React Native — New Architecture: https://reactnative.dev/architecture/landing-page
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- FlashList: https://shopify.github.io/flash-list/