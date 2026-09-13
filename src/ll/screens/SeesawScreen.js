import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/seesawData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Seesaw Balance" — Addition & Subtraction (Senior KG).
//
// The sum sits on the left seat as real fruit; the right seat is empty, so
// the plank starts tipped left. Picking a number loads that many fruit on
// the right. Too few and the left stays down; too many and the right
// crashes down; exactly right and the plank levels out.
const TILT = 9;

function FruitPile({ fruit, count, crossed = 0 }) {
  return (
    <View style={styles.pile}>
      {Array.from({ length: count }, (_, i) => {
        const gone = i >= count - crossed;
        return (
          <Text key={i} style={[styles.fruit, gone && styles.fruitGone]}>{fruit}</Text>
        );
      })}
    </View>
  );
}

export default function SeesawScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-addsub', subjectId: 'Math', standardId: 'Senior KG', title: 'Addition & Subtraction' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [chosen, setChosen] = useState(null);
  const [wrongPick, setWrongPick] = useState(null);
  const tilt = useRef(new Animated.Value(-TILT)).current;

  const opWord = round.op === '+' ? 'plus' : 'take away';
  const sign = round.op === '+' ? '+' : '−';

  useEffect(() => {
    setChosen(null);
    setWrongPick(null);
    Animated.spring(tilt, { toValue: -TILT, friction: 6, useNativeDriver: true }).start();
    flow.say(`${round.a} ${opWord} ${round.b}. Balance the seesaw!`);
  }, [flow.index]);

  function settle(to) {
    Animated.spring(tilt, { toValue: to, friction: 4, tension: 60, useNativeDriver: true }).start();
  }

  function handlePick(n) {
    if (flow.isProcessing) return;
    setChosen(n);
    if (n === round.answer) {
      settle(0);
      flow.succeed(`${round.a} ${opWord} ${round.b} is ${round.answer}. Balanced!`, { hold: 1500 });
    } else if (n < round.answer) {
      settle(-TILT);
      setWrongPick(n);
      flow.miss(`${n} is too light. Try a bigger number!`);
      flow.later(() => setWrongPick(null), 420);
    } else {
      settle(TILT);
      setWrongPick(n);
      flow.miss(`${n} is too heavy. Try a smaller number!`);
      flow.later(() => setWrongPick(null), 420);
    }
  }

  const rotate = tilt.interpolate({ inputRange: [-TILT, TILT], outputRange: [`-${TILT}deg`, `${TILT}deg`] });
  const balanced = flow.isProcessing && chosen === round.answer;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Make the seesaw balance">
      <View style={styles.equation}>
        <Text style={styles.eqText}>{round.a} {sign} {round.b} =</Text>
        <View style={[styles.eqAnswer, balanced && styles.eqAnswerDone]}>
          <Text style={[styles.eqText, balanced && { color: ll.white }]}>{chosen ?? '?'}</Text>
        </View>
      </View>

      <View style={styles.rig}>
        <Animated.View style={[styles.plankWrap, { transform: [{ rotate }] }]}>
          <View style={styles.seats}>
            <View style={styles.seat}>
              <FruitPile fruit={round.fruit} count={round.a + (round.op === '+' ? round.b : 0)} crossed={round.op === '-' ? round.b : 0} />
            </View>
            <View style={styles.seat}>
              {chosen === null
                ? <Text style={styles.empty}>?</Text>
                : <FruitPile fruit={round.fruit} count={chosen} />}
            </View>
          </View>
          <View style={[styles.plank, balanced && { backgroundColor: ll.green }]} />
        </Animated.View>
        <View style={styles.fulcrum} />
      </View>

      <View style={styles.options}>
        {round.options.map((n) => (
          <Animated.View key={`${flow.index}-${n}`} style={wrongPick === n && { transform: [{ translateX: flow.shakeX }] }}>
            <Pressable
              onPress={() => handlePick(n)}
              disabled={flow.isProcessing}
              accessibilityRole="button"
              accessibilityLabel={`${n}`}
              style={({ pressed }) => [styles.option, flow.hinting && n === round.answer && styles.hint, pressed && styles.pressed]}
            >
              <Text style={styles.optionText}>{n}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  equation: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ll.white, borderRadius: llRadius.pill,
    paddingVertical: 6, paddingLeft: 22, paddingRight: 6, ...llShadow.soft,
  },
  eqText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: ll.ink },
  eqAnswer: { minWidth: 52, height: 48, borderRadius: 24, backgroundColor: ll.blueSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  eqAnswerDone: { backgroundColor: ll.green },

  rig: { width: 320, height: 200, alignItems: 'center', justifyContent: 'flex-end', marginTop: 22 },
  plankWrap: { width: 310, alignItems: 'stretch', marginBottom: 2 },
  seats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  seat: {
    width: 128, minHeight: 84, backgroundColor: 'rgba(255,255,255,0.85)', borderTopLeftRadius: llRadius.lg,
    borderTopRightRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  pile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 116 },
  fruit: { fontSize: 20, lineHeight: 26, width: 23, textAlign: 'center' },
  fruitGone: { opacity: 0.22 },
  empty: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: ll.muted },
  plank: { height: 14, borderRadius: 7, backgroundColor: ll.purple },
  fulcrum: {
    width: 0, height: 0, borderLeftWidth: 26, borderRightWidth: 26, borderBottomWidth: 40,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: ll.purpleDeep,
  },

  options: { flexDirection: 'row', gap: 16, marginTop: 26 },
  option: {
    width: 78, height: 78, borderRadius: 39, backgroundColor: ll.blue, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: ll.blueDeep, borderWidth: 3, borderColor: 'transparent', ...llShadow.soft,
  },
  optionText: { ...llType.h2, color: ll.white },
  hint: { borderColor: ll.amber },
  pressed: { transform: [{ scale: 0.95 }] },
});
