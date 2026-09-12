import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill } from '../kit';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/groceryBeltData';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Grocery Belt" — Everyday Words (Junior KG).
//
// Four items sit on a conveyor belt; Birdie names one and the child taps it.
// A correct tap flies the item up into the shopping bag rather than just
// disappearing — that flight is the whole visual distinction from a plain
// answer grid, and it costs nothing in interaction complexity: the tap target
// is still a stationary card, so there's no reflex-timing risk.
const WRONG_BEFORE_HINT = 2;

export default function GroceryBeltScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { topicId = 'jk-en-vocab', subjectId = 'English', standardId = 'Junior KG', title = 'Everyday Words',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongId, setWrongId] = useState(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [flying, setFlying] = useState(null); // id of the item currently flying into the bag
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const shake = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const hintGlow = useRef(new Animated.Value(0)).current;

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
    setWrongCount(0);
    hintGlow.setValue(0);
    speak(`Which one is the ${round.target.label}?`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  useEffect(() => {
    if (wrongCount < WRONG_BEFORE_HINT) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintGlow, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(hintGlow, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wrongCount]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handlePick(item) {
    if (isProcessing) return;

    if (item.id === round.target.id) {
      setIsProcessing(true);
      setFlying(item.id);
      fly.setValue(0);
      Animated.timing(fly, { toValue: 1, duration: 480, useNativeDriver: true }).start();

      const newStars = stars + 1;
      setStars(newStars);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSuccess();
      confetti.current?.start();
      speak('Well done!', { rate: 0.95, pitch: 1.2 });
      saveProgress(topicId, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setFlying(null);
        setIsProcessing(false);
        if (index + 1 < TOTAL_ROUNDS) {
          setIndex((i) => i + 1);
        } else {
          clearProgress(topicId);
          playComplete();
          navigation.replace('LLReward', { topicId, subjectId, title, stars: newStars, total: TOTAL_ROUNDS, standardId });
        }
      }, 620);
    } else {
      setWrongId(item.id);
      setWrongCount((n) => n + 1);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongId(null);
      }, 400);
    }
  }

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const flyY = fly.interpolate({ inputRange: [0, 1], outputRange: [0, -160] });
  const flyScale = fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] });
  const glow = hintGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.pinkSoft} color={ll.pinkDeep} style={styles.titlePill} />
        <View style={styles.bag}>
          <Text style={styles.bagEmoji}>🛍️</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>Which one is the  {round.target.label}?</Text>

      <View style={styles.beltWrap}>
        <View style={styles.beltTrack} />
        <View style={styles.belt}>
          {round.options.map((item) => {
            const isWrong = wrongId === item.id;
            const isFlying = flying === item.id;
            const isHintTarget = wrongCount >= WRONG_BEFORE_HINT && item.id === round.target.id;
            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.itemWrap,
                  isWrong && { transform: [{ translateX: shakeX }] },
                  isFlying && { transform: [{ translateY: flyY }, { scale: flyScale }], opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                  isHintTarget && { shadowColor: ll.amberWarm, shadowOpacity: glow, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } },
                ]}
              >
                <Pressable
                  style={styles.item}
                  onPress={() => handlePick(item)}
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View style={styles.wheel1} />
                  <View style={styles.wheel2} />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
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
  bag: {
    width: 44, height: 44, borderRadius: 16, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center', ...llShadow.soft,
  },
  bagEmoji: { fontSize: 22 },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.pink, width: 11, height: 11, borderRadius: 6 },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 22, marginBottom: 18, textAlign: 'center', paddingHorizontal: 24 },

  beltWrap: { width: '100%', paddingHorizontal: 20, position: 'relative' },
  beltTrack: {
    position: 'absolute', left: 16, right: 16, top: 46, height: 14,
    backgroundColor: '#D8CCF2', borderRadius: 7,
  },
  belt: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  itemWrap: { borderRadius: llRadius.lg },
  item: {
    width: 84, height: 84, borderRadius: llRadius.lg, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center', ...llShadow.card,
  },
  itemEmoji: { fontSize: 38 },
  wheel1: { position: 'absolute', bottom: -6, left: 14, width: 14, height: 14, borderRadius: 7, backgroundColor: ll.ink },
  wheel2: { position: 'absolute', bottom: -6, right: 14, width: 14, height: 14, borderRadius: 7, backgroundColor: ll.ink },

  starsRow: { marginTop: 30 },
  starsText: { ...llType.h4, color: ll.amberInk },
});
