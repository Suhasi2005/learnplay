import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { BINS, ITEMS } from '../livingData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import DragPiece from '../ll/games/DragPiece';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType } from '../ll/tokens';

// "Living or Not" — Living & Non-Living Things (Junior KG).
//
// Each thing goes into one of two places. Previously both were identical
// purple rectangles, which quietly taught the child nothing: the two
// categories looked the same, so only the label distinguished them.
//
// Now they are two genuinely different places, and the difference *is* the
// lesson. Living things go into a terrarium — soil at the bottom, a plant, a
// glass dome, air. Non-living things go onto a wooden crate shelf. A child
// who can't yet read "living" can still see that one container has earth and
// water in it and the other doesn't, and that is precisely the distinction
// the topic teaches: living things grow and need things.
//
// The item can be dragged into a container as well as tapped. Round loop,
// streak, saveProgress and the Completion hand-off are unchanged.
export default function LivingOrNotScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ev-living';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongBin, setWrongBin] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [carrying, setCarrying] = useState(false);

  const item = ITEMS[index];
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);
  const { width } = useWindowDimensions();

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);

  const binBoxes = useRef([]);
  const binRow = useRef(null);
  const rowOrigin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
      if (wrongTimeout.current) clearTimeout(wrongTimeout.current);
    };
  }, []);

  useEffect(() => {
    setHovered(null);
    setCarrying(false);
    speak(`Is the ${item.label.toLowerCase()} living, or not living?`, { rate: 0.95, pitch: 1.15 });
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
  // Unchanged sorting logic.
  function handleBin(bin) {
    if (showCelebration || isProcessing) return;

    if (bin.id === item.category) {
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
      speak(`Yes! The ${item.label.toLowerCase()} is ${bin.label.toLowerCase()}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < ITEMS.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: ITEMS.length,
            replayScreen: 'LivingOrNot',
            title: 'Nature Expert!',
            subtitle: `You sorted everything correctly!`,
          });
        }
      }, 1400);
    } else {
      setWrongBin(bin.id);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongBin(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  function binAt(x, y) {
    const ox = rowOrigin.current.x;
    const oy = rowOrigin.current.y;
    return binBoxes.current.findIndex(
      (b) => b && x >= ox + b.x - 16 && x <= ox + b.x + b.w + 16 && y >= oy + b.y - 26 && y <= oy + b.y + b.h,
    );
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const binW = compact ? 128 : 144;
  // The data's first bin is the living one; keep that mapping rather than
  // assuming an id string.
  const livingId = BINS[0]?.id;

  return (
    <LinearGradient colors={['#EAF7EF', '#F4F1E6', '#FFF7EE']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Living & Non-Living" bg="#E3F5EA" color={ll.greenDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {ITEMS.map((it, i) => (
          <View key={it.id} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* THE THING IN HAND --------------------------------------------- */}
      <DragPiece
        direction="any"
        threshold={26}
        liftTo={1.12}
        disabled={isProcessing || showCelebration}
        accessibilityLabel={`${item.label}. Drag to a home.`}
        onLift={() => setCarrying(true)}
        onMove={(g) => {
          const hit = binAt(g.moveX, g.moveY);
          setHovered(hit >= 0 ? BINS[hit].id : null);
        }}
        onDrop={(placed, g) => {
          setCarrying(false);
          setHovered(null);
          if (!placed || !g) return;
          const hit = binAt(g.moveX, g.moveY);
          if (hit >= 0) handleBin(BINS[hit]);
        }}
      >
        <View style={[styles.itemCast, carrying && styles.itemCastLifted]}>
          <LinearGradient colors={llSurface.white} style={[styles.itemBox, llRing.faint]}>
            <Sheen variant="tile" radius={llRadius.xxl} />
            <TopHighlight radius={llRadius.xxl} />
            <Text style={[styles.itemEmoji, compact && { fontSize: 74 }]}>{item.emoji}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </LinearGradient>
        </View>
      </DragPiece>

      <Text style={styles.prompt}>
        {carrying ? 'Where does it belong?' : 'Is it living, or not living?'}
      </Text>

      {/* THE TWO HOMES -------------------------------------------------- */}
      <View
        style={styles.binRow}
        ref={binRow}
        onLayout={() => binRow.current?.measureInWindow?.((x, y) => { rowOrigin.current = { x, y }; })}
      >
        {BINS.map((bin, i) => {
          const isWrong = wrongBin === bin.id;
          const isHover = hovered === bin.id;
          const living = bin.id === livingId;
          return (
            <Animated.View
              key={bin.id}
              onLayout={(e) => {
                const { x, y, width: w, height: h } = e.nativeEvent.layout;
                binBoxes.current[i] = { x, y, w, h };
              }}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              {living
                ? <Terrarium bin={bin} width={binW} hover={isHover} wrong={isWrong} disabled={isProcessing || showCelebration} onPress={() => handleBin(bin)} />
                : <Crate bin={bin} width={binW} hover={isHover} wrong={isWrong} disabled={isProcessing || showCelebration} onPress={() => handleBin(bin)} />}
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{item.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>
            {item.label} is {BINS.find((b) => b.id === item.category)?.label}!
          </Text>
        </View>
      )}

      <ConfettiCannon ref={confettiRef} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2400} />
    </LinearGradient>
  );
}

// Living things: a glass dome over soil, with a plant and a water droplet.
// Everything a living thing needs, drawn.
function Terrarium({ bin, width, hover, wrong, disabled, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={bin.label}
      style={({ pressed }) => [
        styles.homeCast,
        { shadowColor: ll.greenDeep },
        hover && { shadowOpacity: 0.5, shadowRadius: 24, elevation: 10 },
        wrong && { shadowColor: ll.pink, shadowOpacity: 0.45 },
        pressed && !disabled && { transform: [{ translateY: 2 }] },
      ]}
    >
      <View
        style={[
          styles.home,
          { width },
          hover && styles.homeHover,
          wrong && styles.homeWrong,
        ]}
      >
        {/* Glass dome. */}
        <LinearGradient
          colors={['rgba(214,241,226,0.9)', 'rgba(168,222,190,0.55)']}
          style={styles.dome}
        >
          <View style={styles.domeShine} pointerEvents="none" />
          <Text style={styles.homeEmoji}>{bin.emoji}</Text>
          {/* Air and water cues. */}
          <Text style={styles.droplet}>💧</Text>
        </LinearGradient>
        {/* Soil layers — the thing the other container doesn't have. */}
        <View style={styles.soil}>
          <View style={styles.soilTop} />
          <View style={styles.soilGrain} />
        </View>
        <Text style={[styles.homeLabel, { color: ll.greenDeep }]} numberOfLines={1} adjustsFontSizeToFit>
          {bin.label}
        </Text>
      </View>
    </Pressable>
  );
}

// Non-living things: a wooden crate. Dry, slatted, inert.
function Crate({ bin, width, hover, wrong, disabled, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={bin.label}
      style={({ pressed }) => [
        styles.homeCast,
        { shadowColor: '#8A5E34' },
        hover && { shadowOpacity: 0.5, shadowRadius: 24, elevation: 10 },
        wrong && { shadowColor: ll.pink, shadowOpacity: 0.45 },
        pressed && !disabled && { transform: [{ translateY: 2 }] },
      ]}
    >
      <View
        style={[
          styles.home,
          { width },
          hover && styles.homeHover,
          wrong && styles.homeWrong,
        ]}
      >
        <LinearGradient colors={['#E2BE92', '#C59A6A']} style={styles.crateBody}>
          <Sheen variant="tile" radius={12} />
          {/* Slats. */}
          <View style={styles.slat} />
          <View style={styles.slat} />
          <Text style={styles.homeEmoji}>{bin.emoji}</Text>
        </LinearGradient>
        <View style={styles.crateFoot} />
        <Text style={[styles.homeLabel, { color: '#7C5535' }]} numberOfLines={1} adjustsFontSizeToFit>
          {bin.label}
        </Text>
      </View>
    </Pressable>
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

  itemCast: {
    marginTop: 18, borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 24,
    shadowOffset: { width: 0, height: 13 }, elevation: 9,
  },
  itemCastLifted: { shadowOpacity: 0.42, shadowRadius: 36, shadowOffset: { width: 0, height: 22 }, elevation: 15 },
  itemBox: {
    borderRadius: llRadius.xxl, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 9,
    alignItems: 'center', overflow: 'hidden',
  },
  itemEmoji: { fontSize: 84 },
  itemLabel: { ...llType.tiny, color: ll.greenDeep, textTransform: 'uppercase', letterSpacing: 1.2 },

  prompt: { ...llType.cardTitle, color: ll.ink, marginTop: 13, marginBottom: 16, textAlign: 'center' },

  binRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
  homeCast: {
    borderRadius: llRadius.lg,
    shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 6,
  },
  home: {
    borderRadius: llRadius.lg, alignItems: 'center', paddingBottom: 8,
    borderWidth: 3, borderColor: 'transparent', overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  homeHover: { borderColor: ll.white },
  homeWrong: { borderColor: '#FFB3C9' },
  homeEmoji: { fontSize: 32 },
  homeLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, marginTop: 5, paddingHorizontal: 6 },

  // Terrarium
  dome: {
    alignSelf: 'stretch', height: 64, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  domeShine: {
    position: 'absolute', top: 6, left: 14, width: 18, height: 30,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ rotate: '18deg' }],
  },
  droplet: { position: 'absolute', right: 12, top: 10, fontSize: 13, opacity: 0.85 },
  soil: { alignSelf: 'stretch', height: 20, backgroundColor: '#7C5535', overflow: 'hidden' },
  soilTop: { height: 5, backgroundColor: '#5E3F27' },
  soilGrain: {
    position: 'absolute', bottom: 4, left: 10, right: 10, height: 2,
    borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)',
  },

  // Crate
  crateBody: {
    alignSelf: 'stretch', height: 72, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },
  slat: {
    position: 'absolute', left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(124,85,53,0.45)', top: 22,
  },
  crateFoot: { alignSelf: 'stretch', height: 7, backgroundColor: '#8A5E34' },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 100 },
  celebrationText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.greenDeep,
    marginTop: 8, paddingHorizontal: 24, textAlign: 'center',
  },
});
