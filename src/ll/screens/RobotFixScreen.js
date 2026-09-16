import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/robotFixData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Robot Fix-It" — Basic Grammar (Grade 1).
//
// A robot reads a sentence with one broken word. Find it, then repair it.
//
// The teaching device is the two-phase repair itself, so the screen makes
// the phases physically different: in FIND, the words sit on a paper strip
// and every one is tappable; in FIX, the broken word is lifted out, leaving
// a visible socket in the sentence, and the replacement parts are laid out
// as spare components. A child sees a gap that needs filling rather than a
// second multiple-choice question.
//
// The robot is built rather than an emoji, because it's the game's teacher:
// antenna, a screen face whose expression changes per phase (scanning eyes,
// then a smile), and a body panel that lights green when the sentence is
// repaired. Its speech bubble delivers the rule at the end — that sentence
// is the actual lesson, and it deserves more than a caption.
export default function RobotFixScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-grammar', subjectId: 'English', standardId: 'Grade 1', title: 'Basic Grammar' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [phase, setPhase] = useState('find'); // find → fix → done
  const scan = useRef(new Animated.Value(0)).current;
  const spark = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPhase('find');
    spark.setValue(0);
    flow.say(`Beep boop! ${round.sentence} One word is broken. Can you find it?`);
  }, [flow.index]);

  // The robot's eyes scan while there's still something to find.
  useEffect(() => {
    if (phase === 'done') {
      scan.stopAnimation();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // ---------------------------------------------------------------------
  // Unchanged repair logic.
  function tapWord(i) {
    if (phase !== 'find') return;
    if (i === round.wrong) {
      setPhase('fix');
      flow.cheer(`Yes! ${round.words[i]} is broken. Which word fixes it?`);
    } else {
      flow.missOn(`w${i}`, `${round.words[i]} is fine. Find the broken word.`);
    }
  }

  function pickFix(option) {
    if (phase !== 'fix') return;
    if (option === round.fix) {
      setPhase('done');
      Animated.spring(spark, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }).start();
      flow.succeed(`${round.rule} ${round.fixedSentence}`, { hold: 2400 });
    } else {
      flow.missOn(`o${option}`, `${option} doesn't fix it. Try another word.`);
    }
  }
  // ---------------------------------------------------------------------

  const heading = phase === 'find' ? 'Tap the broken word' : phase === 'fix' ? 'Pick the right word' : 'Fixed!';
  const compact = width < 360;
  const eyeShift = scan.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  const sparkScale = spark.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt={heading}>
      {/* THE ROBOT ------------------------------------------------------- */}
      <View style={styles.robotRow}>
        <View style={styles.robotWrap}>
          <View style={styles.antenna} pointerEvents="none">
            <View style={[styles.antennaBulb, phase === 'done' && styles.antennaBulbOn]} />
            <View style={styles.antennaStem} />
          </View>

          <View style={styles.robotCast}>
            <LinearGradient colors={['#DCE8FF', '#B9CFF5']} style={styles.robotBody}>
              <Sheen variant="tile" radius={llRadius.md} />
              {/* Face screen. */}
              <View style={styles.face}>
                {phase === 'done' ? (
                  <>
                    <View style={styles.eyesHappy}>
                      <Text style={styles.eyeHappy}>^</Text>
                      <Text style={styles.eyeHappy}>^</Text>
                    </View>
                    <View style={styles.mouthHappy} />
                  </>
                ) : (
                  <Animated.View style={[styles.eyes, { transform: [{ translateX: eyeShift }] }]}>
                    <View style={styles.eye} />
                    <View style={styles.eye} />
                  </Animated.View>
                )}
              </View>
              {/* Chest panel: a status light per phase. */}
              <View style={styles.panel}>
                <View style={[styles.led, phase !== 'find' && styles.ledOn]} />
                <View style={[styles.led, phase === 'done' && styles.ledOn]} />
                <View style={[styles.ledBar, phase === 'done' && styles.ledBarOn]} />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Speech bubble — carries the rule at the end. */}
        <View style={styles.bubbleCast}>
          <LinearGradient
            colors={phase === 'done' ? ['#EFFAF3', '#DDF2E6'] : llSurface.whiteBlue}
            style={[styles.bubble, phase === 'done' && styles.bubbleDone, llRing.light]}
          >
            <TopHighlight radius={llRadius.lg} />
            {phase === 'done' ? <Text style={styles.ruleLabel}>ROBOT'S RULE</Text> : null}
            <Text style={[styles.bubbleText, phase === 'done' && styles.bubbleTextDone]}>
              {phase === 'done' ? round.rule : 'Beep! One word is broken.'}
            </Text>
          </LinearGradient>
          <View style={[styles.tail, phase === 'done' && styles.tailDone]} pointerEvents="none" />
        </View>
      </View>

      {/* THE SENTENCE STRIP --------------------------------------------- */}
      <View style={styles.stripCast}>
        <LinearGradient colors={['#FFFFFF', '#FBF8FF']} style={[styles.sentence, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          {/* Ruled line under the words — it's a sentence on paper. */}
          <View style={styles.ruleLine} pointerEvents="none" />

          {round.words.map((word, i) => {
            const isTarget = i === round.wrong;
            const lifted = isTarget && phase === 'fix';
            const shown = isTarget && phase === 'done' ? round.fix : word;

            // In FIX the broken word is lifted out, leaving a socket.
            if (lifted) {
              return (
                <View key={`${flow.index}-${i}`} style={styles.socket}>
                  <Text style={styles.socketMark}>?</Text>
                </View>
              );
            }

            const cell = (
              <Choice
                key={`${flow.index}-${i}`}
                flow={flow}
                id={`w${i}`}
                isAnswer={phase === 'find' && isTarget}
                done={isTarget && phase === 'done'}
                disabled={phase !== 'find'}
                onPress={() => tapWord(i)}
                style={[styles.word, compact && { paddingHorizontal: 8 }]}
              >
                <Text style={[styles.wordText, isTarget && phase === 'done' && styles.wordFixed]}>{shown}</Text>
              </Choice>
            );

            return isTarget && phase === 'done'
              ? <Pop key={`${flow.index}-${i}`} from={0.5}>{cell}</Pop>
              : cell;
          })}
        </LinearGradient>
      </View>

      {/* SPARE PARTS ----------------------------------------------------- */}
      {phase === 'fix' ? (
        <View style={styles.partsWrap}>
          <Text style={styles.partsLabel}>SPARE PARTS</Text>
          <View style={styles.options}>
            {round.options.map((option) => (
              <Choice
                key={option}
                flow={flow}
                id={`o${option}`}
                isAnswer={option === round.fix}
                onPress={() => pickFix(option)}
                style={styles.option}
              >
                <Text style={styles.wordText}>{option}</Text>
                {/* Two bolts, so the option reads as a machine part. */}
                <View style={styles.bolts} pointerEvents="none">
                  <View style={styles.bolt} />
                  <View style={styles.bolt} />
                </View>
              </Choice>
            ))}
          </View>
        </View>
      ) : null}

      {phase === 'done' ? (
        <Animated.View style={[styles.fixedBanner, { transform: [{ scale: sparkScale }] }]}>
          <LinearGradient colors={[ll.greenLight, ll.greenDeep]} style={styles.fixedInner}>
            <Sheen variant="tile" radius={llRadius.pill} />
            <Text style={styles.fixedText}>✓ {round.fixedSentence}</Text>
          </LinearGradient>
        </Animated.View>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  robotRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, alignSelf: 'stretch' },

  robotWrap: { alignItems: 'center' },
  antenna: { alignItems: 'center', marginBottom: -2 },
  antennaBulb: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: withAlpha(ll.pink, 0.5),
  },
  antennaBulbOn: {
    backgroundColor: ll.green,
    shadowColor: ll.green, shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 },
  },
  antennaStem: { width: 2, height: 9, backgroundColor: '#8FA8D6' },
  robotCast: {
    borderRadius: llRadius.md,
    shadowColor: '#3E6FD6', shadowOpacity: 0.3, shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  robotBody: {
    width: 62, paddingVertical: 8, paddingHorizontal: 7, borderRadius: llRadius.md,
    alignItems: 'center', gap: 6, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
  },
  face: {
    width: 44, height: 30, borderRadius: 8, backgroundColor: '#2E3A5C',
    alignItems: 'center', justifyContent: 'center',
  },
  eyes: { flexDirection: 'row', gap: 9 },
  eye: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#7FE3F5' },
  eyesHappy: { flexDirection: 'row', gap: 8 },
  eyeHappy: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, lineHeight: 15, color: '#7FE3F5' },
  mouthHappy: {
    width: 16, height: 7, marginTop: 2,
    borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#7FE3F5',
    borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
  },
  panel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  led: { width: 6, height: 6, borderRadius: 3, backgroundColor: withAlpha('#2E3A5C', 0.25) },
  ledOn: { backgroundColor: ll.amber },
  ledBar: { width: 16, height: 5, borderRadius: 3, backgroundColor: withAlpha('#2E3A5C', 0.2) },
  ledBarOn: { backgroundColor: ll.green },

  bubbleCast: { flex: 1 },
  bubble: {
    borderRadius: llRadius.lg, padding: 12, overflow: 'hidden',
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  bubbleDone: { borderColor: ll.greenLight },
  tail: {
    position: 'absolute', left: -5, top: 18, width: 10, height: 10,
    backgroundColor: '#F5F9FF', transform: [{ rotate: '45deg' }],
  },
  tailDone: { backgroundColor: '#EFFAF3' },
  ruleLabel: { ...llType.eyebrow, color: ll.greenDeep, marginBottom: 3 },
  bubbleText: { ...llType.body, color: ll.blueInk },
  bubbleTextDone: { color: '#2C7A55', fontFamily: 'Nunito_800ExtraBold' },

  stripCast: {
    alignSelf: 'stretch', marginTop: 22, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  sentence: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
    gap: 7, padding: 16, borderRadius: llRadius.xl, overflow: 'hidden',
  },
  ruleLine: {
    position: 'absolute', left: 14, right: 14, bottom: 12, height: 1,
    backgroundColor: withAlpha(ll.pink, 0.16),
  },
  word: { minWidth: 0, minHeight: 48, paddingHorizontal: 10 },
  wordText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  wordFixed: { color: ll.greenDeep },
  socket: {
    minWidth: 64, height: 48, borderRadius: llRadius.lg,
    borderWidth: 3, borderStyle: 'dashed', borderColor: ll.pink,
    backgroundColor: withAlpha(ll.pink, 0.1),
    alignItems: 'center', justifyContent: 'center',
  },
  socketMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: withAlpha(ll.pinkDeep, 0.65) },

  partsWrap: { alignItems: 'center', marginTop: 22 },
  partsLabel: { ...llType.eyebrow, color: ll.pinkDeep, marginBottom: 9, opacity: 0.8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  option: { minWidth: 96, paddingBottom: 14 },
  bolts: { position: 'absolute', bottom: 5, flexDirection: 'row', gap: 22 },
  bolt: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: withAlpha('#6054BE', 0.28),
  },

  fixedBanner: { marginTop: 20, borderRadius: llRadius.pill },
  fixedInner: {
    borderRadius: llRadius.pill, paddingVertical: 9, paddingHorizontal: 18, overflow: 'hidden',
  },
  fixedText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.white, textAlign: 'center',
    textShadowColor: 'rgba(20,60,40,0.28)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
});
