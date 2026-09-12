import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill } from '../kit';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/habitatDropData';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Land or Water or Sky?" — Animals (Junior KG).
//
// An animal drifts down under a little parachute; three zone buttons sit
// below. A correct tap sends the animal sliding into that zone instead of
// simply vanishing — three destinations, not two, is what keeps this from
// being the existing Living/Not-Living sort with different labels.
export default function HabitatDropScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { topicId = 'jk-ev-animals', subjectId = 'EVS', standardId = 'Junior KG', title = 'Animals',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongZone, setWrongZone] = useState(null);
  const [landing, setLanding] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
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
    setLanding(null);
    slide.setValue(0);
    speak(`Where does the ${round.label} live?`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
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

  function handlePick(zone, zoneIndex, totalZones) {
    if (isProcessing) return;

    if (zone.id === round.habitat) {
      setIsProcessing(true);
      setLanding(zoneIndex);
      slide.setValue(0);
      // Slide toward whichever side the correct zone sits on, roughly.
      const direction = zoneIndex < (totalZones - 1) / 2 ? -1 : zoneIndex > (totalZones - 1) / 2 ? 1 : 0;
      Animated.timing(slide, { toValue: direction, duration: 420, useNativeDriver: true }).start();

      const newStars = stars + 1;
      setStars(newStars);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSuccess();
      confetti.current?.start();
      speak(`Yes! The ${round.label} lives in the ${zone.label.toLowerCase()}.`, { rate: 0.95, pitch: 1.2 });
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
      }, 650);
    } else {
      setWrongZone(zone.id);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      playWrong();
      speak('Try another home!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongZone(null);
      }, 400);
    }
  }

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const slideX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-90, 0, 90] });
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.pinkSoft} color={ll.pinkDeep} style={styles.titlePill} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>Where does the {round.label} live?</Text>

      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.animalWrap,
            { transform: [{ translateY: landing === null ? bobY : 0 }, { translateX: landing !== null ? slideX : 0 }] },
            landing !== null && { opacity: slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }) },
          ]}
        >
          <Text style={styles.parachute}>🪂</Text>
          <Text style={styles.animalEmoji}>{round.emoji}</Text>
        </Animated.View>
      </View>

      <View style={styles.zones}>
        {round.zones.map((zone, i) => {
          const isWrong = wrongZone === zone.id;
          return (
            <Animated.View key={zone.id} style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}>
              <Pressable
                style={[styles.zone, { backgroundColor: zone.color }]}
                onPress={() => handlePick(zone, i, round.zones.length)}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel={zone.label}
              >
                <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                <Text style={styles.zoneLabel}>{zone.label}</Text>
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

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.pink, width: 11, height: 11, borderRadius: 6 },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 18, marginBottom: 6, textAlign: 'center', paddingHorizontal: 24 },

  stage: { height: 130, alignItems: 'center', justifyContent: 'center' },
  animalWrap: { alignItems: 'center' },
  parachute: { fontSize: 40 },
  animalEmoji: { fontSize: 52, marginTop: -8 },

  zones: { flexDirection: 'row', gap: 14, marginTop: 8 },
  zone: {
    width: 100, height: 96, borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 4,
    ...llShadow.card,
  },
  zoneEmoji: { fontSize: 30 },
  zoneLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.white },

  starsRow: { marginTop: 28 },
  starsText: { ...llType.h4, color: ll.amberInk },
});
