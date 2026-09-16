import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { ALPHABET, buildRound } from '../gameData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Learn ABC" — Alphabet sounds & phonics (Junior KG). 26 rounds.
//
// A letter is shown and the child picks the picture that starts with it.
//
// The letter is now a wooden alphabet block — the canonical object of early
// literacy, and one a three-year-old has almost certainly held. Showing the
// capital on the lit face and the lowercase on the shaded side face does
// something a flat "Aa" can't: it presents the pair as two views of one
// thing rather than two separate symbols, which is exactly the confusion
// this topic exists to resolve.
//
// The pictures are pinned to a cork board, so the round reads as a nursery
// play corner rather than four coloured buttons. The card tints are gone —
// they were assigned by grid position and meant nothing, which risks a child
// learning "the answer is the blue one".
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

export default function AlphabetGameScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-en-abc';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
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
    setWrongAttempts(0);
    hintPulse.setValue(0);
    speak(`Find the picture that starts with ${round.letter}`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  useEffect(() => {
    if (wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(hintPulse, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      ).start();
    }
  }, [wrongAttempts]);

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

    if (option.letter === round.letter) {
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
      speak(`Yes! ${round.letter} is for ${round.word}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < ALPHABET.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: ALPHABET.length,
            replayScreen: 'AlphabetGame',
            title: 'You did it!',
            subtitle: `You learned all ${ALPHABET.length} letters!`,
          });
        }
      }, 1400);
    } else {
      setWrongId(option.letter);
      setStreak(0);
      setWrongAttempts((n) => n + 1);
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
  const hintGlow = hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const compact = width < 360;
  const card = compact ? 112 : 128;

  return (
    <LinearGradient colors={['#FFF3E7', '#F5EDFF', '#EBF2FF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Learn ABC" bg={ll.pinkSoft} color={ll.pinkDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {ALPHABET.map((item, i) => (
          <View
            key={item.letter}
            style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]}
          />
        ))}
      </View>

      {/* THE BLOCK — capital on the lit face, lowercase on the side. ---- */}
      <View style={styles.blockCast}>
        {/* Top face, catching the light. */}
        <LinearGradient
          colors={['#F6DCB4', '#E8C08C']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.blockTop}
        />
        <View style={styles.blockRow}>
          <LinearGradient
            colors={['#F0CFA3', '#DCAF78']}
            style={[styles.blockFace, compact && { width: 96, height: 96 }]}
          >
            <Sheen variant="tile" radius={14} />
            <Text style={[styles.blockLetter, compact && { fontSize: 62, lineHeight: 70 }]}>{round.letter}</Text>
            {/* Engraved inner line, as on a real printed block. */}
            <View style={styles.blockInner} pointerEvents="none" />
          </LinearGradient>
          {/* Side face, in shadow — the same letter, other case. */}
          <LinearGradient
            colors={['#C9A276', '#AE8558']}
            style={[styles.blockSide, compact && { height: 96 }]}
          >
            <Text style={[styles.blockLower, compact && { fontSize: 34 }]}>{round.letter.toLowerCase()}</Text>
          </LinearGradient>
        </View>
      </View>

      <Text style={styles.prompt}>Which picture starts with {round.letter}?</Text>

      {/* THE CORK BOARD ------------------------------------------------- */}
      <LinearGradient colors={['#E4C79B', '#CFAC7B']} style={styles.board}>
        <View style={styles.boardFrame} pointerEvents="none" />
        <View style={styles.grid}>
          {round.options.map((option, i) => {
            const isWrong = wrongId === option.letter;
            const isHintTarget = wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT && option.letter === round.letter;
            return (
              <Animated.View
                key={option.letter}
                style={[
                  isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined,
                  isHintTarget && {
                    shadowColor: ll.amber,
                    shadowOpacity: hintGlow,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <Pressable
                  onPress={() => handleAnswer(option)}
                  disabled={isProcessing || showCelebration}
                  accessibilityRole="button"
                  accessibilityLabel={`Picture option ${i + 1}`}
                  style={({ pressed }) => [
                    styles.pinCast,
                    isHintTarget && { shadowColor: ll.amber, shadowOpacity: 0.5 },
                    pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
                  ]}
                >
                  {/* Push pin. */}
                  <View style={[styles.pin, isHintTarget && { backgroundColor: ll.amber }]} pointerEvents="none" />
                  <LinearGradient
                    colors={llSurface.white}
                    style={[
                      styles.pic,
                      { width: card, height: card },
                      isWrong ? styles.picWrong : isHintTarget ? styles.picHint : llRing.faint,
                    ]}
                  >
                    <Sheen variant="tile" radius={llRadius.lg} />
                    <TopHighlight radius={llRadius.lg} />
                    <GameObject emoji={option.emoji} size={card * 0.5} />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>
            {round.emoji}
          </Animated.Text>
          <Text style={styles.celebrationText}>{round.letter} is for {round.word}!</Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={40} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 54 },
  titlePill: { flex: 1, alignSelf: 'center' },
  streakWrap: { alignSelf: 'flex-end', marginTop: 8, minHeight: 4 },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 10, maxWidth: 300 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.pink, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  blockCast: {
    marginTop: 14, alignItems: 'flex-start',
    shadowColor: '#8A5E34', shadowOpacity: 0.34, shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 }, elevation: 9,
  },
  // A thin top plane sells the block as a cube rather than a square.
  blockTop: {
    height: 10, width: 118, marginLeft: 9,
    borderTopLeftRadius: 10, borderTopRightRadius: 6,
  },
  blockRow: { flexDirection: 'row', alignItems: 'stretch' },
  blockFace: {
    width: 108, height: 108, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  blockInner: {
    position: 'absolute', top: 7, left: 7, right: 7, bottom: 7,
    borderRadius: 9, borderWidth: 2, borderColor: 'rgba(124,85,53,0.22)',
  },
  blockLetter: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 70, lineHeight: 80, color: '#7C4B24',
    textShadowColor: 'rgba(255,255,255,0.55)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 },
  },
  blockSide: {
    width: 26, height: 108, borderTopRightRadius: 6, borderBottomRightRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  blockLower: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: 'rgba(255,255,255,0.8)' },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 14, marginBottom: 14, textAlign: 'center' },

  board: {
    borderRadius: llRadius.xl, padding: 14, alignSelf: 'stretch', alignItems: 'center',
    shadowColor: '#7C5535', shadowOpacity: 0.26, shadowRadius: 20,
    shadowOffset: { width: 0, height: 11 }, elevation: 7,
  },
  boardFrame: {
    position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
    borderRadius: 18, borderWidth: 2, borderColor: 'rgba(124,85,53,0.22)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 13 },

  pinCast: {
    borderRadius: llRadius.lg, alignItems: 'center',
    shadowColor: '#5B4220', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  pin: {
    width: 11, height: 11, borderRadius: 6, backgroundColor: ll.pink,
    marginBottom: -5, zIndex: 2,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  pic: {
    borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  picWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  picHint: { borderWidth: 3, borderColor: ll.amber },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 110 },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
