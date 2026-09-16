import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../seasonsData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Dress for the Season" — Seasons & Weather (Senior KG).
//
// A season is shown; the child picks what to wear.
//
// The environment is a window with a wardrobe rail below it. The window is
// the whole idea: you decide what to wear by *looking outside*, and the
// weather visible through the glass is the evidence for the answer. The
// season's own colour washes the sky, so summer and winter are different
// places rather than two labels.
//
// The clothing choices hang on a rail as garments on hangers, not as cards.
// A hanger says "you are choosing something to put on", which is the action;
// a card says "pick option B". The hanger shapes are identical across all
// four so nothing but the garment differs.
//
// Weather particles (rain streaks, snow, sun rays) are drawn from the round's
// own season, so the window agrees with the question without any new data.
const SEASON_SKY = {
  summer: ['#FFE9A8', '#FFD166', '#FFC844'],
  winter: ['#E8F2FF', '#CFE3F7', '#B8D4EE'],
  rainy: ['#D6DEEA', '#B9C6D8', '#9FB0C6'],
  monsoon: ['#D6DEEA', '#B9C6D8', '#9FB0C6'],
  autumn: ['#FFE0C2', '#F7C99B', '#E8AE74'],
  spring: ['#E6F7E9', '#C9EED3', '#A8E0B8'],
};

function skyFor(label) {
  const key = String(label ?? '').toLowerCase();
  for (const name of Object.keys(SEASON_SKY)) {
    if (key.includes(name)) return SEASON_SKY[name];
  }
  return ['#EAF2FF', '#D8E6F7', '#C3D8EE'];
}

// What's falling (or shining) outside, derived from the season name.
function Weather({ label }) {
  const key = String(label ?? '').toLowerCase();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 2200, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fall = drift.interpolate({ inputRange: [0, 1], outputRange: [-26, 118] });

  if (key.includes('rain') || key.includes('monsoon')) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[12, 34, 56, 78, 100].map((x, i) => (
          <Animated.View
            key={x}
            style={[
              styles.rainDrop,
              { left: `${(x / 120) * 100}%`, transform: [{ translateY: fall }] },
              i % 2 ? { opacity: 0.5 } : null,
            ]}
          />
        ))}
      </View>
    );
  }
  if (key.includes('winter') || key.includes('snow')) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[16, 40, 64, 88, 106].map((x, i) => (
          <Animated.View
            key={x}
            style={[
              styles.snowFlake,
              { left: `${(x / 120) * 100}%`, transform: [{ translateY: fall }] },
              i % 2 ? { opacity: 0.6 } : null,
            ]}
          />
        ))}
      </View>
    );
  }
  if (key.includes('summer') || key.includes('spring')) {
    // A sun with rays, top-left, matching the app's light direction.
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.sun} />
        <View style={[styles.ray, { top: 30, left: 6, width: 18 }]} />
        <View style={[styles.ray, { top: 44, left: 10, width: 13 }]} />
      </View>
    );
  }
  // Autumn: a couple of drifting leaves.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[24, 62, 94].map((x) => (
        <Animated.View
          key={x}
          style={[styles.leaf, { left: `${(x / 120) * 100}%`, transform: [{ translateY: fall }] }]}
        />
      ))}
    </View>
  );
}

export default function DressForSeasonScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ev-seasons';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedId, setPickedId] = useState(null);

  // seasonsData gives `season` as an object ({ id, label, emoji, correctWear }).
  // This screen reads the season as a display name plus a separate emoji, so
  // flatten those two here; correctId and options pass through untouched.
  const round = useMemo(() => {
    const r = buildRound(index);
    return { ...r, season: r.season.label, emoji: r.season.emoji };
  }, [index]);
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
    speak(`It's ${round.season}. What should you wear?`, { rate: 0.95, pitch: 1.15 });
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
      speak(`Yes! Wear the ${option.label} in ${round.season}!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'DressForSeason',
            title: 'Weather Wise!',
            subtitle: `You dressed for every season!`,
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
  const garment = compact ? 78 : 86;
  const sky = skyFor(round.season);

  return (
    <LinearGradient colors={['#F6F1E8', '#F2EFFA', '#EDF4FF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Seasons & Weather" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
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

      {/* THE WINDOW — look outside to decide. -------------------------- */}
      <View style={styles.windowCast}>
        <LinearGradient colors={['#F0E4D2', '#D9C3A5']} style={styles.frame}>
          <View style={styles.glass}>
            <LinearGradient colors={sky} style={StyleSheet.absoluteFill} />
            <Weather label={round.season} />
            {/* Ground line, so there's an outside rather than a colour field. */}
            <View style={styles.horizon} pointerEvents="none" />
            <Text style={[styles.seasonEmoji, compact && { fontSize: 44 }]}>{round.emoji}</Text>
            {/* Glazing bars — what makes it a window. */}
            <View style={styles.barV} pointerEvents="none" />
            <View style={styles.barH} pointerEvents="none" />
            {/* Reflection. */}
            <LinearGradient
              colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.8, y: 0.7 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
          <View style={styles.sill} />
        </LinearGradient>
      </View>

      <View style={styles.seasonPlate}>
        <Text style={styles.seasonLabel}>{round.season}</Text>
      </View>

      <Text style={styles.prompt}>What should you wear?</Text>

      {/* THE WARDROBE RAIL --------------------------------------------- */}
      <View style={styles.rack}>
        <View style={styles.rail} pointerEvents="none" />
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
                    styles.hangerCast,
                    isPicked && { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 22, elevation: 10 },
                    isWrong && { shadowColor: ll.pink, shadowOpacity: 0.4 },
                    pressed && { transform: [{ translateY: 3 }, { scale: 0.97 }] },
                  ]}
                >
                  {/* Hanger hook and shoulders — identical on all four. */}
                  <View style={styles.hook} pointerEvents="none" />
                  <View style={styles.shoulders} pointerEvents="none" />

                  <LinearGradient
                    colors={isPicked ? ['#F2FBF6', '#DCF2E6'] : llSurface.white}
                    style={[
                      styles.garment,
                      { width: garment, height: garment },
                      isPicked ? styles.garmentPicked : isWrong ? styles.garmentWrong : llRing.faint,
                    ]}
                  >
                    <Sheen variant="tile" radius={llRadius.md} />
                    <TopHighlight radius={llRadius.md} />
                    <GameObject id={option.id} emoji={option.emoji} size={garment * 0.46} />
                    <Text style={styles.garmentLabel} numberOfLines={1} adjustsFontSizeToFit>{option.label}</Text>
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
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{round.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>Perfect for {round.season}!</Text>
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

  windowCast: {
    marginTop: 14,
    shadowColor: '#7C5535', shadowOpacity: 0.3, shadowRadius: 24,
    shadowOffset: { width: 0, height: 13 }, elevation: 9,
  },
  frame: { borderRadius: 16, padding: 9, alignItems: 'center' },
  glass: {
    width: 168, height: 118, borderRadius: 9, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(124,85,53,0.25)',
  },
  horizon: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 22,
    backgroundColor: 'rgba(90,120,80,0.28)',
  },
  seasonEmoji: { fontSize: 52 },
  // Glazing bars: the detail that reads "window" rather than "picture".
  barV: {
    position: 'absolute', top: 0, bottom: 0, left: '50%', width: 3,
    marginLeft: -1.5, backgroundColor: 'rgba(240,228,210,0.85)',
  },
  barH: {
    position: 'absolute', left: 0, right: 0, top: '50%', height: 3,
    marginTop: -1.5, backgroundColor: 'rgba(240,228,210,0.85)',
  },
  sill: {
    width: 186, height: 9, borderRadius: 4, marginTop: 7,
    backgroundColor: '#B9945F',
  },

  rainDrop: {
    position: 'absolute', top: 0, width: 2, height: 13, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  snowFlake: {
    position: 'absolute', top: 0, width: 6, height: 6, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  sun: {
    position: 'absolute', top: 10, left: 12, width: 26, height: 26, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  ray: {
    position: 'absolute', height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  leaf: {
    position: 'absolute', top: 0, width: 9, height: 7, borderRadius: 5,
    backgroundColor: '#D98A3F', transform: [{ rotate: '24deg' }],
  },

  seasonPlate: {
    marginTop: 10, paddingVertical: 5, paddingHorizontal: 18, borderRadius: llRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: 'rgba(126,110,200,0.14)',
  },
  seasonLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },

  prompt: { ...llType.cardTitle, color: ll.soft, marginTop: 8, marginBottom: 18, textAlign: 'center' },

  rack: { alignItems: 'center', paddingTop: 12 },
  rail: {
    position: 'absolute', top: 0, left: -16, right: -16, height: 5,
    borderRadius: 3, backgroundColor: '#B7B2C9',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 320 },

  hangerCast: {
    borderRadius: llRadius.md, alignItems: 'center',
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  // Hook + shoulders: says "something to put on", not "option B".
  hook: {
    width: 8, height: 10, borderTopLeftRadius: 5, borderTopRightRadius: 5,
    borderWidth: 2, borderBottomWidth: 0, borderColor: '#97A2B5',
    marginBottom: -1,
  },
  shoulders: {
    width: 40, height: 7, marginBottom: -3,
    borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderColor: '#97A2B5',
  },
  garment: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: 5, gap: 2,
  },
  garmentPicked: { borderWidth: 3, borderColor: ll.green },
  garmentWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  garmentLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10.5, color: ll.ink, textAlign: 'center' },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 100 },
  celebrationText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, color: ll.greenDeep,
    marginTop: 8, paddingHorizontal: 24, textAlign: 'center',
  },
});
