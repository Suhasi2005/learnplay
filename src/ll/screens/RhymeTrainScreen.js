import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Floating, IconButton, Pill, StarChip } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import DragPiece, { Puff, Rail } from '../games/DragPiece';
import { ICON } from '../art';
import { buildRound, TOTAL_ROUNDS } from '../games/rhymeTrainData';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';
import GameObject from '../objects';

// "Rhyme Train" — Rhymes & Stories (Junior KG).
//
// The child builds a train out of rhymes. Carriages wait on a siding rail;
// dragging one toward the engine couples it onto the train with a hook, a
// puff of steam and a lurch. Finishing the topic leaves a whole train of
// every rhyme learned — the progress bar *is* the toy.
//
// The teaching device is the rime. "Cat" and "Hat" rhyme because they share
// "-at", so the shared ending is drawn in colour on the target sign and on
// every carriage. A child who can't yet read whole words can still match two
// coloured letter-shapes, which is exactly the pre-reading skill this topic
// is for. The rime is computed from the words themselves (longest common
// suffix), so rhymeTrainData.js needs no new fields.
export default function RhymeTrainScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { topicId = 'jk-en-rhymes', subjectId = 'English', standardId = 'Junior KG', title = 'Rhymes & Stories',
    startIndex = 0, startStars = 0 } = route.params ?? {};

  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [wrongLabel, setWrongLabel] = useState(null);
  const [collected, setCollected] = useState([]); // emojis of coupled cars
  const [isProcessing, setIsProcessing] = useState(false);
  // Presentation-only: the carriage currently in the child's hand.
  const [carried, setCarried] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const { speak, playSuccess, playWrong, playComplete } = useSound();
  const confetti = useRef(null);
  const shake = useRef(new Animated.Value(0)).current;
  const couple = useRef(new Animated.Value(0)).current;
  // The train lurching forward as a new carriage locks on.
  const lurch = useRef(new Animated.Value(0)).current;
  // The engine's idle chuff, and the coupling hook's glow while carrying.
  const armed = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!carried) {
      armed.stopAnimation();
      Animated.timing(armed, { toValue: 0, duration: 180, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(armed, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(armed, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [carried]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function lurchTrain() {
    lurch.setValue(0);
    Animated.sequence([
      Animated.timing(lurch, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(lurch, { toValue: 0, friction: 4, tension: 150, useNativeDriver: true }),
    ]).start();
  }

  // ---------------------------------------------------------------------
  // Unchanged round logic.
  function handlePick(option) {
    if (isProcessing) return;

    if (option.label === round.answerLabel) {
      setIsProcessing(true);
      couple.setValue(0);
      Animated.spring(couple, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
      lurchTrain();

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
  // ---------------------------------------------------------------------

  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });
  const coupleScale = couple.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const lurchX = lurch.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const hookScale = armed.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const hookOpacity = armed.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  const compact = width < 360;
  const carW = compact ? 92 : 104;
  const railWidth = Math.min(width, 620) - 40;
  const rime = round.target.label.slice(-longestSuffix(round.target.label, round.answerLabel)).toLowerCase();

  return (
    <LinearGradient colors={['#DCEAFF', '#EDE6FF', '#FFF3E9']} locations={[0, 0.52, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      {/* Hills behind the track — cheap depth, no art needed. */}
      <View style={styles.hillFar} pointerEvents="none" />
      <View style={styles.hillNear} pointerEvents="none" />

      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.blueSoft} color={ll.blueDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      {/* THE TRAIN -------------------------------------------------------- */}
      <View style={styles.trainZone}>
        <Animated.View style={[styles.trainStrip, { transform: [{ translateX: lurchX }] }]}>
          <Floating duration={2600} distance={2}>
            <View style={styles.engineWrap}>
              <Text style={styles.engine}>🚂</Text>
              {isProcessing ? <Puff key={`steam-${index}`} size={30} delay={60} style={{ top: -6, left: 6 }} /> : null}
            </View>
          </Floating>

          {/* The coupling hook lights up while a carriage is being carried. */}
          <Animated.View
            style={[styles.hook, { opacity: hookOpacity, transform: [{ scale: hookScale }] }]}
            pointerEvents="none"
          />

          {collected.map((emoji, i) => (
            <Animated.View
              key={i}
              style={[
                styles.coupled,
                i === collected.length - 1 && { transform: [{ scale: coupleScale }] },
              ]}
            >
              <GameObject emoji={emoji} size={22} />
              <View style={styles.coupledWheels}>
                <View style={styles.miniWheel} />
                <View style={styles.miniWheel} />
              </View>
            </Animated.View>
          ))}

          {Array.from({ length: Math.max(0, TOTAL_ROUNDS - collected.length) }, (_, i) => (
            <View key={`empty-${i}`} style={styles.ghostCar} />
          ))}
        </Animated.View>
        <Rail width={railWidth} sleepers={14} style={styles.trainRail} />
      </View>

      {/* THE TARGET SIGN -------------------------------------------------- */}
      <View style={styles.signWrap}>
        <View style={styles.signCast}>
          <LinearGradient colors={llSurface.whiteBlue} style={[styles.sign, llRing.faint]}>
            <TopHighlight radius={llRadius.xl} />
            <GameObject id={round.target.label} emoji={round.target.emoji} size={54} accessibilityLabel={round.target.label} />
            <Word label={round.target.label} rime={rime} big />
          </LinearGradient>
        </View>
        <View style={styles.signPost} />
      </View>

      <Text style={styles.prompt}>
        Which carriage rhymes with <Text style={styles.promptTarget}>{round.target.label}</Text>?
      </Text>

      {/* THE SIDING ------------------------------------------------------- */}
      <View style={styles.sidingWrap}>
        <View style={styles.cars}>
          {round.options.map((opt) => {
            const isWrong = wrongLabel === opt.label;
            const optRime = opt.label.slice(-longestSuffix(round.target.label, opt.label)).toLowerCase();
            const shows = optRime.length >= 2 ? optRime : null;
            return (
              <DragPiece
                key={opt.label}
                direction="up"
                threshold={46}
                disabled={isProcessing}
                accessibilityLabel={opt.label}
                onLift={() => setCarried(opt.label)}
                onDrop={(placed) => {
                  setCarried(null);
                  if (placed) handlePick(opt);
                }}
              >
                <Animated.View style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}>
                  <View style={[styles.carCast, isWrong && styles.carCastWrong, carried === opt.label && styles.carCastLifted]}>
                    <LinearGradient
                      colors={isWrong ? ['#FFFFFF', '#FFF1F5'] : llSurface.white}
                      style={[styles.car, { width: carW }, isWrong ? styles.carRingWrong : llRing.faint]}
                    >
                      <Sheen variant="tile" radius={llRadius.lg} />
                      <TopHighlight radius={llRadius.lg} />
                      <GameObject id={opt.label} emoji={opt.emoji} size={40} accessibilityLabel={opt.label} />
                      <Word label={opt.label} rime={shows} />
                      {/* Buffer bar on the coupling side. */}
                      <View style={styles.buffer} pointerEvents="none" />
                    </LinearGradient>
                  </View>
                  <View style={[styles.wheelRow, { width: carW * 0.62 }]} pointerEvents="none">
                    <LinearGradient colors={['#5B5288', '#3B3462']} style={styles.wheel} />
                    <LinearGradient colors={['#5B5288', '#3B3462']} style={styles.wheel} />
                  </View>
                </Animated.View>
              </DragPiece>
            );
          })}
        </View>
        <Rail width={railWidth} sleepers={14} style={styles.sidingRail} />
        <Text style={styles.sidingHint}>Drag a carriage up to the train</Text>
      </View>

      <ConfettiCannon ref={confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

// A word with its rime picked out in colour. The onset stays ink-dark so the
// contrast does the teaching: same-coloured tail = rhyme.
function Word({ label, rime, big = false }) {
  const size = big ? styles.wordBig : styles.wordSmall;
  if (!rime || !label.toLowerCase().endsWith(rime)) {
    return <Text style={[size, styles.wordInk]}>{label}</Text>;
  }
  const cut = label.length - rime.length;
  return (
    <Text style={[size, styles.wordInk]}>
      {label.slice(0, cut)}
      <Text style={styles.wordRime}>{label.slice(cut)}</Text>
    </Text>
  );
}

// Length of the longest shared ending between two words, capped at 3 — beyond
// that it stops being a rime and starts being the whole word.
function longestSuffix(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  let n = 0;
  while (n < Math.min(x.length, y.length, 3) && x[x.length - 1 - n] === y[y.length - 1 - n]) n++;
  return n;
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },

  hillFar: {
    position: 'absolute', left: -60, right: -60, top: 150, height: 260,
    borderRadius: 300, backgroundColor: withAlpha('#B9CDF5', 0.35),
  },
  hillNear: {
    position: 'absolute', left: -90, right: -40, top: 230, height: 300,
    borderRadius: 320, backgroundColor: withAlpha('#C9BEF0', 0.3),
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, alignSelf: 'stretch' },
  titlePill: { flex: 1, alignSelf: 'center' },

  trainZone: { marginTop: 18, alignItems: 'center', alignSelf: 'stretch' },
  trainStrip: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 3,
    paddingHorizontal: 20, flexWrap: 'wrap', justifyContent: 'center',
  },
  engineWrap: { alignItems: 'center', justifyContent: 'center' },
  engine: { fontSize: 30 },
  hook: {
    width: 9, height: 4, borderRadius: 2, backgroundColor: ll.blue, marginBottom: 12,
  },
  coupled: {
    width: 30, height: 28, borderRadius: 9, backgroundColor: withAlpha(ll.blue, 0.14),
    borderWidth: 1.5, borderColor: withAlpha(ll.blue, 0.5),
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  coupledEmoji: { fontSize: 15 },
  coupledWheels: { position: 'absolute', bottom: -5, flexDirection: 'row', gap: 12 },
  miniWheel: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A4270' },
  ghostCar: {
    width: 30, height: 28, borderRadius: 9, marginBottom: 4,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: withAlpha('#8B86B8', 0.4),
  },
  trainRail: { marginTop: 2 },

  signWrap: { marginTop: 16, alignItems: 'center' },
  signCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 }, elevation: 10,
  },
  sign: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 30,
    alignItems: 'center', gap: 2, overflow: 'hidden',
  },
  signEmoji: { fontSize: 48 },
  signPost: { width: 14, height: 18, backgroundColor: '#C9BFE8', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },

  prompt: {
    ...llType.body, color: ll.body, marginTop: 12, marginBottom: 10,
    textAlign: 'center', paddingHorizontal: 24,
  },
  promptTarget: { fontFamily: 'Nunito_800ExtraBold', color: ll.blueDeep },

  sidingWrap: { marginTop: 'auto', paddingBottom: 26, alignItems: 'center', alignSelf: 'stretch' },
  cars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingHorizontal: 20 },
  carCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 6,
  },
  carCastLifted: { shadowColor: ll.blue, shadowOpacity: 0.36, shadowRadius: 28 },
  carCastWrong: { shadowColor: ll.pink, shadowOpacity: 0.3, shadowRadius: 22 },
  car: {
    height: 96, borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center',
    gap: 3, overflow: 'hidden',
  },
  carRingWrong: { borderWidth: 2, borderColor: '#FFB3C9' },
  buffer: {
    position: 'absolute', top: '50%', right: 0, width: 5, height: 18,
    borderTopLeftRadius: 3, borderBottomLeftRadius: 3, backgroundColor: withAlpha(ll.blue, 0.35),
  },
  wheelRow: {
    position: 'absolute', bottom: -7, alignSelf: 'center',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  wheel: {
    width: 16, height: 16, borderRadius: 8,
    shadowColor: '#281A5A', shadowOpacity: 0.35, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  sidingRail: { marginTop: 12 },
  sidingHint: {
    marginTop: 10, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.blueDeep, textTransform: 'uppercase', opacity: 0.7,
  },

  wordBig: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 26 },
  wordSmall: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, lineHeight: 18 },
  wordInk: { color: ll.ink, textAlign: 'center' },
  wordRime: { color: ll.pink },
});
