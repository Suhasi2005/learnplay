import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill } from '../kit';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/rhymeTrainData';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Rhyme Train" — Rhymes & Stories (Junior KG).
//
// Each choice is drawn as a boxy train car (two wheel-dots under a rounded
// rectangle) rather than a plain card — pure styling, no new art needed.
// A correct pick couples that car onto a growing train strip at the top, so
// finishing the topic leaves behind a visible train of every rhyme learned.
export default function RhymeTrainScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { topicId = 'jk-en-rhymes', subjectId = 'English', standardId = 'Junior KG', title = 'Rhymes & Stories',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongLabel, setWrongLabel] = useState(null);
  const [collected, setCollected] = useState([]); // emojis of coupled cars
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const shake = useRef(new Animated.Value(0)).current;
  const couple = useRef(new Animated.Value(0)).current;

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
    speak(`Which one rhymes with ${round.target.label}?`, { rate: 0.95, pitch: 1.15 });
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

  function handlePick(option) {
    if (isProcessing) return;

    if (option.label === round.answerLabel) {
      setIsProcessing(true);
      couple.setValue(0);
      Animated.spring(couple, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();

      const newStars = stars + 1;
      setStars(newStars);
      setCollected((c) => [...c, option.emoji]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSuccess();
      confetti.current?.start();
      speak('Choo choo! That rhymes!', { rate: 0.95, pitch: 1.2 });
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
      }, 500);
    } else {
      setWrongLabel(option.label);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      playWrong();
      speak('Listen again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongLabel(null);
      }, 400);
    }
  }

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const coupleScale = couple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
      </View>

      {/* The growing train — one coupled car per rhyme found so far. */}
      <View style={styles.trainStrip}>
        <Text style={styles.engine}>🚂</Text>
        {collected.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[styles.trainCar, i === collected.length - 1 && { transform: [{ scale: coupleScale }] }]}
          >
            {emoji}
          </Animated.Text>
        ))}
        {Array.from({ length: TOTAL_ROUNDS - collected.length }, (_, i) => (
          <View key={`empty-${i}`} style={styles.trackDot} />
        ))}
      </View>

      <View style={styles.targetCard}>
        <Text style={styles.targetEmoji}>{round.target.emoji}</Text>
        <Text style={styles.targetLabel}>{round.target.label}</Text>
      </View>
      <Text style={styles.prompt}>Which one rhymes with  {round.target.label}?</Text>

      <View style={styles.cars}>
        {round.options.map((opt) => {
          const isWrong = wrongLabel === opt.label;
          return (
            <Animated.View key={opt.label} style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}>
              <Pressable
                style={styles.car}
                onPress={() => handlePick(opt)}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text style={styles.carEmoji}>{opt.emoji}</Text>
                <Text style={styles.carLabel}>{opt.label}</Text>
                <View style={styles.wheelL} />
                <View style={styles.wheelR} />
              </Pressable>
            </Animated.View>
          );
        })}
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

  trainStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 18,
    maxWidth: 320, flexWrap: 'wrap', justifyContent: 'center',
  },
  engine: { fontSize: 26 },
  trainCar: { fontSize: 22 },
  trackDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },

  targetCard: {
    marginTop: 20, backgroundColor: ll.white, borderRadius: llRadius.xl,
    paddingVertical: 14, paddingHorizontal: 26, alignItems: 'center', gap: 2, ...llShadow.card,
  },
  targetEmoji: { fontSize: 46 },
  targetLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  prompt: { ...llType.body, color: ll.body, marginTop: 12, marginBottom: 18, textAlign: 'center', paddingHorizontal: 20 },

  cars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingHorizontal: 20 },
  car: {
    width: 96, height: 96, borderRadius: llRadius.lg, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center', gap: 2, ...llShadow.card,
  },
  carEmoji: { fontSize: 32 },
  carLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: ll.ink },
  wheelL: { position: 'absolute', bottom: -6, left: 16, width: 14, height: 14, borderRadius: 7, backgroundColor: ll.ink },
  wheelR: { position: 'absolute', bottom: -6, right: 16, width: 14, height: 14, borderRadius: 7, backgroundColor: ll.ink },

  starsRow: { marginTop: 26 },
  starsText: { ...llType.h4, color: ll.amberInk },
});
