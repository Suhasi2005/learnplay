import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Floating, Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/caterpillarData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Caterpillar Sentence" — Simple Sentence Formation (Grade 1).
//
// Fill each blank body segment to match the picture, then give the
// caterpillar its tail: a full stop for telling, a question mark for asking.
//
// The teaching device is the tail. Every wrong word in caterpillarData still
// makes a grammatical sentence — only the picture rules it out — so the real
// difficulty is the final choice, and it's the one children get wrong most.
// So the two tail options are labelled with what they *do*: "telling" under
// the full stop, "asking" under the question mark. Punctuation stops being
// two similar-looking marks and becomes a choice about the sentence's job.
//
// The caterpillar is also a caterpillar now: a face with antennae, segments
// that overlap slightly with little legs underneath, and a body that ripples
// forward each time a segment fills.
export default function CaterpillarScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-sentences', subjectId: 'English', standardId: 'Grade 1', title: 'Simple Sentence Formation' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);
  const [filled, setFilled] = useState({});
  const crawl = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setStep(0);
    setFilled({});
    flow.say('Make a sentence about the picture.');
  }, [flow.index]);

  const current = round.steps[step];

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(option) {
    if (!current) return;
    if (option === current.answer) {
      setFilled({ ...filled, [current.segId]: option });
      setStep(step + 1);
      // The body ripples forward — the caterpillar grew.
      Animated.sequence([
        Animated.timing(crawl, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(crawl, { toValue: 0, friction: 4, tension: 130, useNativeDriver: true }),
      ]).start();
      if (step === round.steps.length - 1) flow.succeed(round.sentence);
      else flow.cheer(option);
    } else if (current.kind === 'mark') {
      flow.missOn(option, round.mark === '?'
        ? 'This sentence is asking something, so it needs a question mark.'
        : 'This sentence is telling us something, so it ends with a full stop.');
    } else {
      flow.missOn(option, `Look at the picture. Is it about ${option}?`);
    }
  }
  // ---------------------------------------------------------------------

  const segText = (seg) => seg.text ?? filled[seg.id] ?? (current?.segId === seg.id ? '?' : '…');
  const compact = width < 360;
  const bob = crawl.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const isMarkStep = current?.kind === 'mark';

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Build a sentence about the picture">
      {/* THE PICTURE — tap to hear the sentence so far. ------------------ */}
      <Pressable
        onPress={() => flow.say('Make a sentence about the picture.')}
        accessibilityRole="button"
        accessibilityLabel="Hear the instruction again"
      >
        <Floating distance={7} duration={2800}>
          <View style={styles.pictureCast}>
            <LinearGradient colors={llSurface.whitePink} style={[styles.picture, llRing.faint]}>
              <Sheen variant="tile" radius={llRadius.xxl} />
              <TopHighlight radius={llRadius.xxl} />
              <GameObject emoji={round.emoji} size={52} />
            </LinearGradient>
          </View>
        </Floating>
      </Pressable>

      {/* THE CATERPILLAR ------------------------------------------------- */}
      <Animated.View style={[styles.body, { transform: [{ translateY: bob }] }]}>
        {/* Head: antennae, face, a cheek. */}
        <View style={styles.headWrap}>
          <View style={styles.antennae} pointerEvents="none">
            <View style={styles.antenna} />
            <View style={[styles.antenna, styles.antennaRight]} />
          </View>
          <View style={styles.headCast}>
            <LinearGradient colors={['#A8E6BF', '#4FAE7B']} style={styles.head}>
              <Sheen variant="tile" radius={24} />
              <View style={styles.eyes}>
                <View style={styles.eye}><View style={styles.pupil} /></View>
                <View style={styles.eye}><View style={styles.pupil} /></View>
              </View>
              <View style={styles.smile} pointerEvents="none" />
            </LinearGradient>
          </View>
        </View>

        {round.segments.map((seg, i) => {
          const isCurrent = current?.segId === seg.id;
          const isDone = !!filled[seg.id];
          const isFixed = !!seg.text;
          return (
            <View key={seg.id} style={styles.segWrap}>
              {isDone ? (
                <Pop from={0.5}>
                  <Segment text={segText(seg)} tone="done" compact={compact} />
                </Pop>
              ) : (
                <Segment
                  text={segText(seg)}
                  tone={isFixed ? 'fixed' : isCurrent ? 'current' : 'blank'}
                  compact={compact}
                />
              )}
              {/* Little legs under each segment. */}
              <View style={styles.legs} pointerEvents="none">
                <View style={styles.leg} />
                <View style={styles.leg} />
              </View>
            </View>
          );
        })}

        {/* The tail carries the punctuation. */}
        <View style={styles.segWrap}>
          {filled.mark ? (
            <Pop from={0.5}>
              <Segment text={filled.mark} tone="done" tail compact={compact} />
            </Pop>
          ) : (
            <Segment
              text={current?.segId === 'mark' ? '?' : '…'}
              tone={current?.segId === 'mark' ? 'current' : 'blank'}
              tail
              compact={compact}
            />
          )}
        </View>
      </Animated.View>

      {/* THE OPTIONS ----------------------------------------------------- */}
      <View style={styles.options}>
        {(current?.options ?? []).map((option) => (
          <Choice
            key={`${step}-${option}`}
            flow={flow}
            id={option}
            isAnswer={option === current.answer}
            onPress={() => pick(option)}
            style={[styles.option, isMarkStep && styles.markOption]}
            accessibilityLabel={isMarkStep ? (option === '?' ? 'question mark, for asking' : 'full stop, for telling') : option}
          >
            <Text style={isMarkStep ? choiceText.big : styles.optionText}>{option}</Text>
            {/* What the mark is *for* — the actual lesson of this step. */}
            {isMarkStep ? (
              <Text style={styles.markJob}>{option === '?' ? 'asking' : 'telling'}</Text>
            ) : null}
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

// One body segment.
function Segment({ text, tone, tail = false, compact = false }) {
  const faces = {
    fixed: ['#C9F0D8', '#A8E0BE'],
    done: [ll.greenLight, ll.greenDeep],
    current: ['#FFFFFF', '#FFF2F7'],
    blank: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.7)'],
  };
  const inks = { fixed: ll.ink, done: ll.white, current: ll.ink, blank: ll.muted };

  return (
    <View style={[styles.segCast, tone === 'done' && styles.segCastDone]}>
      <LinearGradient
        colors={faces[tone]}
        style={[
          styles.segment,
          { minHeight: compact ? 42 : 46 },
          tail && styles.tail,
          tone === 'current' && styles.current,
          tone === 'blank' && styles.blank,
        ]}
      >
        <Sheen variant="tile" radius={23} />
        <TopHighlight radius={23} />
        <Text style={[styles.segText, { color: inks[tone] }, compact && { fontSize: 16 }]}>{text}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pictureCast: {
    borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 28,
    shadowOffset: { width: 0, height: 15 }, elevation: 9,
  },
  picture: {
    width: 122, height: 122, borderRadius: llRadius.xxl,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  pictureEmoji: { fontSize: 64 },

  body: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    justifyContent: 'center', gap: 4, marginTop: 26,
  },

  headWrap: { alignItems: 'center', marginRight: -6, zIndex: 3 },
  antennae: { flexDirection: 'row', gap: 12, marginBottom: -3 },
  antenna: {
    width: 2, height: 11, borderRadius: 2, backgroundColor: ll.greenDeep,
    transform: [{ rotate: '-18deg' }],
  },
  antennaRight: { transform: [{ rotate: '18deg' }] },
  headCast: {
    borderRadius: 24,
    shadowColor: ll.greenDeep, shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  head: {
    width: 46, height: 46, borderRadius: 24, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  eyes: { flexDirection: 'row', gap: 7, marginTop: -3 },
  eye: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center',
  },
  pupil: { width: 6, height: 6, borderRadius: 3, backgroundColor: ll.ink },
  smile: {
    width: 14, height: 7, marginTop: 3,
    borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2,
    borderColor: withAlpha('#1F6B47', 0.7),
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },

  segWrap: { alignItems: 'center' },
  segCast: {
    borderRadius: 23,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  segCastDone: { shadowColor: ll.greenDeep, shadowOpacity: 0.34, shadowRadius: 16 },
  segment: {
    paddingHorizontal: 13, borderRadius: 23, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  blank: { borderStyle: 'dashed', borderColor: ll.lilac },
  current: { borderWidth: 3, borderColor: ll.pink },
  tail: { minWidth: 46 },
  segText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18 },
  legs: { flexDirection: 'row', gap: 10, marginTop: -1 },
  leg: { width: 2, height: 7, borderRadius: 2, backgroundColor: withAlpha(ll.greenDeep, 0.5) },

  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 26 },
  option: { minWidth: 96 },
  markOption: { minWidth: 92, paddingVertical: 10 },
  optionText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  markJob: {
    marginTop: -2, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.1, color: ll.pinkDeep, textTransform: 'uppercase',
  },
});
