import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { ACTIONS, ROUNDS } from '../trafficData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Stop or Go" — Traffic Rules & Safety (Junior KG).
//
// A light shows; the child has a few seconds to choose Stop, Wait or Go.
// This is the only timed game in the app, and the timer is the point: road
// decisions are made quickly, and a child who dithers at a crossing is the
// exact behaviour the topic exists to correct.
//
// The environment is now a kerbside. A real traffic light housing holds three
// lamps, and only the live one is lit — the other two sit dark and recessed.
// That single change does the teaching that an emoji couldn't: the child
// reads the *position* of the lit lamp (top = stop, middle = wait, bottom =
// go), which is how real lights are read the world over, including by people
// who can't distinguish the colours.
//
// The countdown moved into the light's own pole, so the thing running out of
// time is visibly the light rather than a progress bar parked nearby.
const ROUND_MS = 3500;

// Which lamp each round lights, derived from the round's own light name.
const LAMP_ORDER = ['red', 'amber', 'green'];
const LAMP_TINT = {
  red: { on: '#F4453C', glow: 'rgba(244,69,60,0.85)' },
  amber: { on: '#FFB524', glow: 'rgba(255,181,36,0.85)' },
  green: { on: '#3FD07A', glow: 'rgba(63,208,122,0.85)' },
};

function lampFor(round) {
  const name = String(round.light ?? '').toLowerCase();
  if (name.includes('red')) return 'red';
  if (name.includes('green')) return 'green';
  if (name.includes('yellow') || name.includes('amber') || name.includes('orange')) return 'amber';
  // Fall back to the action the round expects, so an unnamed light still lights.
  const act = String(round.correctAction ?? '').toLowerCase();
  if (act.includes('go')) return 'green';
  if (act.includes('wait')) return 'amber';
  return 'red';
}

export default function StopOrGoScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ev-traffic';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongActionId, setWrongActionId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = ROUNDS[index];
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef(null);
  const { width } = useWindowDimensions();

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);
  const countdownAnim = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      countdownAnim.current?.stop();
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
      if (wrongTimeout.current) clearTimeout(wrongTimeout.current);
    };
  }, []);

  useEffect(() => {
    speak(`The light is ${round.light}!`, { rate: 0.95, pitch: 1.15 });
    startCountdown();
    return () => countdownAnim.current?.stop();
  }, [index]);

  // ---------------------------------------------------------------------
  // Unchanged timing and answer logic.
  function startCountdown() {
    countdown.setValue(1);
    countdownAnim.current = Animated.timing(countdown, {
      toValue: 0,
      duration: ROUND_MS,
      useNativeDriver: false,
    });
    countdownAnim.current.start(({ finished }) => {
      if (finished && isMounted.current) handleTimeout();
    });
  }

  function handleTimeout() {
    setStreak(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playWrong();
    speak('Too slow! Try again.', { rate: 0.95, pitch: 1.15 });
    startCountdown();
  }

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

  function handleAction(action) {
    if (showCelebration || isProcessing) return;

    if (action.id === round.correctAction) {
      countdownAnim.current?.stop();
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${action.label}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < ROUNDS.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: ROUNDS.length,
            replayScreen: 'StopOrGo',
            title: 'Road Safety Star!',
            subtitle: `You got every light right!`,
          });
        }
      }, 1300);
    } else {
      setWrongActionId(action.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongActionId(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const barHeight = countdown.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const lit = lampFor(round);
  const compact = width < 360;
  const lampSize = compact ? 36 : 42;

  return (
    <LinearGradient colors={['#DCE9FF', '#EDE6FF', '#FFF0F5']} locations={[0, 0.55, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Traffic Rules" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {ROUNDS.map((_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* THE LIGHT — three lamps, one lit, plus the pole as the timer. --- */}
      <View style={styles.lightScene}>
        <View style={styles.housingCast}>
          <LinearGradient colors={['#4A4468', '#2B2740']} style={styles.housing}>
            <View style={styles.hood} pointerEvents="none" />
            {LAMP_ORDER.map((lamp) => {
              const on = lamp === lit;
              const tint = LAMP_TINT[lamp];
              return (
                <View
                  key={lamp}
                  style={[
                    styles.lampSocket,
                    { width: lampSize, height: lampSize, borderRadius: lampSize / 2 },
                    on && { shadowColor: tint.glow, shadowOpacity: 0.95, shadowRadius: 18, elevation: 10 },
                  ]}
                >
                  <LinearGradient
                    colors={on ? [withAlpha('#FFFFFF', 0.85), tint.on] : ['#3A3556', '#221E36']}
                    start={{ x: 0.3, y: 0.15 }}
                    end={{ x: 0.75, y: 1 }}
                    style={[styles.lamp, { borderRadius: lampSize / 2 }]}
                  />
                </View>
              );
            })}
          </LinearGradient>
        </View>

        {/* Pole, holding the countdown. Draining downward reads as the
            light's time running out, not a bar filling up. */}
        <View style={styles.pole}>
          <Animated.View style={[styles.poleFill, { height: barHeight }]}>
            <LinearGradient colors={[ll.amberWarm, '#F4693C']} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <View style={styles.poleBase} />
      </View>

      <Text style={styles.lightName}>The light is {round.light}</Text>
      <Text style={styles.prompt}>What do you do?</Text>

      <View style={styles.actionRow}>
        {ACTIONS.map((action) => {
          const isWrong = wrongActionId === action.id;
          // No hint affordance here on purpose — the game is timed, and
          // highlighting the answer would defeat the reflex it teaches.
          return (
            <Animated.View
              key={action.id}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <Pressable
                onPress={() => handleAction(action)}
                disabled={isProcessing || showCelebration}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                style={({ pressed }) => [
                  styles.actionCast,
                  isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                  pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={llSurface.white}
                  style={[
                    styles.action,
                    { width: compact ? 92 : 100, height: compact ? 92 : 100 },
                    isWrong ? styles.actionWrong : llRing.faint,
                  ]}
                >
                  <Sheen variant="tile" radius={llRadius.xl} />
                  <TopHighlight radius={llRadius.xl} />
                  <Text style={styles.actionEmoji}>{action.emoji}</Text>
                  <Text style={styles.actionLabel} numberOfLines={1} adjustsFontSizeToFit>{action.label}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{round.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>Great job!</Text>
        </View>
      )}

      <ConfettiCannon
        ref={confettiRef}
        count={35}
        origin={{ x: width / 2, y: 0 }}
        autoStart={false}
        fadeOut
        fallSpeed={2400}
      />
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

  lightScene: { alignItems: 'center', marginTop: 18 },
  housingCast: {
    borderRadius: 20,
    shadowColor: '#241F3C', shadowOpacity: 0.42, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  housing: {
    borderRadius: 20, paddingVertical: 12, paddingHorizontal: 13, gap: 9,
    alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)',
  },
  // The peak above the top lamp, as on a real signal head.
  hood: {
    position: 'absolute', top: -5, left: 10, right: 10, height: 8,
    borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: '#211D34',
  },
  lampSocket: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(0,0,0,0.45)', overflow: 'visible',
  },
  lamp: { width: '100%', height: '100%' },

  pole: {
    width: 14, height: 56, borderRadius: 7, marginTop: -2,
    backgroundColor: 'rgba(60,52,96,0.28)', overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  poleFill: { width: '100%', overflow: 'hidden' },
  poleBase: {
    width: 46, height: 9, borderRadius: 5, marginTop: -2,
    backgroundColor: '#3A3556',
  },

  lightName: {
    ...llType.eyebrow, color: ll.ink, marginTop: 14, textTransform: 'uppercase', opacity: 0.6,
  },
  prompt: { ...llType.h4, color: ll.ink, marginTop: 4, marginBottom: 18, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 11 },
  actionCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  action: {
    borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: 6,
  },
  actionWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  actionEmoji: { fontSize: 34 },
  actionLabel: { ...llType.small, color: ll.ink, marginTop: 2 },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 100 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
