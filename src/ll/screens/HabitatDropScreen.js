import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill, StarChip } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import DragPiece, { Puff } from '../games/DragPiece';
import { ICON } from '../art';
import GameObject from '../objects';
import { buildRound, TOTAL_ROUNDS } from '../games/habitatDropData';
import { ll, llRadius, llRing, llType, withAlpha } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Land or Water or Sky?" — Animals (Junior KG).
//
// An animal drifts down under a parachute and the child *carries it home*.
// Dragging it over a habitat and letting go delivers it; the zone the finger
// is over lights up on the way, so the choice is visible before it's
// committed — a child can hover, think, and move on without penalty.
//
// The three zones are dioramas rather than buttons: the sky tile has clouds,
// the water tile has waves, the land tile has hills. A habitat you can
// recognise by its *look* is the point of the topic, so the tiles carry the
// same information as their labels for a child who can't read them yet.
//
// Tapping a zone still works exactly as before. That matters: the original
// interaction is the accessible one, and drag is the enrichment on top.
export default function HabitatDropScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { topicId = 'jk-ev-animals', subjectId = 'EVS', standardId = 'Junior KG', title = 'Animals',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongZone, setWrongZone] = useState(null);
  const [landing, setLanding] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: the zone the child's finger is currently over.
  const [hovered, setHovered] = useState(null);
  const [carrying, setCarrying] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const bob = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  const isMounted = useRef(true);
  const advanceTimeout = useRef(null);
  const wrongTimeout = useRef(null);

  // Measured zone rectangles, for hit-testing a release.
  const zoneBoxes = useRef([]);
  const zonesRow = useRef(null);
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

  // The parachute canopy rocks as it descends — slower than the bob, so the
  // two together never look mechanical.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  // ---------------------------------------------------------------------
  // Unchanged round logic, same signature.
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
  // ---------------------------------------------------------------------

  // Which zone is under this screen point? Boxes are stored in the zones
  // row's own coordinates and offset by the row's measured screen origin, so
  // this stays correct on any device without hardcoded numbers.
  function zoneAt(x, y) {
    const ox = rowOrigin.current.x;
    const oy = rowOrigin.current.y;
    return zoneBoxes.current.findIndex(
      (b) => b && x >= ox + b.x && x <= ox + b.x + b.w && y >= oy + b.y - 48 && y <= oy + b.y + b.h + 48,
    );
  }

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const slideX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-90, 0, 90] });
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const swayRotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });

  const compact = width < 360;
  const zoneW = Math.min((Math.min(width, 620) - 40 - 28) / 3, 118);

  return (
    <LinearGradient colors={['#D9EBFF', '#EAE6FF', '#FFF2E6']} locations={[0, 0.5, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      {/* Drifting clouds — the animal is falling through actual sky. */}
      <Cloud size={compact ? 58 : 74} top={120} left={-10} duration={9000} />
      <Cloud size={compact ? 40 : 52} top={196} left={width - 90} duration={11000} delay={1200} />

      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.pinkSoft} color={ll.pinkDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      <Text style={styles.prompt}>
        Where does the <Text style={styles.promptTarget}>{round.label}</Text> live?
      </Text>

      {/* THE DESCENT ------------------------------------------------------ */}
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.animalWrap,
            { transform: [{ translateY: landing === null ? bobY : 0 }, { translateX: landing !== null ? slideX : 0 }] },
            landing !== null && { opacity: slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }) },
          ]}
        >
          <DragPiece
            direction="any"
            threshold={30}
            liftTo={1.16}
            disabled={isProcessing}
            accessibilityLabel={`Carry the ${round.label} to its home`}
            onLift={() => setCarrying(true)}
            onMove={(gesture) => {
              const hit = zoneAt(gesture.moveX, gesture.moveY);
              setHovered(hit >= 0 ? hit : null);
            }}
            onDrop={(placed, gesture) => {
              setCarrying(false);
              setHovered(null);
              if (!placed || !gesture) return;
              const hit = zoneAt(gesture.moveX, gesture.moveY);
              if (hit >= 0) handlePick(round.zones[hit], hit, round.zones.length);
            }}
          >
            <View style={styles.animalStack}>
              {/* Canopy + shrouds, rocking as it falls. */}
              <Animated.View style={{ transform: [{ rotate: swayRotate }], alignItems: 'center' }}>
                <Text style={styles.parachute}>🪂</Text>
              </Animated.View>
              <View style={[styles.animalShadowCast, carrying && styles.animalShadowLifted]}>
                <LinearGradient colors={['#FFFFFF', '#F7F3FF']} style={[styles.animalDisc, llRing.light]}>
                  <Sheen variant="tile" radius={60} />
                  <TopHighlight radius={60} />
                  <GameObject id={round.id} emoji={round.emoji} size={66} accessibilityLabel={round.label} />
                </LinearGradient>
              </View>
              {landing !== null ? <Puff key={`land-${index}`} size={34} delay={220} style={{ bottom: -6 }} /> : null}
            </View>
          </DragPiece>
        </Animated.View>

        {/* Motion cue: the air it's drifting through. */}
        {!carrying && landing === null ? (
          <View style={styles.airLines} pointerEvents="none">
            <View style={[styles.airLine, { width: 46 }]} />
            <View style={[styles.airLine, { width: 28 }]} />
          </View>
        ) : null}
      </View>

      <Text style={styles.dragHint}>{carrying ? 'Drop it in the right home!' : 'Drag the animal to its home'}</Text>

      {/* THE HABITATS ----------------------------------------------------- */}
      <View
        style={styles.zones}
        ref={zonesRow}
        onLayout={() => {
          zonesRow.current?.measureInWindow?.((x, y) => {
            rowOrigin.current = { x, y };
          });
        }}
      >
        {round.zones.map((zone, i) => {
          const isWrong = wrongZone === zone.id;
          const isHover = hovered === i;
          const isTarget = landing === i;
          return (
            <Animated.View
              key={zone.id}
              onLayout={(e) => {
                const { x, y, width: w, height: h } = e.nativeEvent.layout;
                zoneBoxes.current[i] = { x, y, w, h };
              }}
              style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}
            >
              <Pressable
                onPress={() => handlePick(zone, i, round.zones.length)}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel={zone.label}
                style={({ pressed }) => [
                  styles.zoneCast,
                  { shadowColor: zone.deep },
                  (isHover || isTarget) && styles.zoneCastActive,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={[withAlpha(zone.color, 1), zone.deep]}
                  style={[
                    styles.zone,
                    { width: zoneW, height: compact ? 104 : 116 },
                    llRing.light,
                    (isHover || isTarget) && styles.zoneArmed,
                  ]}
                >
                  <Sheen variant="strong" radius={llRadius.xl} />
                  {/* Each habitat is drawn, not just labelled. */}
                  <Diorama id={zone.id} width={zoneW} />
                  <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                  <Text style={styles.zoneLabel}>{zone.label}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <ConfettiCannon ref={confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

// A habitat drawn from primitives — waves, clouds, hills. No art dependency,
// and it reads at a glance, which is the whole point of the topic.
function Diorama({ id, width }) {
  if (id === 'water') {
    return (
      <View style={styles.dioramaBase} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute', bottom: 6 + i * 9, left: -width * 0.1,
              width: width * 1.2, height: 10, borderRadius: 10,
              backgroundColor: withAlpha('#FFFFFF', 0.2 - i * 0.05),
            }}
          />
        ))}
      </View>
    );
  }
  if (id === 'sky') {
    return (
      <View style={styles.dioramaBase} pointerEvents="none">
        <View style={{ position: 'absolute', bottom: 14, left: 10, width: 34, height: 14, borderRadius: 10, backgroundColor: withAlpha('#FFFFFF', 0.3) }} />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 26, height: 11, borderRadius: 9, backgroundColor: withAlpha('#FFFFFF', 0.22) }} />
      </View>
    );
  }
  return (
    <View style={styles.dioramaBase} pointerEvents="none">
      <View style={{ position: 'absolute', bottom: -18, left: -10, width: width * 0.7, height: 44, borderRadius: 40, backgroundColor: withAlpha('#FFFFFF', 0.22) }} />
      <View style={{ position: 'absolute', bottom: -22, right: -14, width: width * 0.6, height: 40, borderRadius: 36, backgroundColor: withAlpha('#FFFFFF', 0.16) }} />
    </View>
  );
}

// A cloud that drifts across the sky and wraps around.
function Cloud({ size, top, left, duration, delay = 0 }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const opacity = v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.75, 0.75, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top, left, opacity,
        transform: [{ translateX }],
      }}
    >
      <View style={{ width: size, height: size * 0.42, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.8)' }} />
      <View style={{ position: 'absolute', top: -size * 0.16, left: size * 0.22, width: size * 0.5, height: size * 0.5, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.8)' }} />
    </Animated.View>
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

  prompt: {
    ...llType.h4, color: ll.ink, marginTop: 18, marginBottom: 4,
    textAlign: 'center', paddingHorizontal: 24, letterSpacing: -0.2,
  },
  promptTarget: { color: ll.pink },

  stage: { flex: 1, minHeight: 170, alignItems: 'center', justifyContent: 'center' },
  animalWrap: { alignItems: 'center' },
  animalStack: { alignItems: 'center' },
  parachute: { fontSize: 46 },
  animalShadowCast: {
    marginTop: -10, borderRadius: 60,
    shadowColor: '#5442A8', shadowOpacity: 0.28, shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  animalShadowLifted: { shadowOpacity: 0.42, shadowRadius: 34, shadowOffset: { width: 0, height: 22 } },
  animalDisc: {
    width: 96, height: 96, borderRadius: 48, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },

  airLines: { position: 'absolute', bottom: 6, alignItems: 'center', gap: 5, opacity: 0.4 },
  airLine: { height: 3, borderRadius: 3, backgroundColor: '#9A93C7' },

  dragHint: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.4,
    color: ll.purpleDeep, textTransform: 'uppercase', opacity: 0.75, marginBottom: 12,
  },

  zones: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingBottom: 30 },
  zoneCast: {
    borderRadius: llRadius.xl,
    shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  zoneCastActive: { shadowOpacity: 0.62, shadowRadius: 32, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
  zone: {
    borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center',
    gap: 4, overflow: 'hidden',
  },
  zoneArmed: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.95)' },
  zoneEmoji: { fontSize: 34 },
  zoneLabel: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.3)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 },
  },
  dioramaBase: { ...StyleSheet.absoluteFillObject },
});
