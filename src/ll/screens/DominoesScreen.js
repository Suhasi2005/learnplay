import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/dominoData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Equation Dominoes" — Addition & Subtraction up to 20 (Grade 1).
//
// Attach the domino showing the answer; its other half carries the next sum,
// which starts from that answer. Three links make a chain, so one slip
// carries forward the way it would on paper.
//
// The teaching device is the carry itself. When a domino attaches, its answer
// half and the next domino's first number are the *same number in the same
// place* — so both are drawn in green, joined by a visible coupling stud.
// A child who can see that "13" leaves one tile and enters the next
// understands why the chain is a chain rather than three unrelated sums.
//
// Dominoes are also real dominoes now: ivory faces, a pressed centre line,
// rounded pips of thickness, and a stud where two tiles meet.
const sign = (op) => (op === '+' ? '+' : '−');
const word = (op) => (op === '+' ? 'plus' : 'take away');

// A domino tile. `carry` marks the half that continues the chain.
function Domino({ left, right, tone = 'ivory', carryLeft = false, compact = false }) {
  const faces = {
    ivory: ['#FFFEFA', '#F3EEE2'],
    done: ['#F2FBF6', '#DDF2E6'],
    start: ['#EFF5FF', '#DFEAFF'],
  };
  const edge = { ivory: '#D9D0BC', done: ll.greenLight, start: '#BDD3F5' };

  return (
    <View style={[styles.dominoCast, tone === 'done' && styles.dominoCastDone]}>
      <LinearGradient
        colors={faces[tone]}
        style={[styles.domino, { height: compact ? 46 : 52, borderColor: edge[tone] }]}
      >
        <Sheen variant="tile" radius={10} />
        <TopHighlight radius={10} />

        <View style={styles.half}>
          <Text style={[styles.halfText, carryLeft && styles.carryText, compact && { fontSize: 16 }]}>{left}</Text>
        </View>

        {/* The pressed centre line: two hairlines, not one stroke. */}
        <View style={styles.spine} pointerEvents="none">
          <View style={styles.spineDark} />
          <View style={styles.spineLight} />
        </View>

        <View style={styles.half}>
          <Text style={[styles.halfText, compact && { fontSize: 16 }]}>{right}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function DominoesScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-addsub20', subjectId: 'Math', standardId: 'Grade 1', title: 'Addition & Subtraction up to 20' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [link, setLink] = useState(0);
  const current = round.links[link];
  const nudge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLink(0);
    const first = round.links[0];
    flow.say(`${first.a} ${word(first.op)} ${first.b}. Find the domino.`);
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged chain logic.
  function pick(n) {
    if (!current) return;
    if (n === current.answer) {
      const next = round.links[link + 1];
      setLink(link + 1);
      // The chain shunts along as a tile locks on.
      Animated.sequence([
        Animated.timing(nudge, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(nudge, { toValue: 0, friction: 4, tension: 140, useNativeDriver: true }),
      ]).start();
      if (!next) flow.succeed(`${current.a} ${word(current.op)} ${current.b} is ${n}. Chain complete!`, { hold: 1600 });
      else flow.cheer(`${n}! Now ${next.a} ${word(next.op)} ${next.b}.`);
    } else {
      flow.missOn(`${link}-${n}`, `Not ${n}. Work out ${current.a} ${word(current.op)} ${current.b} again.`);
    }
  }
  // ---------------------------------------------------------------------

  const eq = (l) => `${l.a}${sign(l.op)}${l.b}`;
  const compact = width < 360;
  const shunt = nudge.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Attach the domino with the answer">
      {/* THE CHAIN ------------------------------------------------------- */}
      <Animated.View style={[styles.chain, { transform: [{ translateX: shunt }] }]}>
        <Domino left="▶" right={eq(round.links[0])} tone="start" compact={compact} />
        {round.links.slice(0, link).map((l, k) => (
          <View key={k} style={styles.chainLink}>
            {/* The coupling stud where two tiles meet. */}
            <View style={styles.stud} pointerEvents="none" />
            <Pop from={0.5}>
              <Domino
                left={l.answer}
                right={round.links[k + 1] ? eq(round.links[k + 1]) : '🏁'}
                tone="done"
                carryLeft
                compact={compact}
              />
            </Pop>
          </View>
        ))}
        {/* The open end, so the chain visibly wants another tile. */}
        {current ? <View style={[styles.openEnd, { height: compact ? 46 : 52 }]} /> : null}
      </Animated.View>

      {current ? (
        <>
          {/* THE SUM — the carried number picked out. -------------------- */}
          <View style={styles.questionCast}>
            <LinearGradient colors={llSurface.whiteBlue} style={[styles.questionPlate, llRing.faint]}>
              <TopHighlight radius={llRadius.pill} />
              <Text style={styles.question}>
                <Text style={link > 0 ? styles.carried : null}>{current.a}</Text>
                {` ${sign(current.op)} ${current.b} = `}
                <Text style={styles.qMark}>?</Text>
              </Text>
            </LinearGradient>
            {link > 0 ? <Text style={styles.carryNote}>{current.a} came from the last domino</Text> : null}
          </View>

          <View style={styles.options}>
            {current.options.map((n) => (
              <Choice
                key={`${link}-${n}`}
                flow={flow}
                id={`${link}-${n}`}
                isAnswer={n === current.answer}
                onPress={() => pick(n)}
                style={styles.option}
                accessibilityLabel={`${n}`}
              >
                <Domino left={n} right="" compact={compact} />
              </Choice>
            ))}
          </View>
        </>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  chain: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    alignItems: 'center', gap: 4, alignSelf: 'stretch',
  },
  chainLink: { flexDirection: 'row', alignItems: 'center' },
  stud: {
    width: 7, height: 7, borderRadius: 4, marginRight: -2, zIndex: 2,
    backgroundColor: withAlpha(ll.greenDeep, 0.55),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  openEnd: {
    width: 26, borderRadius: 8, marginLeft: 2,
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha(ll.blue, 0.45),
    backgroundColor: withAlpha(ll.blue, 0.06),
  },

  dominoCast: {
    borderRadius: 10,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  dominoCastDone: { shadowColor: ll.greenDeep, shadowOpacity: 0.3, shadowRadius: 14 },
  domino: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10,
    borderWidth: 2, paddingHorizontal: 4, overflow: 'hidden',
    borderBottomWidth: 4, borderBottomColor: withAlpha('#8A7F66', 0.45),
  },
  half: { minWidth: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  halfText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink, textAlign: 'center' },
  carryText: { color: ll.greenDeep },
  spine: { width: 3, alignSelf: 'stretch', flexDirection: 'row', marginVertical: 7 },
  spineDark: { width: 1.5, backgroundColor: withAlpha('#2E2A63', 0.3) },
  spineLight: { width: 1.5, backgroundColor: 'rgba(255,255,255,0.8)' },

  questionCast: { marginTop: 28, alignItems: 'center' },
  questionPlate: {
    borderRadius: llRadius.pill, paddingVertical: 8, paddingHorizontal: 26, overflow: 'hidden',
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  question: { ...llType.h1, color: ll.ink },
  carried: { color: ll.greenDeep },
  qMark: { color: ll.blue },
  carryNote: {
    marginTop: 7, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.1, color: ll.greenDeep, textTransform: 'uppercase', opacity: 0.85,
  },

  options: { flexDirection: 'row', gap: 12, marginTop: 22 },
  option: { padding: 6, borderRadius: llRadius.md },
});
