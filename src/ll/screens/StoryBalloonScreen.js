import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Floating } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/storyBalloonData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Story Balloon Pop" — Vocabulary from Stories (Senior KG).
//
// A story sentence with one word missing and three word balloons drifting
// above it. Popping the right balloon drops its word into the blank; a wrong
// one wobbles and stays up.
//
// The pop is the reward, so it's built properly: the balloon inflates for a
// beat, bursts into six rubber shards that fly outward, and the word itself
// travels down into the blank rather than appearing there. A child should
// want to pop the next one.
//
// The blank is a real gap in a real card — ruled paper, a story eyebrow, and
// the sentence set at reading size. The card reads as a page from a book,
// which is what the topic is about.
export default function StoryBalloonScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-en-vocab', subjectId: 'English', standardId: 'Senior KG', title: 'Vocabulary from Stories' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [popped, setPopped] = useState(null);
  const [wrongWord, setWrongWord] = useState(null);
  const pop = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  // The word falling from the burst balloon into the blank.
  const drop = useRef(new Animated.Value(0)).current;

  const tail = round.after === '.' ? '.' : ` ${round.after}`;

  useEffect(() => {
    setPopped(null);
    setWrongWord(null);
    pop.setValue(0);
    fill.setValue(0);
    drop.setValue(0);
    flow.say(`${round.before} blank${tail}`);
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged round logic. The extra `drop` animation runs alongside.
  function handleTap(word) {
    if (flow.isProcessing || popped) return;
    if (word === round.answer) {
      setPopped(word);
      Animated.parallel([
        Animated.timing(pop, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(fill, { toValue: 1, friction: 5, tension: 120, delay: 180, useNativeDriver: true }),
        Animated.timing(drop, { toValue: 1, duration: 520, delay: 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
      flow.succeed(`${round.before} ${round.answer.toLowerCase()}${tail}`, { hold: 1700 });
    } else {
      setWrongWord(word);
      flow.miss(`Hmm, ${word.toLowerCase()} doesn't fit. Try again!`);
      flow.later(() => setWrongWord(null), 420);
    }
  }
  // ---------------------------------------------------------------------

  const fillScale = fill.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const compact = width < 360;
  const balloonW = compact ? 92 : 104;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Pop the word that finishes the story!">
      <View style={[styles.sky, { height: compact ? 190 : 212 }]}>
        {round.balloons.map((b, i) => {
          const isPopped = popped === b.word;
          const isWrong = wrongWord === b.word;
          const isHint = flow.hinting && b.word === round.answer && !popped;

          // Inflate, then vanish — the balloon gets bigger before it goes.
          const popStyle = isPopped
            ? {
                opacity: pop.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1, 0] }),
                transform: [{ scale: pop.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 1.22, 1.7] }) }],
              }
            : null;

          return (
            <Floating
              key={`${flow.index}-${b.word}`}
              distance={14}
              rotate={3}
              duration={b.duration}
              delay={b.delay}
              style={i === 1 ? styles.middle : null}
            >
              <View style={styles.balloonSlot}>
                <Animated.View style={[popStyle, isWrong && { transform: [{ translateX: flow.shakeX }] }]}>
                  <Pressable
                    onPress={() => handleTap(b.word)}
                    disabled={flow.isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel={b.word}
                    style={({ pressed }) => [styles.balloonHit, pressed && !flow.isProcessing && { transform: [{ scale: 0.96 }] }]}
                  >
                    <View style={[styles.balloonCast, { shadowColor: b.color }, isHint && styles.balloonCastHint]}>
                      <LinearGradient
                        colors={[withAlpha('#FFFFFF', 0.5), b.color, b.color]}
                        locations={[0, 0.42, 1]}
                        start={{ x: 0.25, y: 0 }}
                        end={{ x: 0.75, y: 1 }}
                        style={[styles.balloon, { width: balloonW, height: balloonW * 1.2 }, isHint && styles.hint]}
                      >
                        {/* Two highlights: a hard specular and a soft sheen. */}
                        <View style={styles.shine} pointerEvents="none" />
                        <View style={styles.shineSoft} pointerEvents="none" />
                        <Text style={styles.balloonWord} numberOfLines={1} adjustsFontSizeToFit>{b.word}</Text>
                      </LinearGradient>
                    </View>
                    {/* Knot, then a slightly curved string. */}
                    <View style={[styles.knot, { borderBottomColor: b.color }]} />
                    <View style={styles.string} />
                    <View style={styles.stringCurl} />
                  </Pressable>
                </Animated.View>

                {/* Rubber shards. Mounted only for the popped balloon. */}
                {isPopped ? <Burst color={b.color} progress={pop} /> : null}

                {/* The word travelling down toward the blank. */}
                {isPopped ? (
                  <Animated.Text
                    style={[
                      styles.flyWord,
                      {
                        opacity: drop.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                        transform: [
                          { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [0, compact ? 150 : 172] }) },
                          { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }) },
                        ],
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {b.word.toLowerCase()}
                  </Animated.Text>
                ) : null}
              </View>
            </Floating>
          );
        })}
      </View>

      {/* THE STORY PAGE --------------------------------------------------- */}
      <View style={styles.storyCast}>
        <LinearGradient colors={llSurface.whitePink} style={[styles.storyCard, llRing.faint]}>
          <TopHighlight radius={llRadius.xxl} />
          <Sheen variant="tile" radius={llRadius.xxl} />

          {/* Ruled lines, so the card reads as a page. */}
          <View style={styles.rules} pointerEvents="none">
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.rule} />
            ))}
          </View>

          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowPill}>
              <Text style={styles.storyEyebrow}>STORY TIME</Text>
            </View>
            <Pressable
              onPress={() => flow.say(`${round.before} blank${tail}`)}
              accessibilityRole="button"
              accessibilityLabel="Hear the story again"
              style={styles.hearChip}
            >
              <Text style={styles.hearText}>🔊 Again</Text>
            </Pressable>
          </View>

          <Text style={styles.sentence}>
            {round.before}{' '}
            {popped
              ? <Text style={styles.filledInline}>{popped.toLowerCase()}</Text>
              : <Text style={styles.blank}>______</Text>}
            {tail}
          </Text>

          {popped ? (
            <Animated.View style={[styles.tickWrap, { opacity: fill, transform: [{ scale: fillScale }] }]}>
              <LinearGradient colors={[ll.greenLight, ll.greenDeep]} style={styles.tick}>
                <Sheen variant="tile" radius={llRadius.pill} />
                <Text style={styles.tickText}>✓ It makes sense!</Text>
              </LinearGradient>
            </Animated.View>
          ) : null}
        </LinearGradient>
      </View>
    </GameFrame>
  );
}

// Six rubber shards flying out from a burst balloon.
function Burst({ color, progress }) {
  const shards = [
    { x: -34, y: -26, r: '-40deg' }, { x: 32, y: -30, r: '35deg' },
    { x: -40, y: 10, r: '-70deg' }, { x: 38, y: 14, r: '65deg' },
    { x: -14, y: -44, r: '-15deg' }, { x: 18, y: 34, r: '110deg' },
  ];
  return (
    <View style={styles.burst} pointerEvents="none">
      {shards.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.95, 0] }),
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, s.x] }) },
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, s.y] }) },
              { rotate: s.r },
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
            ],
          }}
        >
          <View style={[styles.shard, { backgroundColor: color }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 10 },
  middle: { marginTop: 34 },
  balloonSlot: { alignItems: 'center' },
  balloonHit: { alignItems: 'center' },

  balloonCast: {
    borderRadius: 60,
    shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 7,
  },
  balloonCastHint: { shadowColor: ll.amber, shadowOpacity: 0.75, shadowRadius: 24 },
  balloon: {
    borderRadius: 60, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, overflow: 'hidden',
  },
  shine: {
    position: 'absolute', top: 16, left: 20, width: 18, height: 28, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.55)', transform: [{ rotate: '25deg' }],
  },
  shineSoft: {
    position: 'absolute', top: 12, left: 12, width: 44, height: 52, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)', transform: [{ rotate: '20deg' }],
  },
  balloonWord: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.white, textAlign: 'center',
    textShadowColor: 'rgba(20,10,60,0.28)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 },
  },
  knot: {
    width: 0, height: 0, marginTop: -2,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  string: { width: 2, height: 34, backgroundColor: 'rgba(46,42,99,0.25)' },
  stringCurl: {
    width: 14, height: 14, borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: 'rgba(46,42,99,0.25)', borderBottomLeftRadius: 10, marginLeft: -12, marginTop: -2,
  },

  burst: { position: 'absolute', top: 58, alignItems: 'center', justifyContent: 'center' },
  shard: { width: 13, height: 8, borderRadius: 4 },

  flyWord: {
    position: 'absolute', top: 52,
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.greenDeep,
  },

  storyCast: {
    alignSelf: 'stretch', marginTop: 10, borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 }, elevation: 10,
  },
  storyCard: {
    borderRadius: llRadius.xxl, paddingVertical: 20, paddingHorizontal: 20,
    alignItems: 'center', overflow: 'hidden',
  },
  rules: { position: 'absolute', left: 18, right: 18, top: 64, gap: 30 },
  rule: { height: 1, backgroundColor: withAlpha(ll.pink, 0.14) },

  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrowPill: {
    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99,
    backgroundColor: withAlpha(ll.pink, 0.14),
  },
  storyEyebrow: { ...llType.eyebrow, color: ll.pinkDeep },
  hearChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: withAlpha(ll.blue, 0.12),
  },
  hearText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: ll.blueDeep, letterSpacing: 0.6 },

  sentence: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 32,
    color: ll.ink, textAlign: 'center',
  },
  blank: { color: ll.pink },
  filledInline: { color: ll.greenDeep, textDecorationLine: 'underline' },

  tickWrap: { marginTop: 12, borderRadius: llRadius.pill },
  tick: {
    borderRadius: llRadius.pill, paddingHorizontal: 16, paddingVertical: 6, overflow: 'hidden',
  },
  tickText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.25)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  hint: { borderWidth: 4, borderColor: ll.amber },
});
