import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Floating } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/storyBalloonData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Story Balloon Pop" — Vocabulary from Stories (Senior KG).
//
// A story sentence with one word missing and three word balloons floating
// above it. Popping the right balloon drops its word into the blank; the
// wrong one wobbles and stays. The sentence is read aloud with "blank" in
// the gap, so a child who can't read every word still has the meaning.
export default function StoryBalloonScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-en-vocab', subjectId: 'English', standardId: 'Senior KG', title: 'Vocabulary from Stories' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [popped, setPopped] = useState(null);
  const [wrongWord, setWrongWord] = useState(null);
  const pop = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;

  const tail = round.after === '.' ? '.' : ` ${round.after}`;

  useEffect(() => {
    setPopped(null);
    setWrongWord(null);
    pop.setValue(0);
    fill.setValue(0);
    flow.say(`${round.before} blank${tail}`);
  }, [flow.index]);

  function handleTap(word) {
    if (flow.isProcessing || popped) return;
    if (word === round.answer) {
      setPopped(word);
      Animated.parallel([
        Animated.timing(pop, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(fill, { toValue: 1, friction: 5, tension: 120, delay: 180, useNativeDriver: true }),
      ]).start();
      flow.succeed(`${round.before} ${round.answer.toLowerCase()}${tail}`, { hold: 1700 });
    } else {
      setWrongWord(word);
      flow.miss(`Hmm, ${word.toLowerCase()} doesn't fit. Try again!`);
      flow.later(() => setWrongWord(null), 420);
    }
  }

  const fillScale = fill.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Pop the word that finishes the story!">
      <View style={styles.sky}>
        {round.balloons.map((b, i) => {
          const isPopped = popped === b.word;
          const isWrong = wrongWord === b.word;
          const isHint = flow.hinting && b.word === round.answer && !popped;
          const popStyle = isPopped
            ? { opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }] }
            : null;
          return (
            <Floating key={`${flow.index}-${b.word}`} distance={14} rotate={3} duration={b.duration} delay={b.delay} style={i === 1 ? styles.middle : null}>
              <Animated.View style={[popStyle, isWrong && { transform: [{ translateX: flow.shakeX }] }]}>
                <Pressable
                  onPress={() => handleTap(b.word)}
                  disabled={flow.isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={b.word}
                  style={styles.balloonHit}
                >
                  <View style={[styles.balloon, { backgroundColor: b.color }, isHint && styles.hint]}>
                    <View style={styles.shine} />
                    <Text style={styles.balloonWord} numberOfLines={1} adjustsFontSizeToFit>{b.word}</Text>
                  </View>
                  <View style={[styles.knot, { borderBottomColor: b.color }]} />
                  <View style={styles.string} />
                </Pressable>
              </Animated.View>
            </Floating>
          );
        })}
      </View>

      <View style={styles.storyCard}>
        <Text style={styles.storyEyebrow}>STORY TIME</Text>
        <Text style={styles.sentence}>
          {round.before}{' '}
          {popped
            ? <Text style={styles.filledInline}>{popped.toLowerCase()}</Text>
            : <Text style={styles.blank}>______</Text>}
          {tail}
        </Text>
        {popped ? (
          <Animated.View style={[styles.tick, { opacity: fill, transform: [{ scale: fillScale }] }]}>
            <Text style={styles.tickText}>✓ It makes sense!</Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  sky: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 10, height: 210 },
  middle: { marginTop: 34 },
  balloonHit: { alignItems: 'center' },
  balloon: {
    width: 104, height: 124, borderRadius: 52, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8, ...llShadow.soft,
  },
  shine: {
    position: 'absolute', top: 16, left: 20, width: 18, height: 28, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ rotate: '25deg' }],
  },
  balloonWord: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.white, textAlign: 'center' },
  // A small triangle tie under the balloon, same colour as the body.
  knot: {
    width: 0, height: 0, marginTop: -2,
    borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  string: { width: 2, height: 44, backgroundColor: 'rgba(46,42,99,0.25)' },
  hint: { borderWidth: 4, borderColor: ll.amber },

  storyCard: {
    alignSelf: 'stretch', backgroundColor: ll.white, borderRadius: llRadius.xxl, padding: 20, marginTop: 10,
    alignItems: 'center', ...llShadow.card,
  },
  storyEyebrow: { ...llType.eyebrow, color: ll.pinkDeep, marginBottom: 8 },
  sentence: { fontFamily: 'Nunito_800ExtraBold', fontSize: 21, lineHeight: 32, color: ll.ink, textAlign: 'center' },
  blank: { color: ll.pink },
  filledInline: { color: ll.greenDeep, textDecorationLine: 'underline' },
  tick: {
    marginTop: 12, backgroundColor: ll.green, borderRadius: llRadius.pill, paddingHorizontal: 16, paddingVertical: 5,
  },
  tickText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.white },
});
