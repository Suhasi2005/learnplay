import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import DragPiece from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/alphabetLadderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, withAlpha } from '../tokens';

// "Alphabet Ladder" — Alphabet Recognition (Grade 1).
//
// Five consecutive letters climb a ladder from the bottom rung up, one or two
// missing. The child carries a letter tile to the empty rung; the monkey
// climbs one rung with every letter placed, and reaching the top finishes the
// round. Progress is literally elevation.
//
// The teaching device is direction. The ladder is built bottom-to-top with an
// "A → Z" arrow running up its rail, and the monkey only ever climbs, so
// alphabetical order is a direction you move in rather than a list to recite.
// Later rounds switch to lowercase and plant mirror-image letters (b/d, p/q)
// among the options, so the tiles are drawn large with a baseline to make the
// difference between them a shape, not a guess.
export default function AlphabetLadderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-alphabet', subjectId: 'English', standardId: 'Grade 1', title: 'Alphabet Recognition' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);
  // Presentation-only.
  const [carried, setCarried] = useState(null);
  const rungPulse = useRef(new Animated.Value(0)).current;
  const climb = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setStep(0);
    setCarried(null);
    climb.setValue(0);
    flow.say('Which letter is missing on the ladder?');
  }, [flow.index]);

  // The empty rung glows while a tile is being carried up to it.
  useEffect(() => {
    if (carried === null) {
      rungPulse.stopAnimation();
      Animated.timing(rungPulse, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rungPulse, { toValue: 1, duration: 440, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(rungPulse, { toValue: 0, duration: 440, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [carried]);

  const current = round.steps[step];
  const hidden = round.steps.map((s) => s.pos);
  const solved = round.steps.slice(0, step).map((s) => s.pos);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(letter) {
    if (!current) return;
    if (letter === current.answer) {
      setStep(step + 1);
      // The monkey hops up as the rung fills.
      Animated.sequence([
        Animated.timing(climb, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(climb, { toValue: 0, friction: 5, tension: 140, useNativeDriver: true }),
      ]).start();
      if (step === round.steps.length - 1) flow.succeed(round.letters.join(', '));
      else flow.cheer(letter);
    } else {
      flow.missOn(letter, `Not ${letter}. Say the letters in order from the bottom.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const rungW = compact ? 106 : 124;
  const rungH = compact ? 42 : 46;
  const rungScale = rungPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const hop = climb.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Fill the missing letter">
      <View style={styles.scene}>
        {/* THE LADDER — bottom rung is 'A'-most, and the rail says so. --- */}
        <View style={styles.ladderWrap}>
          <View style={styles.ladder}>
            {/* Rails, with the A→Z direction marked going up. */}
            <LinearGradient colors={['#E7CBA4', '#C9A578']} style={styles.rail}>
              <View style={styles.railGrain} pointerEvents="none" />
            </LinearGradient>
            <LinearGradient colors={['#E7CBA4', '#C9A578']} style={[styles.rail, styles.railRight]}>
              <View style={styles.railGrain} pointerEvents="none" />
            </LinearGradient>

            <View style={[styles.rungs, { paddingHorizontal: 18 }]}>
              {round.letters.map((letter, pos) => {
                const isHidden = hidden.includes(pos) && !solved.includes(pos);
                const isCurrent = current?.pos === pos;
                const isSolved = solved.includes(pos);

                return (
                  <View key={pos} style={styles.rungRow}>
                    {/* The climber sits on the rung it's working on. */}
                    <Animated.Text
                      style={[
                        styles.climber,
                        compact && { marginLeft: -44, fontSize: 24 },
                        isCurrent ? { transform: [{ translateY: hop }] } : { opacity: 0 },
                      ]}
                    >
                      🐒
                    </Animated.Text>

                    {isHidden && isCurrent ? (
                      <Animated.View
                        style={[
                          styles.rungSocket,
                          { width: rungW, height: rungH },
                          carried !== null && styles.rungSocketArmed,
                          carried !== null && { transform: [{ scale: rungScale }] },
                        ]}
                      >
                        <Text style={[styles.socketMark, carried !== null && { color: ll.pinkDeep }]}>?</Text>
                      </Animated.View>
                    ) : (
                      <View style={[styles.rungCast, isSolved && styles.rungCastSolved]}>
                        <LinearGradient
                          colors={isSolved ? [ll.greenLight, ll.greenDeep] : isHidden ? ['#EFE4D2', '#DFCDB2'] : ['#EBD5B4', '#D6B78E']}
                          style={[styles.rung, { width: rungW, height: rungH }]}
                        >
                          <Sheen variant="tile" radius={llRadius.sm} />
                          <TopHighlight radius={llRadius.sm} />
                          <Text style={[styles.rungText, isSolved && styles.rungTextSolved, isHidden && styles.rungTextDim]}>
                            {isHidden ? '·' : letter}
                          </Text>
                          {/* Baseline: the cue that separates b from d. */}
                          {!isHidden ? <View style={styles.baseline} pointerEvents="none" /> : null}
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Direction marker beside the ladder. */}
          <View style={styles.dirWrap} pointerEvents="none">
            <Text style={styles.dirTop}>Z</Text>
            <View style={styles.dirArrow} />
            <Text style={styles.dirBottom}>A</Text>
          </View>
        </View>

        {/* THE LETTER TRAY --------------------------------------------- */}
        <View style={styles.options}>
          {(current?.options ?? []).map((letter) => {
            const isWrong = flow.wrongId === letter;
            const isHint = flow.hinting && letter === current.answer;
            return (
              <DragPiece
                key={`${step}-${letter}`}
                direction="up"
                threshold={40}
                disabled={flow.isProcessing}
                accessibilityLabel={letter}
                onLift={() => setCarried(letter)}
                onDrop={(placedNow) => {
                  setCarried(null);
                  if (placedNow) pick(letter);
                }}
              >
                <Animated.View style={isWrong ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
                  <View
                    style={[
                      styles.optionCast,
                      carried === letter && styles.optionCastLifted,
                      isHint && styles.optionCastHint,
                    ]}
                  >
                    <LinearGradient
                      colors={llSurface.whitePink}
                      style={[
                        styles.option,
                        { width: compact ? 72 : 80, height: compact ? 72 : 80 },
                        isHint ? styles.hint : llRing.faint,
                      ]}
                    >
                      <Sheen variant="tile" radius={llRadius.md} />
                      <TopHighlight radius={llRadius.md} />
                      <Text style={styles.optionText}>{letter}</Text>
                      {/* Same baseline as the rungs — b and d differ by where
                          the bowl sits relative to it. */}
                      <View style={styles.optionBaseline} pointerEvents="none" />
                    </LinearGradient>
                  </View>
                </Animated.View>
              </DragPiece>
            );
          })}
        </View>
        <Text style={styles.trayHint}>{carried !== null ? 'Drop it on the empty rung' : 'Drag a letter onto the ladder'}</Text>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  scene: { alignItems: 'center', alignSelf: 'stretch' },

  ladderWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ladder: { position: 'relative', paddingVertical: 12 },
  rail: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 11,
    borderRadius: 5, overflow: 'hidden',
  },
  railRight: { left: undefined, right: 0 },
  railGrain: {
    position: 'absolute', top: 0, bottom: 0, left: 4, width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  // column-reverse: the first letter sits on the bottom rung.
  rungs: { flexDirection: 'column-reverse', gap: 8 },
  rungRow: { flexDirection: 'row', alignItems: 'center' },
  climber: { width: 36, fontSize: 26, marginLeft: -52, textAlign: 'center' },

  rungCast: {
    borderRadius: llRadius.sm,
    shadowColor: '#8A6A3E', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  rungCastSolved: { shadowColor: ll.greenDeep, shadowOpacity: 0.4, shadowRadius: 14 },
  rung: {
    borderRadius: llRadius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  rungText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, lineHeight: 32, color: ll.ink,
  },
  rungTextSolved: {
    color: ll.white,
    textShadowColor: 'rgba(20,60,40,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  rungTextDim: { color: withAlpha('#8B86B8', 0.7) },
  baseline: {
    position: 'absolute', bottom: 8, left: '28%', right: '28%', height: 1.5,
    borderRadius: 2, backgroundColor: 'rgba(46,42,99,0.18)',
  },

  rungSocket: {
    borderRadius: llRadius.sm, borderWidth: 3, borderStyle: 'dashed', borderColor: ll.pink,
    backgroundColor: withAlpha(ll.pink, 0.1), alignItems: 'center', justifyContent: 'center',
  },
  rungSocketArmed: { borderColor: ll.pinkDeep, backgroundColor: withAlpha(ll.pink, 0.2) },
  socketMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: withAlpha(ll.pinkDeep, 0.6) },

  dirWrap: { alignItems: 'center', gap: 3 },
  dirTop: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: ll.pinkDeep },
  dirArrow: {
    width: 2, height: 64, backgroundColor: withAlpha(ll.pink, 0.4), borderRadius: 2,
  },
  dirBottom: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: ll.pinkDeep },

  options: { flexDirection: 'row', gap: 14, marginTop: 24 },
  optionCast: {
    borderRadius: llRadius.md,
    shadowColor: ll.pinkDeep, shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  optionCastLifted: { shadowOpacity: 0.5, shadowRadius: 26, shadowOffset: { width: 0, height: 18 }, elevation: 11 },
  optionCastHint: { shadowColor: ll.amber, shadowOpacity: 0.65, shadowRadius: 20 },
  option: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  optionText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 42, color: ll.ink },
  optionBaseline: {
    position: 'absolute', bottom: 12, left: '26%', right: '26%', height: 1.5,
    borderRadius: 2, backgroundColor: withAlpha(ll.pinkDeep, 0.28),
  },
  hint: { borderWidth: 3, borderColor: ll.amber },
  trayHint: {
    marginTop: 12, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.pinkDeep, textTransform: 'uppercase', opacity: 0.7,
  },
});
