import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { COINS, TOTAL_ROUNDS, buildRound } from '../moneyData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, withAlpha } from '../ll/tokens';

// "Make the Amount" — Money (Senior KG).
//
// Tap coins until they add up to the target, then press Done.
//
// The environment is a shop counter: a wooden till top, a price tag showing
// what's owed, and a change mat where the child lays coins out. That framing
// is the lesson — money is counted onto a surface in front of a shopkeeper,
// and "does this add up" is a question you answer by looking at what you've
// put down.
//
// The real teaching addition is the progress bar under the total. Counting to
// an exact amount is the one task here, and a child needs to know whether
// they're short or over *before* pressing Done. The bar fills toward the
// target and turns amber past it, so overshooting is visible as overshooting
// rather than as a wrong answer after the fact. Nothing about scoring
// changes: Done still validates `total === round.target` exactly as before.
//
// The coin tray, per-coin take-back, reset and the Completion hand-off are
// unchanged.
export default function MakeAmountScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-money';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState([]); // coin values tapped this round
  const [wrongPulse, setWrongPulse] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const round = buildRound(index);
  const total = picked.reduce((sum, v) => sum + v, 0);

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
    setPicked([]);
    speak(`Make ${round.target} rupees using the coins`, { rate: 0.95, pitch: 1.15 });
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
  // Unchanged coin and validation logic.
  function addCoin(value) {
    if (isProcessing) return;
    Haptics.selectionAsync();
    setPicked((prev) => [...prev, value]);
  }

  function resetCoins() {
    if (isProcessing) return;
    setPicked([]);
    Haptics.selectionAsync();
  }

  // Overshooting previously had no fix except a full reset, which is a harsh
  // penalty for one misplaced coin — tapping a placed coin takes just it back.
  function removeCoinAt(index) {
    if (isProcessing) return;
    setPicked((prev) => prev.filter((_, i) => i !== index));
    Haptics.selectionAsync();
  }

  function handleDone() {
    if (isProcessing || picked.length === 0) return;

    if (total === round.target) {
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
      speak(`Yes! That's ${round.target} rupees!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'MakeAmount',
            title: 'Money Master!',
            subtitle: `You made every amount!`,
          });
        }
      }, 1400);
    } else {
      setWrongPulse(true);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak(total > round.target ? "That's too much! Try again." : "Not quite enough! Try again.", { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongPulse(false);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  const exact = total === round.target;
  const over = total > round.target;
  const fill = round.target ? Math.min(1, total / round.target) : 0;

  return (
    <LinearGradient colors={['#FFF6E4', '#F7F0FF', '#EEF3FF']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Money" bg={ll.amberSoft} color={ll.amberInk} style={styles.titlePill} />
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

      {/* THE PRICE TAG — what's owed. ---------------------------------- */}
      <View style={styles.tagCast}>
        <LinearGradient colors={['#FFFBF0', '#FFF0D2']} style={styles.tag}>
          <View style={styles.tagHole} pointerEvents="none" />
          <Text style={styles.tagLead}>TO PAY</Text>
          <Text style={styles.tagAmount}>₹{round.target}</Text>
        </LinearGradient>
      </View>

      {/* THE COUNTER — total, and how close it is. --------------------- */}
      <Animated.View
        style={[
          styles.counterCast,
          exact && { shadowColor: ll.greenDeep, shadowOpacity: 0.4 },
          wrongPulse && { transform: [{ translateX: shakeTranslate }] },
        ]}
      >
        <LinearGradient colors={llSurface.white} style={[styles.counter, exact ? styles.counterOk : over ? styles.counterOver : llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          <Text style={[styles.totalText, exact && { color: ll.greenDeep }, over && { color: ll.clay }]}>
            ₹{total}
          </Text>

          {/* Short / exact / over, before Done is pressed. */}
          <View style={styles.gauge}>
            <View style={[styles.gaugeFill, { width: `${fill * 100}%` }, exact && styles.gaugeOk, over && styles.gaugeOver]} />
          </View>
          <Text style={[styles.gaugeLabel, exact && { color: ll.greenDeep }, over && { color: ll.clay }]}>
            {exact ? 'Exactly right!' : over ? `₹${total - round.target} too much` : `₹${round.target - total} to go`}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* THE CHANGE MAT — coins laid out. ----------------------------- */}
      <View style={styles.mat}>
        {picked.length === 0 ? (
          <Text style={styles.matEmpty}>Lay coins here</Text>
        ) : (
          <View style={styles.matRow}>
            {picked.map((v, i) => (
              <Pressable
                key={i}
                onPress={() => removeCoinAt(i)}
                accessibilityRole="button"
                accessibilityLabel="Remove this coin"
                style={({ pressed }) => [styles.laidCoin, pressed && { transform: [{ scale: 0.92 }] }]}
              >
                <GameObject id="coin" emoji={COINS.find((c) => c.value === v)?.emoji} size={26} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {picked.length > 0 && <Text style={styles.pickedHint}>Tap a coin to take it back</Text>}

      {/* THE COIN TRAY ------------------------------------------------- */}
      <View style={styles.trayCast}>
        <LinearGradient colors={['#D9BE96', '#BE9C70']} style={styles.tray}>
          <View style={styles.coinRow}>
            {COINS.map((coin) => (
              <Pressable
                key={coin.value}
                onPress={() => addCoin(coin.value)}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel={coin.label}
                style={({ pressed }) => [styles.wellCast, pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] }]}
              >
                {/* Each denomination sits in its own well. */}
                <View style={[styles.well, { width: compact ? 74 : 82, height: compact ? 74 : 82 }]}>
                  <GameObject id="coin" emoji={coin.emoji} size={compact ? 34 : 38} />
                  <Text style={styles.coinLabel}>{coin.label}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={resetCoins}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Reset coins"
          style={({ pressed }) => [styles.resetButton, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <Text style={styles.resetText}>Reset ↺</Text>
        </Pressable>

        <Pressable
          onPress={handleDone}
          disabled={isProcessing || picked.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Done"
          style={({ pressed }) => [
            styles.doneCast,
            picked.length === 0 && { shadowOpacity: 0.08 },
            pressed && { transform: [{ translateY: 2 }] },
          ]}
        >
          <LinearGradient
            colors={picked.length === 0 ? [ll.lilac, ll.lilac] : [ll.greenLight, ll.greenDeep]}
            style={styles.doneButton}
          >
            {picked.length > 0 ? <Sheen variant="strong" radius={llRadius.pill} /> : null}
            <Text style={[styles.doneText, picked.length === 0 && { color: ll.muted }]}>Done ✓</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.View style={{ transform: [{ scale: popScale }] }}>
            <GameObject id="coin" emoji="🪙" size={90} />
          </Animated.View>
          <Text style={styles.celebrationText}>₹{round.target} exactly!</Text>
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

  tagCast: {
    marginTop: 12,
    shadowColor: '#B07C12', shadowOpacity: 0.26, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  tag: {
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 26, alignItems: 'center',
    borderWidth: 1.5, borderColor: withAlpha(ll.amber, 0.5),
  },
  tagHole: {
    position: 'absolute', top: 7, left: 8, width: 7, height: 7, borderRadius: 4,
    backgroundColor: 'rgba(150,112,43,0.35)',
  },
  tagLead: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8.5, letterSpacing: 1.4, color: ll.amberInk },
  tagAmount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: ll.clay },

  counterCast: {
    marginTop: 12, borderRadius: llRadius.xl, alignSelf: 'stretch',
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 6,
  },
  counter: {
    borderRadius: llRadius.xl, paddingVertical: 11, paddingHorizontal: 20,
    alignItems: 'center', overflow: 'hidden',
  },
  counterOk: { borderWidth: 3, borderColor: ll.green },
  counterOver: { borderWidth: 3, borderColor: withAlpha(ll.clay, 0.5) },
  totalText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40, color: ll.ink },

  // Short / exact / over, visible before committing.
  gauge: {
    alignSelf: 'stretch', height: 9, borderRadius: 5, marginTop: 4,
    backgroundColor: 'rgba(139,134,184,0.16)', overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 5, backgroundColor: ll.amberWarm },
  gaugeOk: { backgroundColor: ll.green },
  gaugeOver: { backgroundColor: ll.clay },
  gaugeLabel: {
    marginTop: 4, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 0.8, color: ll.muted,
  },

  mat: {
    alignSelf: 'stretch', minHeight: 46, marginTop: 10, borderRadius: llRadius.md,
    backgroundColor: 'rgba(126,110,200,0.07)', padding: 7,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(126,110,200,0.22)',
  },
  matEmpty: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.2, color: ll.muted },
  matRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3 },
  laidCoin: { padding: 1 },
  pickedHint: { fontFamily: 'Nunito_700Bold', fontSize: 10, color: ll.muted, marginTop: 4 },

  trayCast: {
    marginTop: 12, borderRadius: llRadius.lg,
    shadowColor: '#8A5E34', shadowOpacity: 0.3, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 7,
  },
  tray: {
    borderRadius: llRadius.lg, padding: 9,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)',
  },
  coinRow: { flexDirection: 'row', gap: 9 },
  wellCast: { borderRadius: llRadius.md },
  // A recessed well per denomination — dark at the top edge.
  well: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: 'rgba(90,60,30,0.3)',
    borderTopWidth: 1.5, borderTopColor: 'rgba(60,38,16,0.4)',
    borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.28)',
  },
  coinLabel: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: ll.white,
    textShadowColor: 'rgba(40,24,8,0.4)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
  },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' },
  resetButton: {
    paddingVertical: 11, paddingHorizontal: 18, borderRadius: llRadius.pill,
    backgroundColor: 'rgba(126,110,200,0.14)',
    borderWidth: 1, borderColor: 'rgba(126,110,200,0.22)',
  },
  resetText: { fontFamily: 'Nunito_800ExtraBold', color: ll.soft, fontSize: 13 },
  doneCast: {
    borderRadius: llRadius.pill,
    shadowColor: ll.greenDeep, shadowOpacity: 0.42, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 7,
  },
  doneButton: {
    paddingVertical: 12, paddingHorizontal: 30, borderRadius: llRadius.pill,
    overflow: 'hidden', alignItems: 'center',
  },
  doneText: {
    fontFamily: 'Baloo2_800ExtraBold', color: ll.white, fontSize: 17,
    textShadowColor: 'rgba(20,60,40,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.greenDeep, marginTop: 8 },
});
