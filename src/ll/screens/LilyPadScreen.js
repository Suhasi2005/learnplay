import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import GameFrame from '../games/GameFrame';
import { buildRound, GIVEN, PADS, TOTAL_ROUNDS } from '../games/lilyPadData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Lily Pad Hop" — Skip Counting (Senior KG).
//
// Five pads across a pond, the first two numbered. The frog sits on the
// last known number; each correct pick numbers the next pad and the frog
// hops onto it. Three hops per pond, so the step gets said out loud three
// times in a row — that repetition is how skip counting sticks.
const PAD = 56;
const GAP = 8;
const FROG = 40;

const padX = (i) => i * (PAD + GAP) + (PAD - FROG) / 2;

export default function LilyPadScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-skipcount', subjectId: 'Math', standardId: 'Senior KG', title: 'Skip Counting' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [hop, setHop] = useState(0);
  const [wrongPick, setWrongPick] = useState(null);
  const frogX = useRef(new Animated.Value(padX(GIVEN - 1))).current;
  const frogY = useRef(new Animated.Value(0)).current;

  const current = round.hops[hop];
  const revealed = GIVEN + hop; // pads [0, revealed) show their numbers

  useEffect(() => {
    setHop(0);
    setWrongPick(null);
    frogX.setValue(padX(GIVEN - 1));
    frogY.setValue(0);
    flow.say(`Count by ${round.step}s. ${round.sequence[0]}, ${round.sequence[1]}, what comes next?`);
  }, [flow.index]);

  function jumpTo(pad) {
    Animated.parallel([
      Animated.timing(frogX, { toValue: padX(pad), duration: 420, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(frogY, { toValue: -30, duration: 210, useNativeDriver: true }),
        Animated.timing(frogY, { toValue: 0, duration: 210, useNativeDriver: true }),
      ]),
    ]).start();
  }

  function handlePick(n) {
    if (flow.isProcessing || !current) return;
    if (n === current.answer) {
      jumpTo(current.pad);
      if (hop === round.hops.length - 1) {
        setHop(hop + 1);
        flow.succeed(`Counting by ${round.step}s: ${round.sequence.join(', ')}!`, { hold: 1900 });
      } else {
        setHop(hop + 1);
        flow.cheer(`${n}!`);
      }
    } else {
      setWrongPick(n);
      flow.miss(`Hop on by ${round.step}. Try again!`);
      flow.later(() => setWrongPick(null), 420);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Help the frog hop across!">
      <View style={styles.stepChip}>
        <Text style={styles.stepText}>Counting by {round.step}s</Text>
      </View>

      <View style={styles.pond}>
        <View style={[styles.padRow, { width: PADS * PAD + (PADS - 1) * GAP }]}>
          {round.sequence.map((value, i) => {
            const shown = i < revealed;
            const isNext = i === revealed && current;
            return (
              <View key={`${flow.index}-${i}`} style={[styles.pad, shown && styles.padShown, isNext && styles.padNext]}>
                <Text style={[styles.padText, !shown && styles.padUnknown]}>{shown ? value : isNext ? '?' : ''}</Text>
              </View>
            );
          })}
          <Animated.Text style={[styles.frog, { transform: [{ translateX: frogX }, { translateY: frogY }] }]}>🐸</Animated.Text>
        </View>
      </View>

      <View style={styles.options}>
        {(current?.options ?? []).map((n) => (
          <Animated.View key={`${flow.index}-${hop}-${n}`} style={wrongPick === n && { transform: [{ translateX: flow.shakeX }] }}>
            <Pressable
              onPress={() => handlePick(n)}
              disabled={flow.isProcessing}
              accessibilityRole="button"
              accessibilityLabel={`${n}`}
              style={({ pressed }) => [styles.option, flow.hinting && n === current.answer && styles.hint, pressed && styles.pressed]}
            >
              <Text style={styles.optionLeaf}>🍃</Text>
              <Text style={styles.optionText}>{n}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stepChip: { backgroundColor: ll.white, borderRadius: llRadius.pill, paddingVertical: 6, paddingHorizontal: 16, ...llShadow.soft },
  stepText: { ...llType.cardTitle, color: ll.blueInk },

  pond: {
    alignSelf: 'stretch', alignItems: 'center', marginTop: 22, paddingTop: 58, paddingBottom: 26,
    backgroundColor: '#BFDDFB', borderRadius: llRadius.screen, borderWidth: 4, borderColor: '#A6CDF5',
  },
  padRow: { flexDirection: 'row', gap: GAP },
  pad: {
    width: PAD, height: PAD, borderRadius: PAD / 2, backgroundColor: '#8ECFA5', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#5FAE7F',
  },
  padShown: { backgroundColor: ll.green, borderBottomColor: ll.greenDeep },
  padNext: { borderWidth: 3, borderColor: ll.amber },
  padText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: ll.white },
  padUnknown: { color: ll.amberInk },
  frog: { position: 'absolute', left: 0, top: -44, fontSize: 34, width: FROG, textAlign: 'center' },

  options: { flexDirection: 'row', gap: 14, marginTop: 30 },
  option: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: ll.greenLight, ...llShadow.soft,
  },
  optionLeaf: { fontSize: 14, position: 'absolute', top: 8 },
  optionText: { ...llType.h2, color: ll.greenDeep, marginTop: 6 },
  hint: { borderColor: ll.amber },
  pressed: { transform: [{ scale: 0.95 }] },
});
