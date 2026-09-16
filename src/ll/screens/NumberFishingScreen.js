import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/numberFishingData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Number Fishing" — Numbers 1 to 9 (Grade 1).
//
// Catch the fish whose number matches: a counted group, a number word, one
// more, or one less. The fish swim in a pond; a caught one comes up on a line
// with a splash.
//
// The teaching device is the number line along the pond floor. On "one more"
// and "one less" rounds it shows the starting number with an arrow pointing
// the way to move — because the usual mistake, which numberFishingData plants
// deliberately by putting the starting number in the pond, is catching the
// number you *heard* rather than the one you were asked for. Seeing "6" with
// an arrow pointing left makes the question directional instead of verbal.
export default function NumberFishingScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-num1to9', subjectId: 'Math', standardId: 'Grade 1', title: 'Numbers 1 to 9' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [caught, setCaught] = useState(null);
  const swim = useRef(new Animated.Value(0)).current;
  const prompt = promptFor(round);

  useEffect(() => {
    setCaught(null);
    flow.say(round.kind === 'count' ? 'How many shells? Catch that number.' : prompt);
  }, [flow.index]);

  // The whole pond drifts — fish are never quite still.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swim, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(swim, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged catch logic.
  function pick(fish) {
    if (caught) return;
    if (fish.number === round.answer) {
      setCaught(fish.id);
      flow.succeed(`You caught ${round.answer}!`);
    } else if (round.kind === 'count') {
      flow.missOn(fish.id, `That fish is ${fish.number}. Count the shells again.`);
    } else if (round.kind === 'word') {
      flow.missOn(fish.id, `That fish is ${fish.number}. Find ${round.word}.`);
    } else {
      flow.missOn(fish.id, `${fish.number} is not one ${round.kind} than ${round.n}.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const directional = round.kind === 'more' || round.kind === 'less';

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE CLUE -------------------------------------------------------- */}
      <View style={styles.clueCast}>
        <LinearGradient colors={llSurface.whiteBlue} style={[styles.clue, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          <Sheen variant="tile" radius={llRadius.xl} />

          {round.kind === 'count' ? (
            // Shells in rows of five — a counted group should be countable at
            // a glance, and fives are how we group.
            <View style={styles.shellGroup}>
              {[0, 1].map((row) => {
                const from = row * 5;
                const n = Math.max(0, Math.min(5, round.n - from));
                if (n === 0) return null;
                return (
                  <View key={row} style={styles.shellRow}>
                    {Array.from({ length: n }, (_, i) => (
                      <GameObject key={i} id="shell" emoji="🐚" size={18} style={styles.shell} />
                    ))}
                  </View>
                );
              })}
            </View>
          ) : round.kind === 'word' ? (
            <Text style={styles.clueWord}>{round.word}</Text>
          ) : (
            <Text style={styles.clueText}>{round.n} {round.kind === 'more' ? '+ 1' : '− 1'}</Text>
          )}
        </LinearGradient>
      </View>

      {/* THE POND -------------------------------------------------------- */}
      <View style={styles.pondCast}>
        <LinearGradient colors={['#CDE6FC', '#A7CEF6']} style={styles.pond}>
          {/* Water: light bands and a few bubbles. */}
          <Animated.View
            style={[
              styles.lightBand,
              { transform: [{ translateX: swim.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] }) }, { rotate: '14deg' }] },
            ]}
            pointerEvents="none"
          />
          <View style={[styles.bubble, { top: 18, left: 22, width: 8, height: 8 }]} pointerEvents="none" />
          <View style={[styles.bubble, { top: 34, left: 34, width: 5, height: 5 }]} pointerEvents="none" />
          <View style={[styles.bubble, { bottom: 44, right: 26, width: 7, height: 7 }]} pointerEvents="none" />

          <View style={styles.school}>
            {round.fish.map((fish, i) => {
              const isCaught = caught === fish.id;
              // Each fish drifts on its own phase.
              const drift = swim.interpolate({
                inputRange: [0, 1],
                outputRange: [i % 2 === 0 ? -5 : 5, i % 2 === 0 ? 5 : -5],
              });
              return (
                <Animated.View key={fish.id} style={{ transform: [{ translateY: isCaught ? 0 : drift }] }}>
                  {/* The line a caught fish comes up on. */}
                  {isCaught ? <View style={styles.line} pointerEvents="none" /> : null}

                  <Choice
                    flow={flow}
                    id={fish.id}
                    isAnswer={fish.number === round.answer}
                    done={isCaught}
                    onPress={() => pick(fish)}
                    style={[styles.fish, { width: compact ? 84 : 92, height: compact ? 96 : 104 }, !isCaught && { backgroundColor: fish.color }]}
                    accessibilityLabel={`fish number ${fish.number}`}
                  >
                    {/* Tail fin, so the body reads as a fish not a bubble. */}
                    <View style={[styles.tail, { borderRightColor: isCaught ? ll.greenLight : fish.color }]} pointerEvents="none" />
                    <View style={styles.eye} pointerEvents="none" />
                    <Text style={styles.fishEmoji}>{isCaught ? '🎣' : '🐟'}</Text>
                    <Text style={[styles.fishNumber, isCaught && { color: ll.greenDeep }]}>{fish.number}</Text>
                  </Choice>

                  {isCaught ? (
                    <Pop from={0.3} style={styles.splash}>
                      <Text style={styles.splashText}>💦</Text>
                    </Pop>
                  ) : null}
                </Animated.View>
              );
            })}
          </View>

          {/* THE NUMBER LINE — the pond floor, and the direction to move. */}
          <View style={styles.numberLine}>
            {Array.from({ length: 9 }, (_, i) => {
              const n = i + 1;
              const isStart = directional && n === round.n;
              const isTarget = caught && n === round.answer;
              return (
                <View key={n} style={[styles.tick, isStart && styles.tickStart, isTarget && styles.tickTarget]}>
                  <Text style={[styles.tickText, (isStart || isTarget) && styles.tickTextOn]}>{n}</Text>
                </View>
              );
            })}
          </View>
          {directional ? (
            <Text style={styles.lineHint}>
              {round.kind === 'more' ? `${round.n} → one step right` : `${round.n} ← one step left`}
            </Text>
          ) : null}
        </LinearGradient>
      </View>
    </GameFrame>
  );
}

function promptFor(r) {
  if (r.kind === 'count') return 'Catch the number that shows how many';
  if (r.kind === 'word') return `Catch the fish for "${r.word}"`;
  if (r.kind === 'more') return `Catch one more than ${r.n}`;
  return `Catch one less than ${r.n}`;
}

const styles = StyleSheet.create({
  clueCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 6,
  },
  clue: {
    minWidth: 190, minHeight: 96, paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  shellGroup: { gap: 2 },
  shellRow: { flexDirection: 'row', justifyContent: 'center' },
  shell: { fontSize: 28, lineHeight: 34, width: 32, textAlign: 'center' },
  clueText: { ...llType.h1, color: ll.ink },
  clueWord: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40, color: ll.blueDeep },

  pondCast: {
    alignSelf: 'stretch', marginTop: 22, borderRadius: llRadius.screen,
    shadowColor: '#3B6BA8', shadowOpacity: 0.26, shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 }, elevation: 9,
  },
  pond: {
    borderRadius: llRadius.screen, paddingVertical: 20, paddingHorizontal: 14,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 4, borderColor: '#92C0EC',
  },
  lightBand: {
    position: 'absolute', top: -20, bottom: -20, left: '28%', width: 80,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  bubble: { position: 'absolute', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.5)' },

  school: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  fish: { borderRadius: 46 },
  tail: {
    position: 'absolute', left: -13, top: '38%',
    width: 0, height: 0, backgroundColor: 'transparent',
    borderTopWidth: 11, borderBottomWidth: 11, borderRightWidth: 15,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
  },
  eye: {
    position: 'absolute', top: 20, right: 22, width: 7, height: 7, borderRadius: 4,
    backgroundColor: 'rgba(46,42,99,0.6)',
  },
  fishEmoji: { fontSize: 28 },
  fishNumber: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: ll.ink },
  line: {
    position: 'absolute', left: '50%', top: -34, width: 2, height: 34,
    backgroundColor: 'rgba(46,42,99,0.35)',
  },
  splash: { position: 'absolute', top: -14, right: -8 },
  splashText: { fontSize: 26 },

  numberLine: {
    flexDirection: 'row', gap: 4, marginTop: 18,
    paddingTop: 10, borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.55)',
  },
  tick: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  tickStart: { backgroundColor: withAlpha(ll.amber, 0.9) },
  tickTarget: { backgroundColor: ll.green },
  tickText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.blueInk },
  tickTextOn: { color: ll.white },
  lineHint: {
    marginTop: 7, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.2, color: ll.blueInk, opacity: 0.85,
  },
});
