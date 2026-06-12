# Performance & Profiling em React Native — Estudo

POC de estudo sobre **performance e profiling** em React Native (Expo SDK 54, RN 0.81, New Architecture). Cada conceito tem uma demo interativa em [app/perf/](app/perf/), acessível pela aba **Perf Lab**.

> Como rodar: `npm install` e depois `npm run ios` / `npm run android`. Abra a aba **Perf Lab** e percorra as 4 demos. Para perfis confiáveis, **sempre meça em release** (`npx expo run:ios --configuration Release`), não em dev — o modo dev tem overhead que distorce tudo.

---

## 1. O modelo mental: as duas threads

A regra que explica 90% dos problemas de performance em RN é entender quais threads existem e o que roda em cada uma:

| Thread | O que roda | Quando vira gargalo |
| --- | --- | --- |
| **JS thread** | Seu código React, lógica de negócio, handlers, `setState`, requisições, `requestAnimationFrame` | Trabalho síncrono pesado, re-renders demais, JSON gigante, animações via `setState` |
| **UI thread** (main/native) | Layout, desenho, gestos, animações nativas (Reanimated worklets) | Views muito profundas, overdraw, animações que dependem da JS |
| **Render/Shadow thread** | Cálculo de layout (Yoga) e _commit_ da árvore | Árvores enormes, montar listas inteiras de uma vez |

**Insight central:** as threads são independentes. Se a JS thread trava, a UI thread pode continuar desenhando uma animação — desde que essa animação não dependa da JS. É exatamente isso que a **Demo 1** prova.

> 📐 **Diagramas:** veja [docs/arquitetura.md](docs/arquitetura.md) para o passo a passo visual de como o RN funciona, comparado com **React Web** e **código nativo**.

### Orçamento de frame (frame budget)
Para 60 FPS, cada frame tem **~16,6 ms** (a 120 Hz, ~8,3 ms). Se a JS thread ou a UI thread estourar esse orçamento, um frame é perdido → **jank** (travada/engasgo visível). Profiling é, no fundo, descobrir quem estourou os 16 ms e por quê.

---

## 2. A New Architecture (importante em 2025/2026)

Desde o RN 0.76 a **New Architecture** é o padrão (este projeto usa). Vale entender os termos para discutir o assunto:

- **JSI (JavaScript Interface):** substitui a antiga _bridge_ assíncrona baseada em serialização JSON. Permite que JS chame funções nativas **de forma síncrona e sem serializar**, via referências diretas. Mata o gargalo clássico da bridge.
- **Fabric:** o novo renderizer. Permite renderização concorrente, melhor interop com a UI thread e medições de layout síncronas.
- **TurboModules:** módulos nativos carregados sob demanda (_lazy_) e com tipagem via Codegen.
- **Hermes:** engine JS otimizada para mobile (startup rápido, menor uso de memória, bytecode pré-compilado). É o padrão no Expo.

Por que importa: muitos conselhos antigos ("evite passar pela bridge", "use `useNativeDriver`") mudaram de forma com a New Architecture. Saber o que ainda se aplica é o que diferencia uma discussão atual.

---

## 3. As causas de jank mais comuns (e as demos)

### Demo 1 — JS thread vs UI thread · [app/perf/js-thread.tsx](app/perf/js-thread.tsx)
Um loop síncrono de 2s bloqueia a JS thread. **Observação:** o contador da JS thread congela e a métrica "maior travada" dispara, mas o quadrado do Reanimated **continua girando**. A segunda parte mostra a mesma carga quebrada em fatias de 16 ms (`setTimeout`), que mantém a UI responsiva.
**Conceito:** trabalho pesado síncrono é a causa #1 de travamentos. Soluções: fatiar, adiar (`InteractionManager.runAfterInteractions`), mover para worklets/nativo, ou fazer menos trabalho.

### Demo 2 — Re-renders & memoização · [app/perf/re-renders.tsx](app/perf/re-renders.tsx)
Componentes "piscam" (trocam de cor) a cada render. Filhos sem `React.memo` re-renderizam sempre que o pai re-renderiza; os memoizados não — **até** você passar uma prop instável (objeto novo a cada render), que quebra a comparação rasa do `memo`.
**Conceito:** `React.memo`, `useMemo` e `useCallback` só funcionam com **referências estáveis**. Render desnecessário é custo de CPU na JS thread. Ferramenta para enxergar: React DevTools Profiler com _"Highlight updates when components render"_.

### Demo 3 — Listas & virtualização · [app/perf/list-virtualization.tsx](app/perf/list-virtualization.tsx)
3000 itens renderizados com `ScrollView + map` (monta todos de uma vez) vs `FlatList` (virtualiza, renderiza só o visível). A tela mede o **tempo de montagem** — a diferença é gritante.
**Conceito:** nunca use `ScrollView + map` para listas longas. Use listas virtualizadas. Boas práticas: `keyExtractor` estável, `getItemLayout` para alturas fixas, `renderItem` memoizado, evitar funções/objetos inline. Em produção, **FlashList** (Shopify) é o padrão recomendado por ser ainda mais rápida.

### Demo 4 — Animações: JS vs UI thread · [app/perf/animations.tsx](app/perf/animations.tsx)
Duas caixas se movem: a vermelha via `requestAnimationFrame + setState` (JS thread); a verde via **Reanimated worklet** (UI thread). Ao bloquear a JS thread, a vermelha congela e a verde segue suave.
**Conceito:** animações devem rodar na UI thread. **Reanimated 4** executa os worklets fora da JS thread, então animações e gestos não sofrem com a JS ocupada.

---

## 4. Ferramentas de profiling (o que usar para medir)

| Ferramenta | Para quê |
| --- | --- |
| **React DevTools — Profiler** | Ver renders/commits, _flamegraph_ de componentes, quem re-renderiza e por quê |
| **Hermes Sampling Profiler** | Perfil da JS thread (funções que mais consomem CPU); abre no Chrome DevTools / React Native DevTools |
| **Perf Monitor** (Dev Menu) | FPS da JS e da UI thread em tempo real, direto no device |
| **React Native DevTools** | Inspeção de rede, performance, layout, console |
| **Xcode Instruments / Android Studio Profiler** | Perfil nativo: CPU, memória, GPU, _time profiler_ |
| **Sentry / Firebase Performance** | Monitoramento em produção: cold start, telas lentas, _frozen frames_ |
| **Expo Atlas** (`EXPO_ATLAS=true`) | Análise de tamanho de bundle / dependências |

**Método:** meça antes (baseline) → mude uma coisa → meça de novo. Sempre em **release**. Em device real, não só simulador.

---

## 5. Métricas que importam

- **Cold/warm start (TTI):** tempo até a app ficar interativa.
- **FPS / frames perdidos (JS e UI):** suavidade de scroll e animação.
- **Tap/interaction latency:** tempo entre o toque e a resposta.
- **Tempo de montagem de tela / lista.**
- **Uso de memória** (vazamentos = listeners/timers não limpos, imagens grandes).
- **Tamanho do bundle** (afeta startup, especialmente web).

---

## 6. Checklist de otimização (em ordem de impacto)

1. Garantir **New Architecture + Hermes** ligados (padrão no SDK 54).
2. Listas longas → virtualizadas (**FlatList/FlashList**), nunca `ScrollView + map`.
3. Eliminar **re-renders** desnecessários (`memo`/`useMemo`/`useCallback` com refs estáveis).
4. Mover animações/gestos para a **UI thread** (Reanimated worklets).
5. Tirar **trabalho pesado** da JS thread (fatiar, adiar, nativo).
6. Otimizar **imagens** (`expo-image`, tamanhos corretos, cache).
7. Reduzir o **bundle** (tree-shaking, imports pontuais, lazy loading de telas).

---

## Estrutura do estudo no código

```
app/
  (tabs)/explore.tsx        # menu "Perf Lab" com links para as demos
  perf/
    _layout.tsx             # stack das demos
    js-thread.tsx           # Demo 1
    re-renders.tsx          # Demo 2
    list-virtualization.tsx # Demo 3
    animations.tsx          # Demo 4
components/perf/
  thread-monitor.tsx        # spinner (UI thread) + ticker (JS thread)
  ui.tsx                    # botões/cards reutilizados pelas demos
```

## Referências

- Expo — Versioned docs SDK 54: https://docs.expo.dev/versions/v54.0.0/
- React Native — Performance: https://reactnative.dev/docs/performance
- React Native — New Architecture: https://reactnative.dev/architecture/landing-page
- Reanimated: https://docs.swmansion.com/react-native-reanimated/
- FlashList: https://shopify.github.io/flash-list/
