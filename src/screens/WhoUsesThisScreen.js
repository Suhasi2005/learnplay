import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../helpersData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Who Uses This?" — Community Helpers (Junior KG).
//
// A tool appears; the child picks the helper who uses it. The old version
// showed the tool on a white card above four differently-tinted buttons, so
// the helpers read as options rather than as people.
//
// The environment is now a noticeboard of ID badges. Each helper is a badge:
// a lanyard clip at the top, a photo area, a name plate. That framing does
// real work here — the topic is about *jobs*, and a badge is the everyday
// object that says "this person's job is X". It also gives the four choices
// one shared treatment, so the child compares the people rather than the
// card colours.
//
// The tool hangs above on a pegboard, the way tools are actually stored, and
// the chosen badge lifts forward on a correct answer.
export default function WhoUsesThisScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ev-helpers';

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
    speak('Who uses this?', { rate: 0.95, pitch: 1.15 });
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
      speak(`Yes! The ${option.label} uses this!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'WhoUsesThis',
            title: 'Helper Hero!',
            subtitle: `You matched every helper!`,
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

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const badgeW = compact ? 126 : 140;

  return (
    <LinearGradient colors={['#FFF1E9', '#F6EEFF', '#EAF1FF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Community Helpers" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
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

      {/* THE PEGBOARD — where a tool lives when it isn't in use. -------- */}
      <View style={styles.pegCast}>
        <LinearGradient colors={['#F3E3CE', '#E2C9A8']} style={styles.pegboard}>
          {/* Peg holes, the detail that makes it a board rather than a card. */}
          <View style={styles.pegHoles} pointerEvents="none">
            {Array.from({ length: 7 }, (_, i) => <View key={i} style={styles.pegHole} />)}
          </View>
          <View style={styles.hook} pointerEvents="none" />
          <Text style={[styles.toolEmoji, compact && { fontSize: 58 }]}>{round.tool}</Text>
        </LinearGradient>
      </View>

      <Text style={styles.prompt}>Who uses this?</Text>

      {/* THE BADGE BOARD ----------------------------------------------- */}
      <View style={styles.grid}>
        {round.options.map((option) => {
          const isWrong = wrongId === option.id;
          const isPicked = pickedId === option.id;
          return (
            <Animated.View
              key={option.id}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <Pressable
                onPress={() => handleAnswer(option)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                style={({ pressed }) => [
                  styles.badgeCast,
                  isPicked && { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 24, elevation: 10 },
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  isPicked && { transform: [{ translateY: -4 }] },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.98 }] },
                ]}
              >
                {/* Lanyard clip. */}
                <View style={styles.clip} pointerEvents="none">
                  <View style={styles.clipHole} />
                </View>

                <LinearGradient
                  colors={isPicked ? ['#F4FCF7', '#E2F5EA'] : llSurface.white}
                  style={[
                    styles.badge,
                    { width: badgeW },
                    isPicked ? styles.badgePicked : isWrong ? styles.badgeWrong : llRing.faint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.lg} />
                  <TopHighlight radius={llRadius.lg} />

                  {/* Photo area. */}
                  <View style={[styles.photo, isPicked && { backgroundColor: '#D6F0E0' }]}>
                    <Text style={styles.photoEmoji}>{option.emoji}</Text>
                  </View>

                  {/* Name plate. */}
                  <View style={styles.plate}>
                    <Text style={styles.plateLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {option.label}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
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

  pegCast: {
    marginTop: 14, borderRadius: llRadius.lg,
    shadowColor: '#8A5E34', shadowOpacity: 0.28, shadowRadius: 20,
    shadowOffset: { width: 0, height: 11 }, elevation: 7,
  },
  pegboard: {
    borderRadius: llRadius.lg, paddingHorizontal: 34, paddingTop: 20, paddingBottom: 12,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  pegHoles: {
    position: 'absolute', top: 9, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  pegHole: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(124,85,53,0.4)',
  },
  hook: {
    position: 'absolute', top: 14, width: 3, height: 12,
    backgroundColor: '#97A2B5', borderRadius: 2,
  },
  toolEmoji: { fontSize: 68 },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 14, marginBottom: 16, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 340 },
  badgeCast: {
    borderRadius: llRadius.lg, alignItems: 'center',
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  // The clip reads as "this hangs on a lanyard", which is what makes the
  // card an ID badge rather than a tile.
  clip: {
    width: 26, height: 12, borderRadius: 4, backgroundColor: '#B7B2C9',
    alignItems: 'center', justifyContent: 'center', marginBottom: -3, zIndex: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
  },
  clipHole: { width: 12, height: 3, borderRadius: 2, backgroundColor: 'rgba(46,42,99,0.35)' },

  badge: {
    borderRadius: llRadius.lg, paddingTop: 10, paddingBottom: 9, paddingHorizontal: 9,
    alignItems: 'center', overflow: 'hidden',
  },
  badgePicked: { borderWidth: 3, borderColor: ll.green },
  badgeWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  photo: {
    width: '100%', height: 52, borderRadius: 10,
    backgroundColor: '#EFEAFB', alignItems: 'center', justifyContent: 'center',
  },
  photoEmoji: { fontSize: 34 },
  plate: {
    marginTop: 7, alignSelf: 'stretch', paddingVertical: 3, paddingHorizontal: 6,
    borderRadius: 6, backgroundColor: 'rgba(46,42,99,0.06)',
  },
  plateLabel: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: ll.ink,
    textAlign: 'center', letterSpacing: 0.3,
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
