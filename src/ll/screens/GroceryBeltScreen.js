import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { IconButton, Pill, StarChip } from '../kit';
import { BeltTread, Sheen, TopHighlight } from '../premium';
import { ICON } from '../art';
import GameObject from '../objects';
import { buildRound, TOTAL_ROUNDS } from '../games/groceryBeltData';
import { ll, llElevation, llGradients, llRadius, llRing, llSurface, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// "Grocery Belt" — Everyday Words (Junior KG).
//
// Four items sit on a conveyor belt; Birdie names one and the child taps it.
// A correct tap flies the item up into the shopping bag rather than just
// disappearing — that flight is the whole visual distinction from a plain
// answer grid, and it costs nothing in interaction complexity: the tap target
// is still a stationary card, so there's no reflex-timing risk.
//
// The round loop below is unchanged from the original screen. What changed is
// the presentation: the belt is a real striped tread sunk into a trough, the
// items are moulded carts with contact shadows and shaded wheels, and the bag
// reads as the destination it is. The prompt highlights the target word the
// way the design does, so a pre-reader can match on colour alone.
const WRONG_BEFORE_HINT = 2;

export default function GroceryBeltScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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

  // The belt spans the screen minus the stage padding. Deriving it here keeps
  // the tread's stripe pitch constant from a small phone to a tablet.
  const beltWidth = Math.max(240, Math.min(width, 620) - 40);
  // Two cards per row below ~360pt so nothing clips on a small phone.
  const cardSize = width < 360 ? 76 : 84;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={title} bg={ll.pinkSoft} color={ll.pinkDeep} style={styles.titlePill} />
        {/* The catch destination. Tinted pink so the flight has a visible target. */}
        <View style={[llElevation.tinted(ll.pink, { opacity: 0.26, radius: 18, height: 8, elevation: 4 }), { borderRadius: 16 }]}>
          <View style={[llElevation.contact, { borderRadius: 16 }]}>
            <LinearGradient colors={llSurface.whitePink} style={[styles.bag, llRing.light]}>
              <TopHighlight radius={16} />
              <Text style={styles.bagEmoji}>🛍️</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View key={i} style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* The target word carries the subject colour, as in the design — a
          pre-reader can hold a colour in mind more easily than a word. */}
      <Text style={styles.prompt}>
        Which one is the <Text style={styles.promptTarget}>{round.target.label}</Text>?
      </Text>

      <View style={styles.beltWrap}>
        {/* Striped tread, sunk into a trough with a gloss wash over it. */}
        <View style={[styles.treadHolder, { width: beltWidth }]} pointerEvents="none">
          {/* The belt runs while the child is choosing and stops the moment a
              correct item is on its way to the bag — the stillness is part of
              the reward. */}
          <BeltTread width={beltWidth} height={54} radius={15} running={!isProcessing} speed={1700} />
        </View>

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
                  onPress={() => handlePick(item)}
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [pressed && !isProcessing && styles.itemPressed]}
                >
                  {/* Cast shadow on the outside, contact shadow inside it — the
                      cart sits *on* the belt instead of hovering over it. */}
                  <View style={[styles.itemCast, isWrong && styles.itemCastWrong, isHintTarget && styles.itemCastHint]}>
                    <View style={styles.itemContact}>
                      <LinearGradient
                        colors={isWrong ? ['#FFFFFF', '#FFF1F5'] : llSurface.white}
                        style={[
                          styles.item,
                          { width: cardSize, height: cardSize + 2 },
                          isWrong ? styles.itemRingWrong : llRing.faint,
                          isHintTarget && styles.itemRingHint,
                        ]}
                      >
                        <Sheen variant="tile" radius={llRadius.lg} />
                        <TopHighlight radius={llRadius.lg} />
                        <GameObject id={item.id} emoji={item.emoji} size={44} accessibilityLabel={item.label} />
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Wheels, shaded and shadowed so they read as under the cart. */}
                  <View style={[styles.wheelRow, { width: cardSize * 0.72 }]} pointerEvents="none">
                    <LinearGradient colors={['#5B5288', '#3B3462']} style={styles.wheel} />
                    <LinearGradient colors={['#5B5288', '#3B3462']} style={styles.wheel} />
                  </View>

                  {/* Motion lines on a wrong tap, matching the design's tildes. */}
                  {isWrong ? (
                    <>
                      <Text style={[styles.tilde, styles.tildeLeft]}>∼</Text>
                      <Text style={[styles.tilde, styles.tildeRight]}>∼</Text>
                    </>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.starsRow}>
        <StarChip count={stars} />
      </View>

      <ConfettiCannon ref={confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, alignSelf: 'stretch' },
  titlePill: { flex: 1, alignSelf: 'center' },
  bag: {
    width: 44, height: 44, borderRadius: 16, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  bagEmoji: { fontSize: 22 },

  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14, maxWidth: 260 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { backgroundColor: ll.pink, width: 11, height: 11, borderRadius: 6 },

  prompt: {
    ...llType.h4, color: ll.ink, marginTop: 22, marginBottom: 26,
    textAlign: 'center', paddingHorizontal: 24, letterSpacing: -0.2,
  },
  promptTarget: { color: ll.pink },

  beltWrap: { width: '100%', paddingHorizontal: 20, alignItems: 'center', position: 'relative' },
  // The tread sits behind the carts, level with their wheels.
  treadHolder: { position: 'absolute', top: 44 },

  belt: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  itemWrap: { borderRadius: llRadius.lg, paddingBottom: 16 },
  itemPressed: { transform: [{ scale: 0.96 }] },

  itemCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 6,
  },
  itemCastWrong: { shadowColor: ll.pink, shadowOpacity: 0.3, shadowRadius: 22 },
  itemCastHint: { shadowColor: ll.amberWarm, shadowOpacity: 0.34, shadowRadius: 20 },
  itemContact: {
    borderRadius: llRadius.lg,
    shadowColor: '#2E2A63', shadowOpacity: 0.12, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  item: {
    borderRadius: llRadius.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  itemRingWrong: { borderWidth: 2, borderColor: '#FFB3C9' },
  itemRingHint: { borderWidth: 2, borderColor: ll.amber },

  wheelRow: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  wheel: {
    width: 15, height: 15, borderRadius: 8,
    shadowColor: '#281A5A', shadowOpacity: 0.35, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },

  tilde: { position: 'absolute', top: 26, fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: ll.pink },
  tildeLeft: { left: -18 },
  tildeRight: { right: -18 },

  starsRow: { marginTop: 34 },
});
