import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { BINS, SHAPES } from '../shapesData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import DragPiece from '../ll/games/DragPiece';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Shape Sorter" — Shapes (Junior KG).
//
// A shape appears and goes into one of two bins: round things, or things with
// points. This screen used to be a white card above two flat purple
// rectangles, which gave a child no reason to believe the rectangles were
// containers.
//
// The environment is now a sorting table. The bins are real open-topped
// containers — a visible rim ellipse, an inside wall darker than the front,
// and a lip that the shape passes behind as it drops in. That matters more
// than decoration: the whole concept is *putting a thing inside a category*,
// and a container you can see into is what makes a category feel like a
// place. The shape can now be dragged into a bin as well as tapped, so the
// child's hand performs the sorting rather than just voting on it.
//
// The round loop, the streak, saveProgress and the Completion hand-off are
// untouched.
export default function ShapeSortScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'jk-ma-shapes';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongBin, setWrongBin] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: which bin the finger is over, and whether we're carrying.
  const [hovered, setHovered] = useState(null);
  const [carrying, setCarrying] = useState(false);

  const shape = SHAPES[index];
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef(null);
  const { width } = useWindowDimensions();

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);

  // Bin hit-boxes, measured for the drop test.
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
    speak(`Is the ${shape.label.toLowerCase()} round, or does it have points?`, { rate: 0.95, pitch: 1.15 });
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

    if (bin.id === shape.category) {
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
      speak(`Yes! The ${shape.label.toLowerCase()} is ${bin.label.toLowerCase()}!`, { rate: 0.95, pitch: 1.15 });
      saveProgress(GAME_ID, index + 1, newStars);

      advanceTimeout.current = setTimeout(() => {
        if (!isMounted.current) return;
        setShowCelebration(false);
        setIsProcessing(false);
        if (index + 1 < SHAPES.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', {
            gameId: GAME_ID,
            stars: newStars,
            total: SHAPES.length,
            replayScreen: 'ShapeSort',
            title: 'Shape Sorter!',
            subtitle: `You sorted all ${SHAPES.length} shapes!`,
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
      (b) => b && x >= ox + b.x - 16 && x <= ox + b.x + b.w + 16 && y >= oy + b.y - 24 && y <= oy + b.y + b.h,
    );
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const binW = compact ? 126 : 142;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Shapes" bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <View style={styles.progressRow}>
        {SHAPES.map((s, i) => (
          <View key={s.id} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* THE SHAPE — pick it up and put it somewhere. ------------------- */}
      <DragPiece
        direction="any"
        threshold={26}
        liftTo={1.12}
        disabled={isProcessing || showCelebration}
        accessibilityLabel={`${shape.label}. Drag to a bin.`}
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
        <View style={[styles.shapeCast, carrying && styles.shapeCastLifted]}>
          <LinearGradient colors={llSurface.white} style={[styles.shapeBox, llRing.faint]}>
            <Sheen variant="tile" radius={llRadius.xxl} />
            <TopHighlight radius={llRadius.xxl} />
            <Text style={[styles.shapeEmoji, compact && { fontSize: 72 }]}>{shape.emoji}</Text>
          </LinearGradient>
        </View>
      </DragPiece>

      <Text style={styles.prompt}>
        {carrying ? 'Drop it in the right bin!' : 'Is it round, or does it have points?'}
      </Text>

      {/* THE BINS — open containers, not buttons. ---------------------- */}
      <View
        style={styles.binRow}
        ref={binRow}
        onLayout={() => binRow.current?.measureInWindow?.((x, y) => { rowOrigin.current = { x, y }; })}
      >
        {BINS.map((bin, i) => {
          const isWrong = wrongBin === bin.id;
          const isHover = hovered === bin.id;
          return (
            <Animated.View
              key={bin.id}
              onLayout={(e) => {
                const { x, y, width: w, height: h } = e.nativeEvent.layout;
                binBoxes.current[i] = { x, y, w, h };
              }}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <Bin
                bin={bin}
                width={binW}
                hover={isHover}
                wrong={isWrong}
                disabled={isProcessing || showCelebration}
                onPress={() => handleBin(bin)}
              />
            </Animated.View>
          );
        })}
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>{shape.emoji}</Animated.Text>
          <Text style={styles.celebrationText}>
            {shape.label} is {BINS.find((b) => b.id === shape.category)?.label}!
          </Text>
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

// An open-topped container. The rim ellipse and the darker inside wall are
// what turn a rectangle into somewhere a thing can go.
function Bin({ bin, width, hover, wrong, disabled, onPress }) {
  const tint = bin.id === 'round' ? ll.blue : ll.purple;
  const deep = bin.id === 'round' ? ll.blueDeep : ll.purpleDeep;
  return (
    <View
      style={[
        styles.binCast,
        { shadowColor: deep },
        hover && { shadowOpacity: 0.5, shadowRadius: 24, elevation: 10 },
        wrong && { shadowColor: ll.pink, shadowOpacity: 0.45 },
      ]}
    >
      <View
        accessibilityRole="button"
        accessibilityLabel={bin.label}
        accessibilityState={{ disabled: !!disabled }}
        onStartShouldSetResponder={() => !disabled}
        onResponderRelease={() => !disabled && onPress()}
      >
        {/* Inside wall, visible above the front panel. */}
        <View style={[styles.binMouth, { width, backgroundColor: deep }]}>
          <View style={[styles.binMouthInner, { backgroundColor: withAlpha('#1A1040', 0.45) }]} />
        </View>

        <LinearGradient
          colors={[tint, deep]}
          style={[
            styles.binBody,
            { width, height: 92 },
            hover && { borderColor: ll.white, borderWidth: 3 },
            wrong && { borderColor: '#FFB3C9', borderWidth: 3 },
          ]}
        >
          <Sheen variant="strong" radius={llRadius.lg} />
          <Text style={styles.binEmoji}>{bin.emoji}</Text>
          <Text style={styles.binLabel}>{bin.label}</Text>
          {/* Front lip, so the body reads as having thickness. */}
          <View style={styles.binLip} pointerEvents="none" />
        </LinearGradient>
      </View>
    </View>
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

  shapeCast: {
    marginTop: 22, borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.26, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 9,
  },
  shapeCastLifted: { shadowOpacity: 0.44, shadowRadius: 38, shadowOffset: { width: 0, height: 24 }, elevation: 15 },
  shapeBox: {
    borderRadius: llRadius.xxl, paddingHorizontal: 26, paddingVertical: 14,
    alignItems: 'center', overflow: 'hidden',
  },
  shapeEmoji: { fontSize: 86 },

  prompt: {
    ...llType.cardTitle, color: ll.ink, marginTop: 16, marginBottom: 20,
    textAlign: 'center', paddingHorizontal: 10,
  },

  binRow: { flexDirection: 'row', gap: 14 },
  binCast: {
    borderRadius: llRadius.lg,
    shadowOpacity: 0.34, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 6,
  },
  // The rim: a shallow band above the body, reading as the opening.
  binMouth: {
    height: 14, borderTopLeftRadius: 12, borderTopRightRadius: 12,
    justifyContent: 'center', paddingHorizontal: 6, overflow: 'hidden',
  },
  binMouthInner: { height: 7, borderRadius: 6 },
  binBody: {
    borderRadius: llRadius.lg, borderTopLeftRadius: 6, borderTopRightRadius: 6,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 3, borderColor: 'transparent',
  },
  binEmoji: { fontSize: 34 },
  binLabel: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.white, marginTop: 2,
    textShadowColor: 'rgba(20,10,60,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
  binLip: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 5,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },

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
