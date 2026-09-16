import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../oddOneOutData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llSurface, llType } from '../ll/tokens';

// "Odd One Out" — Colors (Senior KG).
//
// Four tiles; one is different. The critical design constraint here is
// *uniformity*: every tile must be identical in every respect except the one
// the child is meant to notice. The old version was already careful about
// this, and the premium pass has to stay careful — a differently-lit tile, a
// slightly larger shadow, or a card tint assigned by position would all hand
// out false answers.
//
// So the environment is a gallery wall: four matching frames, hung at the
// same height, evenly spaced, lit identically. The frame is the same object
// four times over, which is exactly what makes the *contents* comparable.
// Nothing about a tile varies but its picture.
//
// The one deliberate asymmetry arrives only after the answer: the correct
// frame gets a spotlight.
export default function OddOneOutScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-colors';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongTileId, setWrongTileId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: which frame to spotlight once solved.
  const [foundId, setFoundId] = useState(null);

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
    setFoundId(null);
    speak('Find the one that is different!', { rate: 0.95, pitch: 1.15 });
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
  function handleTile(tile) {
    if (showCelebration || isProcessing) return;

    if (tile.isOdd) {
      setIsProcessing(true);
      setFoundId(tile.id);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak('Yes! You found it!', { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'OddOneOut',
            title: 'Sharp Eyes!',
            subtitle: `You spotted every odd one out!`,
          });
        }
      }, 1300);
    } else {
      setWrongTileId(tile.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongTileId(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const frame = compact ? 92 : 102;

  return (
    <LinearGradient colors={['#F7F1E8', '#F2EDFA', '#EDF3FF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Odd One Out" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
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

      <Text style={styles.prompt}>Find the one that's different</Text>

      {/* THE GALLERY WALL — four identical frames. --------------------- */}
      <View style={styles.wall}>
        {/* Picture rail, so the frames read as hung rather than floating. */}
        <View style={styles.rail} pointerEvents="none" />

        <View style={styles.grid}>
          {round.tiles.map((tile) => {
            const isWrong = wrongTileId === tile.id;
            const isFound = foundId === tile.id;
            return (
              <Animated.View
                key={tile.id}
                style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
              >
                {/* Hanging wire — identical on every frame. */}
                <View style={styles.wire} pointerEvents="none">
                  <View style={styles.wireLeft} />
                  <View style={styles.wireRight} />
                  <View style={styles.nail} />
                </View>

                <Pressable
                  onPress={() => handleTile(tile)}
                  disabled={isProcessing || showCelebration}
                  accessibilityRole="button"
                  accessibilityLabel={`Picture ${tile.id + 1}`}
                  style={({ pressed }) => [
                    styles.frameCast,
                    isFound && { shadowColor: ll.amber, shadowOpacity: 0.65, shadowRadius: 26, elevation: 12 },
                    isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                    pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                  ]}
                >
                  {/* Gilt frame moulding. */}
                  <LinearGradient
                    colors={isFound ? ['#FFE9A8', '#E8B53C'] : ['#E8DFD0', '#C8BCA8']}
                    style={[styles.frame, { width: frame, height: frame }]}
                  >
                    {/* Mount board. */}
                    <View style={[styles.mount, isWrong && styles.mountWrong]}>
                      <LinearGradient colors={llSurface.white} style={styles.plate}>
                        <TopHighlight radius={6} />
                        <GameObject emoji={tile.emoji} size={frame * 0.44} />
                      </LinearGradient>
                    </View>
                    <Sheen variant="tile" radius={llRadius.md} />
                  </LinearGradient>
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
          <Text style={styles.celebrationText}>Sharp eyes!</Text>
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

  prompt: { ...llType.h4, color: ll.ink, marginTop: 20, marginBottom: 26, textAlign: 'center' },

  wall: { alignItems: 'center', position: 'relative', paddingTop: 12 },
  rail: {
    position: 'absolute', top: 0, left: -20, right: -20, height: 4,
    borderRadius: 2, backgroundColor: 'rgba(124,85,53,0.16)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 250 },

  // Every frame is the same object — that's the point.
  wire: { alignItems: 'center', height: 10, marginBottom: -1 },
  wireLeft: {
    position: 'absolute', top: 0, left: '32%', width: 1.5, height: 11,
    backgroundColor: 'rgba(46,42,99,0.28)', transform: [{ rotate: '16deg' }],
  },
  wireRight: {
    position: 'absolute', top: 0, right: '32%', width: 1.5, height: 11,
    backgroundColor: 'rgba(46,42,99,0.28)', transform: [{ rotate: '-16deg' }],
  },
  nail: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#97A2B5' },

  frameCast: {
    borderRadius: llRadius.md,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  frame: {
    borderRadius: llRadius.md, padding: 7, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  mount: {
    flex: 1, alignSelf: 'stretch', borderRadius: 8, padding: 5,
    backgroundColor: '#FBF7F0',
  },
  mountWrong: { backgroundColor: '#FFEFF4' },
  plate: {
    flex: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(126,110,200,0.12)',
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 90 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
