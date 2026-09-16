import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { TOTAL_ROUNDS, buildRound } from '../animalSoundsData';
import { useSound } from '../context/SoundContext';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Who Says That?" — Animals & Their Sounds (Senior KG).
//
// A sound is shown and spoken; the child picks the animal that makes it.
// This game already had real animal sprites, so no objects needed replacing.
//
// Two things were wrong and both are fixed here.
//
// First: the sound is the *question*, and it was rendered as quiet text on a
// white card. It's now a speech bubble with sound waves radiating from a
// speaker — the sound is the loudest thing on the screen, as it should be.
//
// Second, and more important: this is an audio game with no way to hear the
// question again. A four-year-old who looks away during the prompt had no
// recourse. The bubble is now tappable and re-speaks the sound. That's a
// presentation affordance over the existing `speak` — it awards nothing,
// costs nothing and doesn't touch the round loop.
//
// The animals stand in barn stalls, which gives four sprites a shared home
// and drops the four unrelated card tints that were assigned by position.
export default function WhoSaysThatScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ev-animals';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedId, setPickedId] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
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
    setPickedId(null);
    speak(`Who says ${round.sound}`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  // Sound waves pulse continuously, marking the bubble as the audio source.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

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
  function handleAnswer(option) {
    if (showCelebration || isProcessing) return;

    if (option.id === round.correctId) {
      setIsProcessing(true);
      setPickedId(option.id);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! The ${option.label} says ${round.sound}`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'WhoSaysThat',
            title: 'Animal Expert!',
            subtitle: `You matched every sound!`,
          });
        }
      }, 1400);
    } else {
      setWrongId(option.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongId(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  // Replaying the prompt is presentation only — no scoring, no state change.
  function hearAgain() {
    speak(`Who says ${round.sound}`, { rate: 0.95, pitch: 1.15 });
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const waveScale = wave.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] });
  const waveFade = wave.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.12, 0] });

  const compact = width < 360;
  const stall = compact ? 88 : 98;

  return (
    <LinearGradient colors={['#FFF2E6', '#F3F6EA', '#E9F4EF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Animal Sounds" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
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

      {/* THE SOUND — the question, and now replayable. ----------------- */}
      <Pressable
        onPress={hearAgain}
        accessibilityRole="button"
        accessibilityLabel={`Hear the sound again: ${round.sound}`}
        style={styles.bubbleCast}
      >
        {/* Radiating waves. */}
        <Animated.View
          style={[styles.waveRing, { opacity: waveFade, transform: [{ scale: waveScale }] }]}
          pointerEvents="none"
        />
        <LinearGradient colors={['#FFFFFF', '#FFF3E4']} style={[styles.bubble, llRing.light]}>
          <TopHighlight radius={llRadius.xxl} />
          <Sheen variant="tile" radius={llRadius.xxl} />
          <View style={styles.bubbleRow}>
            <View style={styles.speaker}>
              <Text style={styles.speakerIcon}>🔊</Text>
            </View>
            <Text style={[styles.soundText, compact && { fontSize: 26 }]} numberOfLines={1} adjustsFontSizeToFit>
              "{round.sound}"
            </Text>
          </View>
          <Text style={styles.tapHint}>Tap to hear it again</Text>
        </LinearGradient>
        {/* Bubble tail. */}
        <View style={styles.tail} pointerEvents="none" />
      </Pressable>

      <Text style={styles.prompt}>Who says that?</Text>

      {/* THE BARN STALLS ----------------------------------------------- */}
      <View style={styles.barn}>
        <View style={styles.barnBeam} pointerEvents="none" />
        <View style={styles.grid}>
          {round.options.map((option) => {
            const isWrong = wrongId === option.id;
            const isPicked = pickedId === option.id;
            return (
              <Animated.View key={option.id} style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}>
                <Pressable
                  onPress={() => handleAnswer(option)}
                  disabled={isProcessing || showCelebration}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={({ pressed }) => [
                    styles.stallCast,
                    isPicked && { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 22, elevation: 10 },
                    isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                    pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                  ]}
                >
                  <LinearGradient
                    colors={isPicked ? ['#F2FBF6', '#DCF2E6'] : llSurface.white}
                    style={[
                      styles.stall,
                      { width: stall, height: stall },
                      isPicked ? styles.stallPicked : isWrong ? styles.stallWrong : llRing.faint,
                    ]}
                  >
                    <TopHighlight radius={llRadius.lg} />
                    {/* Stall post, shared by all four. */}
                    <View style={styles.post} pointerEvents="none" />
                    <Image source={option.sprite} style={styles.sprite} resizeMode="contain" />
                  </LinearGradient>
                  {/* Straw at the stall floor. */}
                  <View style={styles.straw} pointerEvents="none" />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>🎉</Animated.Text>
          <Text style={styles.celebrationText}>Great job!</Text>
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
  dotActive: { backgroundColor: ll.amber, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  bubbleCast: {
    marginTop: 16, alignItems: 'center',
    shadowColor: '#C05A2E', shadowOpacity: 0.26, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  waveRing: {
    position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
    borderRadius: 40, borderWidth: 3, borderColor: ll.amberWarm,
  },
  bubble: {
    borderRadius: llRadius.xxl, paddingVertical: 13, paddingHorizontal: 24,
    alignItems: 'center', overflow: 'hidden',
  },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  speaker: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: ll.amberSoft,
    borderWidth: 1.5, borderColor: withAlpha(ll.amber, 0.55),
  },
  speakerIcon: { fontSize: 17 },
  soundText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: ll.clay },
  tapHint: {
    marginTop: 4, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 1.1, color: ll.muted, textTransform: 'uppercase',
  },
  tail: {
    width: 16, height: 16, marginTop: -7,
    backgroundColor: '#FFF3E4', transform: [{ rotate: '45deg' }],
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 14, marginBottom: 14, textAlign: 'center' },

  barn: { alignItems: 'center', paddingTop: 10 },
  barnBeam: {
    position: 'absolute', top: 0, left: -14, right: -14, height: 7,
    borderRadius: 4, backgroundColor: '#A9784F',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 300 },

  stallCast: {
    borderRadius: llRadius.lg, alignItems: 'center',
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  stall: {
    borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  stallPicked: { borderWidth: 3, borderColor: ll.green },
  stallWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  // One post per stall, identical — a shared home, not four themed cards.
  post: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 4,
    backgroundColor: 'rgba(169,120,79,0.3)',
  },
  sprite: { width: '76%', height: '76%' },
  straw: {
    width: '84%', height: 5, borderRadius: 3, marginTop: -2,
    backgroundColor: withAlpha(ll.amber, 0.45),
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
