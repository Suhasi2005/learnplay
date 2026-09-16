import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill, StarChip } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/beadNecklaceData';
import { ll, llElevation, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';
import { Bead as SvgBead } from '../objects/beads';

// "Bead Necklace" — Patterns (Junior KG).
//
// The child is making a necklace, not answering a question about one. Beads
// live loose in a wooden bowl and are *dragged* up onto the string; the right
// bead snaps into the empty slot with a settle-bounce and the whole necklace
// swings, a wrong one springs back to the bowl. The string itself never
// reacts to a mistake, so the pattern stays legible while the child re-reads
// it — the single most important thing on the screen.
//
// Two things make the pattern visually obvious rather than merely present:
//
//  - The repeating unit is bracketed underneath (AB, or AAB), so the child
//    sees the *chunk* that repeats instead of a row of coloured circles.
//  - The beads hang on an arc. A drooping string reads as one continuous
//    object; a straight row reads as a list of separate answers.
//
// Interaction is drag-first but tap-complete: a tap on a bowl bead plays the
// same placement, because a three-year-old's drag often registers as a tap.
// Both paths call handlePick(color), so the scoring path below is untouched.

// How far up the child must drag before a release counts as "onto the string"
// rather than "put it back". Deliberately forgiving.
const PLACE_THRESHOLD = -52;

export default function BeadNecklaceScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { topicId = 'jk-ma-patterns', subjectId = 'Math', standardId = 'Junior KG', title = 'Patterns',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongColor, setWrongColor] = useState(null);
  const [slotFilled, setSlotFilled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: which bead the child is holding, so the bowl can show
  // an empty dimple and the slot can light up as a target.
  const [dragging, setDragging] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const bounce = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  // The necklace's own swing after a bead lands.
  const swing = useRef(new Animated.Value(0)).current;
  // Slot pulse while a bead is being carried toward it.
  const target = useRef(new Animated.Value(0)).current;

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
    swing.setValue(0);
    speak('What colour comes next?', { rate: 0.95, pitch: 1.15 });
  }, [index]);

  // Slot breathes while the child holds a bead — a target, not a blank.
  useEffect(() => {
    if (!dragging || slotFilled) {
      target.stopAnimation();
      Animated.timing(target, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(target, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(target, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [dragging, slotFilled]);

  function bounceWrong() {
    bounce.setValue(0);
    Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
  }

  // The necklace settling on its string once a bead is threaded.
  function swingNecklace() {
    swing.setValue(0);
    Animated.sequence([
      Animated.timing(swing, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(swing, { toValue: 0, friction: 3.4, tension: 90, useNativeDriver: true }),
    ]).start();
  }

  // ---------------------------------------------------------------------
  // Unchanged round logic. Both the drag release and a plain tap arrive here.
  function handlePick(color) {
    if (isProcessing) return;

    if (color === round.answer) {
      setIsProcessing(true);
      setSlotFilled(true);
      Animated.spring(slide, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
      swingNecklace();

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
  // ---------------------------------------------------------------------

  const slideX = slide.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] });
  const slideScale = slide.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const bounceScale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });
  const swingRotate = swing.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1.6deg'] });
  const targetScale = target.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  // Bead geometry scales with the screen so eight beads never crowd a small
  // phone. The string card is the stage, so it gets the hero elevation.
  const compact = width < 360;
  const beadSize = compact ? 34 : 40;
  const bowlBead = compact ? 58 : 66;
  const threaded = round.sequence.length;

  // The repeating unit: AB (2) or AAB (3). Derived from the sequence itself so
  // no data file has to declare it.
  const unit = detectUnit(round.sequence);

  // A gentle droop — beads sit lower toward the middle of the string.
  function droop(i, count) {
    const t = count <= 1 ? 0 : i / (count - 1);
    return Math.sin(t * Math.PI) * (compact ? 8 : 11);
  }

  const totalBeads = threaded + 1;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.purpleTint} color={ll.purpleDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>
        What colour bead comes <Text style={styles.promptTarget}>next</Text>?
      </Text>

      {/* THE NECKLACE ------------------------------------------------------ */}
      <Animated.View style={[styles.stageWrap, { transform: [{ rotate: swingRotate }] }]}>
        <View style={styles.stageCast}>
          <View style={styles.stageContact}>
            <LinearGradient colors={llSurface.white} style={[styles.stage, llRing.faint]}>
              <TopHighlight radius={llRadius.xxl} />

              {/* The string: a recessed channel the beads hang from. */}
              <View style={styles.stringChannel} pointerEvents="none">
                <Sheen variant="trough" radius={2} />
              </View>
              {/* Clasps at each end, so it reads as a necklace not a row. */}
              <View style={[styles.clasp, styles.claspLeft]} pointerEvents="none" />
              <View style={[styles.clasp, styles.claspRight]} pointerEvents="none" />

              <View style={styles.beadRow}>
                {round.sequence.map((color, i) => (
                  <Bead
                    key={`${i}-${color}`}
                    color={color}
                    size={beadSize}
                    offsetY={droop(i, totalBeads)}
                  />
                ))}

                {/* The empty slot — a dashed ring that becomes a real bead. */}
                <Animated.View
                  style={{
                    transform: [
                      { translateY: droop(threaded, totalBeads) },
                      ...(slotFilled ? [{ translateX: slideX }, { scale: slideScale }] : [{ scale: targetScale }]),
                    ],
                  }}
                >
                  {slotFilled ? (
                    <Bead color={round.answer} size={beadSize} landed />
                  ) : (
                    <View style={[styles.slot, { width: beadSize, height: beadSize, borderRadius: beadSize / 2 }, dragging && styles.slotArmed]}>
                      <Text style={[styles.slotMark, dragging && styles.slotMarkArmed]}>?</Text>
                    </View>
                  )}
                </Animated.View>
              </View>

              {/* The repeating unit, bracketed. This is the teaching device:
                  the child sees the chunk, then predicts its repeat. */}
              <View style={[styles.unitRow, { width: (beadSize + 10) * unit - 10 }]} pointerEvents="none">
                <View style={styles.unitBracket} />
                <Text style={styles.unitLabel}>{unit === 2 ? 'repeats' : 'repeats'}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Animated.View>

      {/* THE BEAD BOWL ---------------------------------------------------- */}
      <View style={styles.bowlWrap}>
        <LinearGradient colors={['#F3EEFF', '#E6DEFA']} style={[styles.bowl, llRing.light]}>
          <Sheen variant="trough" radius={llRadius.sheet} />
          <Text style={styles.bowlHint}>Drag a bead onto the string</Text>
          <View style={styles.bowlRow}>
            {round.options.map((color) => (
              <BowlBead
                key={color}
                color={color}
                size={bowlBead}
                disabled={isProcessing}
                wrong={wrongColor === color}
                bounceScale={bounceScale}
                onLift={() => setDragging(color)}
                onDrop={(placed) => {
                  setDragging(null);
                  if (placed) handlePick(color);
                }}
              />
            ))}
          </View>
        </LinearGradient>
      </View>

      <ConfettiCannon ref={confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// A threaded bead. Glass sphere: coloured fill, specular highlight at the
// top-left, a white ring where it meets the string, and a contact shadow so
// it sits on the string rather than floating over it.
function Bead({ color, size, offsetY = 0, landed = false }) {
  return (
    <View
      style={[
        { transform: [{ translateY: offsetY }] },
        llElevation.tinted(color, { opacity: landed ? 0.55 : 0.34, radius: landed ? 16 : 10, height: 6, elevation: 3 }),
      ]}
    >
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 3, borderColor: ll.white }}>
        <SvgBead color={color} />
      </View>
    </View>
  );
}

// A loose bead in the bowl. PanResponder gives it real weight: it lifts and
// grows slightly on touch, follows the finger, and either threads onto the
// string or springs home. A plain tap counts as a placement too.
function BowlBead({ color, size, disabled, wrong, bounceScale, onLift, onDrop }) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lift = useRef(new Animated.Value(0)).current;
  const moved = useRef(false);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        moved.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Animated.spring(lift, { toValue: 1, friction: 6, tension: 220, useNativeDriver: true }).start();
        onLift?.();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4) moved.current = true;
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        // Dragged up toward the necklace, or simply tapped: both are a
        // placement attempt. Anything else is "put it back".
        const placed = gesture.dy < PLACE_THRESHOLD || !moved.current;
        Animated.parallel([
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 160, useNativeDriver: true }),
          Animated.spring(lift, { toValue: 0, friction: 6, tension: 220, useNativeDriver: true }),
        ]).start();
        onDrop?.(placed);
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 160, useNativeDriver: true }),
          Animated.spring(lift, { toValue: 0, friction: 6, tension: 220, useNativeDriver: true }),
        ]).start();
        onDrop?.(false);
      },
    }),
  ).current;

  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

  return (
    <View style={styles.bowlSlot}>
      {/* The dimple the bead rests in — visible while it's lifted away. */}
      <View style={[styles.dimple, { width: size * 0.82, height: size * 0.82, borderRadius: size }]} pointerEvents="none" />
      <Animated.View
        {...responder.panHandlers}
        style={{
          transform: [
            ...pan.getTranslateTransform(),
            { scale: wrong ? bounceScale : liftScale },
          ],
          zIndex: 5,
        }}
      >
        <Pressable
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Bead colour choice"
          style={llElevation.tinted(color, { opacity: 0.45, radius: 20, height: 12, elevation: 6 })}
        >
          <View style={[styles.bowlBeadBody, { width: size, height: size, borderRadius: size / 2 }]}>
            <SvgBead color={color} threaded={false} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// The length of the repeating unit. Tries 2 then 3 — the only two shapes this
// topic uses — and falls back to 2 so the bracket always has a sane width.
function detectUnit(seq) {
  for (const n of [2, 3]) {
    let ok = true;
    for (let i = n; i < seq.length; i++) {
      if (seq[i] !== seq[i % n]) { ok = false; break; }
    }
    if (ok) return n;
  }
  return 2;
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, alignSelf: 'stretch' },
  titlePill: { flex: 1, alignSelf: 'center' },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.purple, width: 11, height: 11, borderRadius: 6 },

  prompt: {
    ...llType.h4, color: ll.ink, marginTop: 20, marginBottom: 22,
    textAlign: 'center', paddingHorizontal: 24, letterSpacing: -0.2,
  },
  promptTarget: { color: ll.purple },

  stageWrap: { paddingHorizontal: 16, maxWidth: 620, width: '100%', alignItems: 'center' },
  stageCast: {
    borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.26, shadowRadius: 44,
    shadowOffset: { width: 0, height: 24 }, elevation: 12,
  },
  stageContact: {
    borderRadius: llRadius.xxl,
    shadowColor: '#2E2A63', shadowOpacity: 0.12, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  stage: {
    borderRadius: llRadius.xxl, paddingVertical: 30, paddingHorizontal: 20,
    overflow: 'hidden', alignItems: 'center',
  },

  // The string sits behind the beads, level with their centres.
  stringChannel: {
    position: 'absolute', left: 26, right: 26, top: 48, height: 4,
    borderRadius: 2, backgroundColor: '#CFC5EC', overflow: 'hidden',
  },
  clasp: {
    position: 'absolute', top: 42, width: 12, height: 16, borderRadius: 5,
    backgroundColor: '#C9BFE8', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  claspLeft: { left: 14 },
  claspRight: { right: 14 },

  beadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  slot: {
    borderWidth: 3, borderStyle: 'dashed', borderColor: '#B8AEE0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  slotArmed: { borderColor: ll.purple, backgroundColor: withAlpha(ll.purple, 0.12) },
  slotMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#9A93C7' },
  slotMarkArmed: { color: ll.purpleDeep },

  // The bracket under the repeating unit.
  unitRow: { marginTop: 16, alignItems: 'center' },
  unitBracket: {
    alignSelf: 'stretch', height: 10, borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 2, borderColor: withAlpha(ll.purple, 0.45),
  },
  unitLabel: {
    marginTop: 5, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.purpleDeep, textTransform: 'uppercase',
  },

  bowlWrap: { marginTop: 'auto', paddingHorizontal: 16, paddingBottom: 22, width: '100%', maxWidth: 620, alignSelf: 'center' },
  bowl: {
    borderRadius: llRadius.sheet, paddingTop: 14, paddingBottom: 22, paddingHorizontal: 18,
    alignItems: 'center', overflow: 'hidden',
  },
  bowlHint: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.4,
    color: ll.purpleDeep, textTransform: 'uppercase', marginBottom: 14, opacity: 0.75,
  },
  bowlRow: { flexDirection: 'row', justifyContent: 'center', gap: 26 },
  bowlSlot: { alignItems: 'center', justifyContent: 'center' },
  dimple: {
    position: 'absolute',
    backgroundColor: 'rgba(94,74,168,0.13)',
    borderTopWidth: 1, borderTopColor: 'rgba(70,50,140,0.12)',
  },
  bowlBeadBody: { overflow: 'hidden', borderWidth: 4, borderColor: ll.white },
});
