import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill } from '../kit';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/beadNecklaceData';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Bead Necklace" — Patterns (Junior KG).
//
// A string of five beads ends in a dashed "next bead" slot. Tapping the right
// colour slides a real bead onto the string in that slot; a wrong tap bounces
// the choice-bead back rather than shaking the whole necklace, which keeps
// the pattern itself undisturbed and legible while giving distinct feedback.
export default function BeadNecklaceScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { topicId = 'jk-ma-patterns', subjectId = 'Math', standardId = 'Junior KG', title = 'Patterns',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongColor, setWrongColor] = useState(null);
  const [slotFilled, setSlotFilled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const bounce = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

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
    setSlotFilled(false);
    slide.setValue(0);
    speak('What colour comes next?', { rate: 0.95, pitch: 1.15 });
  }, [index]);

  function bounceWrong() {
    bounce.setValue(0);
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
  }

  function handlePick(color) {
    if (isProcessing) return;

    if (color === round.answer) {
      setIsProcessing(true);
      setSlotFilled(true);
      Animated.spring(slide, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();

      const newStars = stars + 1;
      setStars(newStars);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSuccess();
      confetti.current?.start();
      speak('Perfect bead!', { rate: 0.95, pitch: 1.2 });
      saveProgress(topicId, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setIsProcessing(false);
        if (index + 1 < TOTAL_ROUNDS) {
          setIndex((i) => i + 1);
        } else {
          clearProgress(topicId);
          playComplete();
          navigation.replace('LLReward', { topicId, subjectId, title, stars: newStars, total: TOTAL_ROUNDS, standardId });
        }
      }, 700);
    } else {
      setWrongColor(color);
      bounceWrong();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      playWrong();
      speak('Not quite. Look at the pattern again.', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongColor(null);
      }, 400);
    }
  }

  const slideX = slide.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });
  const slideScale = slide.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const bounceScale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.purpleTint} color={ll.purpleDeep} style={styles.titlePill} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>What colour bead comes next?</Text>

      <View style={styles.necklace}>
        <View style={styles.string} />
        {round.sequence.map((color, i) => (
          <View key={i} style={[styles.bead, { backgroundColor: color }]} />
        ))}
        <Animated.View
          style={[
            styles.bead,
            styles.nextSlot,
            slotFilled
              ? { backgroundColor: round.answer, transform: [{ translateX: slideX }, { scale: slideScale }] }
              : styles.nextSlotEmpty,
          ]}
        >
          {!slotFilled && <Text style={styles.question}>?</Text>}
        </Animated.View>
      </View>

      <View style={styles.choices}>
        {round.options.map((color) => (
          <Pressable
            key={color}
            onPress={() => handlePick(color)}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Bead colour choice"
          >
            <Animated.View
              style={[
                styles.choiceBead,
                { backgroundColor: color },
                wrongColor === color && { transform: [{ scale: bounceScale }] },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {stars}</Text>
      </View>

      <ConfettiCannon ref={confetti} count={35} origin={{ x: 195, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, alignSelf: 'stretch' },
  titlePill: { flex: 1, alignSelf: 'center' },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.pink, width: 11, height: 11, borderRadius: 6 },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 22, marginBottom: 26, textAlign: 'center', paddingHorizontal: 24 },

  necklace: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ll.white, borderRadius: llRadius.xxl, padding: 20, ...llShadow.card,
  },
  string: { position: 'absolute', left: 20, right: 20, height: 3, backgroundColor: '#D8CCF2', borderRadius: 2 },
  bead: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: ll.white },
  nextSlot: { borderStyle: 'dashed', borderWidth: 3, borderColor: ll.lock, alignItems: 'center', justifyContent: 'center' },
  nextSlotEmpty: { backgroundColor: 'transparent' },
  question: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.lock },

  choices: { flexDirection: 'row', gap: 22, marginTop: 34 },
  choiceBead: {
    width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: ll.white, ...llShadow.card,
  },

  starsRow: { marginTop: 30 },
  starsText: { ...llType.h4, color: ll.amberInk },
});
