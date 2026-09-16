import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_LEVELS, buildLevel } from '../oppositesData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Opposites Match" — Opposites (Senior KG).
//
// Tap two cards that are opposites. A matched pair used to shrink to nothing,
// leaving a blank gap — so the board emptied out and the child's completed
// work disappeared.
//
// Now a matched pair leaves a **record** in its own slot: the two objects
// side by side with a ↔ between them. The board fills up with the pairs the
// child has made instead of emptying, and each finished pair stays visible as
// the thing being taught — "hot ↔ cold" is a relationship, and a relationship
// needs both halves on screen to exist at all.
//
// Cards sit on a felt game mat, the surface a matching game is actually
// played on. The round loop, the `saveProgress(GAME_ID, level, …)` call and
// the Completion hand-off are unchanged.
function Card({ card, state, onPress, size }) {
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'matched') {
      Animated.timing(scale, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [state]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const selected = state === 'selected';

  return (
    // Fixed-size slot so a matched card shrinking to scale:0 doesn't reflow
    // the grid — it leaves the slot for the pair record to occupy.
    <View style={[styles.cardSlot, { width: size, height: size * 1.22 }]} pointerEvents={state === 'matched' ? 'none' : 'auto'}>
      <Animated.View style={{ transform: [{ translateX }, { scale }] }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={card.label}
          style={({ pressed }) => [
            styles.cardCast,
            selected && { shadowColor: ll.purpleDeep, shadowOpacity: 0.45, shadowRadius: 20, elevation: 9 },
            state === 'wrong' && { shadowColor: ll.pink, shadowOpacity: 0.4 },
            selected && { transform: [{ translateY: -4 }] },
            pressed && { transform: [{ translateY: 2 }, { scale: 0.97 }] },
          ]}
        >
          <LinearGradient
            colors={selected ? ['#F6F1FF', '#E9DEFF'] : llSurface.white}
            style={[
              styles.card,
              { width: size, height: size * 1.22 },
              selected ? styles.cardSelected : state === 'wrong' ? styles.cardWrong : llRing.faint,
            ]}
          >
            <Sheen variant="tile" radius={llRadius.md} />
            <TopHighlight radius={llRadius.md} />
            <GameObject id={card.id} emoji={card.emoji} size={size * 0.44} />
            <Text style={styles.cardLabel} numberOfLines={1} adjustsFontSizeToFit>{card.label}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// What a solved pair leaves behind: both halves, joined.
function PairRecord({ a, b, size }) {
  return (
    <View style={[styles.record, { width: size, height: size * 1.22 }]} pointerEvents="none">
      <View style={styles.recordRow}>
        <GameObject id={a?.id} emoji={a?.emoji} size={size * 0.3} />
        <Text style={styles.recordArrow}>↔</Text>
        <GameObject id={b?.id} emoji={b?.emoji} size={size * 0.3} />
      </View>
      <Text style={styles.recordLabel} numberOfLines={1} adjustsFontSizeToFit>
        {a?.label} ↔ {b?.label}
      </Text>
    </View>
  );
}

export default function OppositesMatchScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'sk-ma-opposites';

  const { speak, playSuccess, playWrong } = useSound();
  const [level, setLevel] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const cards = useMemo(() => buildLevel(level), [level]);
  const confettiRef = useRef(null);
  const isMounted = useRef(true);
  const timeoutRef = useRef(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setSelectedId(null);
    setWrongIds([]);
    setMatchedPairIds([]);
    speak('Tap two cards that are opposites', { rate: 0.95, pitch: 1.15 });
  }, [level]);

  function cardState(card) {
    if (matchedPairIds.includes(card.pairId)) return 'matched';
    if (wrongIds.includes(card.id)) return 'wrong';
    if (selectedId === card.id) return 'selected';
    return 'idle';
  }

  // ---------------------------------------------------------------------
  // Unchanged matching logic.
  function handlePress(card) {
    if (isProcessing || matchedPairIds.includes(card.pairId) || card.id === selectedId) return;

    if (!selectedId) {
      setSelectedId(card.id);
      return;
    }

    const firstCard = cards.find((c) => c.id === selectedId);
    if (firstCard.pairId === card.pairId) {
      setIsProcessing(true);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setSelectedId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${firstCard.label} and ${card.label} are opposites!`, { rate: 0.95, pitch: 1.15 });
      confettiRef.current?.start();

      const nextMatched = [...matchedPairIds, card.pairId];
      setMatchedPairIds(nextMatched);
      saveProgress(GAME_ID, level, newStars);

      timeoutRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        setIsProcessing(false);
        if (nextMatched.length === cards.length / 2) {
          if (level + 1 < TOTAL_LEVELS) {
            setLevel((l) => l + 1);
          } else {
            navigation.replace('Completion', {
              gameId: GAME_ID,
              stars: newStars,
              total: TOTAL_LEVELS,
              replayScreen: 'OppositesMatch',
              title: 'Opposites Master!',
              subtitle: 'You matched every pair!',
            });
          }
        }
      }, 900);
    } else {
      setWrongIds([selectedId, card.id]);
      // Clear the selection right away so a fast third tap starts a fresh
      // pick instead of comparing against a card already mid-shake.
      setSelectedId(null);
      setStreak(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) setWrongIds([]);
      }, 500);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const size = compact ? 74 : 84;
  const totalPairs = cards.length / 2;

  // For each matched pair, the two cards that formed it — used for the record.
  const recordFor = (pairId) => cards.filter((c) => c.pairId === pairId);
  // The slot a pair's record occupies: the first of its two cards.
  const recordSlotIds = new Set(matchedPairIds.map((pid) => recordFor(pid)[0]?.id));

  return (
    <LinearGradient colors={['#EDE7FB', '#F3EFFC', '#FFF4EC']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Opposites" bg={ll.purpleSoft} color={ll.purpleDeep} style={styles.titlePill} />
        <StarChip count={stars} />
      </View>

      <View style={styles.streakWrap}>
        <StreakBadge streak={streak} />
      </View>

      <Text style={styles.eyebrow}>Level {level + 1} of {TOTAL_LEVELS}</Text>
      <Text style={styles.prompt}>Tap two cards that are opposites</Text>

      {/* Pairs found, as a count — the goal made explicit. */}
      <View style={styles.pairCount}>
        {Array.from({ length: totalPairs }, (_, i) => (
          <View key={i} style={[styles.pairPip, i < matchedPairIds.length && styles.pairPipOn]} />
        ))}
        <Text style={styles.pairCountText}>
          {matchedPairIds.length} of {totalPairs} pairs
        </Text>
      </View>

      {/* THE FELT MAT --------------------------------------------------- */}
      <LinearGradient colors={['#D9CDF2', '#C4B4E8']} style={styles.mat}>
        <View style={styles.matStitch} pointerEvents="none" />
        <View style={styles.grid}>
          {cards.map((card) => {
            const state = cardState(card);
            const showRecord = state === 'matched' && recordSlotIds.has(card.id);
            const pair = showRecord ? recordFor(card.pairId) : null;
            return (
              <View key={card.id} style={styles.slotWrap}>
                {/* The empty socket the card sat in. */}
                {state === 'matched' ? (
                  <View style={[styles.socket, { width: size, height: size * 1.22 }]} pointerEvents="none" />
                ) : null}
                {showRecord ? <PairRecord a={pair[0]} b={pair[1]} size={size} /> : null}
                <Card card={card} state={state} onPress={() => handlePress(card)} size={size} />
              </View>
            );
          })}
        </View>
      </LinearGradient>

      <ConfettiCannon ref={confettiRef} count={30} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2200} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginTop: 54 },
  titlePill: { flex: 1, alignSelf: 'center' },
  streakWrap: { alignSelf: 'flex-end', marginTop: 8, minHeight: 4 },

  eyebrow: { ...llType.eyebrow, color: ll.purpleDeep, marginTop: 8, textTransform: 'uppercase' },
  prompt: { ...llType.h4, color: ll.ink, marginTop: 4, marginBottom: 12, textAlign: 'center' },

  pairCount: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  pairPip: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: withAlpha('#8B86B8', 0.3),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  pairPipOn: { backgroundColor: ll.green, borderColor: ll.greenDeep },
  pairCountText: {
    marginLeft: 4, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1, color: ll.purpleDeep, textTransform: 'uppercase',
  },

  // Felt mat: the table a matching game is played on.
  mat: {
    borderRadius: llRadius.xxl, padding: 13, alignItems: 'center',
    shadowColor: '#5442A8', shadowOpacity: 0.26, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 9,
  },
  matStitch: {
    position: 'absolute', top: 6, left: 6, right: 6, bottom: 6,
    borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.55)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 330 },
  slotWrap: { position: 'relative', margin: 4 },
  cardSlot: { alignItems: 'center', justifyContent: 'center' },

  socket: {
    position: 'absolute', borderRadius: llRadius.md,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardCast: {
    borderRadius: llRadius.md,
    shadowColor: '#4B3A8E', shadowOpacity: 0.26, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  card: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', paddingHorizontal: 5, gap: 2,
  },
  cardSelected: { borderWidth: 3, borderColor: ll.purple },
  cardWrong: { borderWidth: 3, borderColor: '#FFB3C9' },
  cardLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: ll.ink, textAlign: 'center' },

  // The pair record left in the slot.
  record: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    borderRadius: llRadius.md, backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 2, borderColor: withAlpha(ll.green, 0.5), gap: 3, paddingHorizontal: 4,
  },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  recordArrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: ll.greenDeep },
  recordLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 8.5, color: ll.greenDeep,
    textAlign: 'center', paddingHorizontal: 2,
  },
});
