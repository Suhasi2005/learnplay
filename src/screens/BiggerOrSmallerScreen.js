import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../measurementData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Bigger or Smaller" — Measurement (Grade 1).
//
// Two copies of the same object at different sizes; pick the bigger or the
// smaller one. The old screen floated them inside two equal white boxes,
// each vertically centred — which is the one arrangement that makes size
// hardest to judge, because neither object shares a baseline or a scale with
// the other.
//
// It's a measuring station now. Both objects stand on the same **bench
// line**, with a graduated ruler rising behind them and a height marker
// drawn across the top of each. That's how measurement actually works: you
// compare two things by standing them on one surface against one scale. A
// child who can't yet judge "bigger" in the abstract can see which marker
// sits higher up the ruler.
//
// The word BIGGER / SMALLER also gets an arrow — up for bigger, down for
// smaller — because the question flips between rounds and a pre-reader needs
// a non-verbal cue for which way is being asked.
export default function BiggerOrSmallerScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-measurement';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongSide, setWrongSide] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedSide, setPickedSide] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const biggerSide = round.leftIsBigger ? 'left' : 'right';
  const correctSide = round.askBigger ? biggerSide : (biggerSide === 'left' ? 'right' : 'left');

  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);
  const { width } = useWindowDimensions();

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
      if (wrongTimeout.current) clearTimeout(wrongTimeout.current);
    };
  }, []);

  useEffect(() => {
    setPickedSide(null);
    speak(`Which one is ${round.askBigger ? 'bigger' : 'smaller'}?`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function triggerPop() {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }

  // ---------------------------------------------------------------------
  // Unchanged answer logic.
  function handleAnswer(side) {
    if (showCelebration || isProcessing) return;

    if (side === correctSide) {
      setIsProcessing(true);
      setPickedSide(side);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak('Yes! Well done!', { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < TOTAL_ROUNDS) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: TOTAL_ROUNDS,
            replayScreen: 'BiggerOrSmaller',
            title: 'Measuring Master!',
            subtitle: `You compared all ${TOTAL_ROUNDS} objects!`,
          });
        }
      }, 1300);
    } else {
      setWrongSide(side);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongSide(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const stageH = compact ? 178 : 196;
  const bigSize = compact ? 84 : 96;
  const smallSize = compact ? 40 : 46;
  // Ten graduations up the ruler.
  const marks = Array.from({ length: 10 }, (_, i) => i);

  return (
    <LinearGradient colors={['#EFF4FF', '#F3EFFB', '#FFF5EF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Measurement" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* THE ASK — with a direction arrow, since it flips each round. --- */}
      <View style={styles.askRow}>
        <Text style={styles.askLead}>Which one is</Text>
        <View style={[styles.askChip, round.askBigger ? styles.askChipBig : styles.askChipSmall]}>
          <Text style={styles.askArrow}>{round.askBigger ? '▲' : '▼'}</Text>
          <Text style={styles.askWord}>{round.askBigger ? 'BIGGER' : 'SMALLER'}</Text>
        </View>
      </View>

      {/* THE MEASURING STATION ---------------------------------------- */}
      <View style={[styles.stationCast, { height: stageH + 46 }]}>
        <LinearGradient colors={llSurface.white} style={[styles.station, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />

          {/* Graduated ruler up the left edge — the shared scale. */}
          <View style={[styles.ruler, { height: stageH }]} pointerEvents="none">
            {marks.map((m) => (
              <View key={m} style={styles.rulerRow}>
                <View style={[styles.gradTick, m % 5 === 0 && styles.gradTickMajor]} />
              </View>
            ))}
          </View>

          <View style={[styles.stage, { height: stageH }]}>
            {['left', 'right'].map((side) => {
              const isThisBigger = biggerSide === side;
              const isWrong = wrongSide === side;
              const isPicked = pickedSide === side;
              const size = isThisBigger ? bigSize : smallSize;
              return (
                <Animated.View
                  key={side}
                  style={[styles.column, isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined]}
                >
                  <Pressable
                    onPress={() => handleAnswer(side)}
                    disabled={isProcessing || showCelebration}
                    accessibilityRole="button"
                    accessibilityLabel={`${isThisBigger ? 'Larger' : 'Smaller'} ${side} object`}
                    style={({ pressed }) => [
                      styles.pad,
                      isPicked && styles.padPicked,
                      isWrong && styles.padWrong,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    {/* Height marker across the top of the object — reading
                        the object against the ruler. */}
                    <View style={[styles.markerRow, { marginBottom: 3 }]} pointerEvents="none">
                      <View style={[styles.markerLine, isPicked && { backgroundColor: ll.greenDeep }]} />
                    </View>

                    <GameObject id={round.id} emoji={round.emoji} size={size} />

                    {/* Both objects stand on this line. */}
                    <View style={[styles.base, isPicked && { backgroundColor: ll.green }]} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* The bench the whole station sits on. */}
          <LinearGradient colors={['#E2C79F', '#C9A477']} style={styles.bench} />
        </LinearGradient>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.View style={{ transform: [{ scale: popScale }] }}>
            <GameObject id={round.id} emoji={round.emoji} size={90} />
          </Animated.View>
          <Text style={styles.celebrationText}>Great eye!</Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2400} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 54 },
  titlePill: { flex: 1, alignSelf: 'center' },
  streakWrap: { alignSelf: 'flex-end', marginTop: 8, minHeight: 4 },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 10, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.blue, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  askRow: { alignItems: 'center', gap: 5, marginTop: 20, marginBottom: 18 },
  askLead: { ...llType.cardTitle, color: ll.soft },
  askChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 18, borderRadius: llRadius.pill,
  },
  askChipBig: { backgroundColor: ll.blueSoft, borderWidth: 2, borderColor: withAlpha(ll.blue, 0.4) },
  askChipSmall: { backgroundColor: ll.purpleSoft, borderWidth: 2, borderColor: withAlpha(ll.purple, 0.4) },
  askArrow: { fontSize: 13, color: ll.ink },
  askWord: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, color: ll.ink, letterSpacing: 0.6 },

  stationCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 9,
  },
  station: {
    flex: 1, borderRadius: llRadius.xl, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  // The shared scale both objects are read against.
  ruler: {
    position: 'absolute', left: 8, bottom: 14, width: 26,
    justifyContent: 'space-between',
  },
  rulerRow: { height: 2, justifyContent: 'center' },
  gradTick: { width: 9, height: 2, borderRadius: 1, backgroundColor: withAlpha('#8B86B8', 0.45) },
  gradTickMajor: { width: 18, height: 2.5, backgroundColor: withAlpha(ll.blueDeep, 0.5) },

  stage: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: 26, paddingLeft: 30, paddingRight: 12, paddingBottom: 14,
  },
  column: { alignItems: 'center' },
  pad: {
    alignItems: 'center', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 0,
    borderRadius: llRadius.md, borderWidth: 3, borderColor: 'transparent',
  },
  padPicked: { borderColor: ll.green, backgroundColor: withAlpha(ll.green, 0.08) },
  padWrong: { borderColor: '#FFB3C9', backgroundColor: withAlpha(ll.pink, 0.07) },
  markerRow: { width: 78, alignItems: 'center' },
  markerLine: {
    width: '100%', height: 2.5, borderRadius: 2,
    backgroundColor: withAlpha(ll.blueDeep, 0.4),
  },
  // Shared baseline: the reason the comparison is fair.
  base: {
    width: 72, height: 4, borderRadius: 2, marginTop: 4,
    backgroundColor: withAlpha('#8B86B8', 0.5),
  },
  bench: { height: 14, borderBottomLeftRadius: llRadius.xl, borderBottomRightRadius: llRadius.xl },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
