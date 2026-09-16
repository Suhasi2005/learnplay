import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import { useSound } from '../context/SoundContext';
import { TOTAL_ROUNDS, buildRound } from '../dataHandlingData';
import { saveProgress } from '../storage';
import { ICON } from '../ll/art';
import GameObject from '../ll/objects';
import { IconButton, Pill, StarChip } from '../ll/kit';
import { Sheen, TopHighlight } from '../ll/premium';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../ll/tokens';

// "Read the Chart" — Data Handling (Grade 1).
//
// A bar chart; which category has the most or the fewest.
//
// Two things were missing, and both are what makes a chart a chart.
//
// First, **gridlines and a scale**. The old bars were bare rectangles of
// differing height on no background, so comparing two similar bars meant
// eyeballing them. With horizontal gridlines and a numbered axis, a child
// can read each bar's value off the scale — and that is the whole skill
// being taught. "Reading" a chart means getting numbers out of it, not
// judging which rectangle looks taller.
//
// Second, **the value on each bar**. Every bar now carries its count at the
// top, so the answer is verifiable rather than estimated.
//
// The bars also animate up from the axis on each new round, which is how a
// chart is built — from the baseline, in proportion.
export default function ReadTheChartScreen({ route, navigation }) {
  const startIndex = route.params?.startIndex ?? 0;
  const startStars = route.params?.startStars ?? 0;
  const GAME_ID = route.params?.topicId ?? 'g1-ma-data';

  const { speak, playSuccess, playWrong } = useSound();
  const [index, setIndex] = useState(startIndex);
  const [stars, setStars] = useState(startStars);
  const [streak, setStreak] = useState(0);
  const [wrongLabel, setWrongLabel] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickedLabel, setPickedLabel] = useState(null);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(0)).current;
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
    setPickedLabel(null);
    // Bars grow from the axis — a chart is built in proportion.
    grow.setValue(0);
    Animated.timing(grow, { toValue: 1, duration: 620, useNativeDriver: false }).start();
    speak(`Which one has the ${round.askMost ? 'most' : 'fewest'}?`, { rate: 0.95, pitch: 1.15 });
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
  function handleAnswer(bar) {
    if (showCelebration || isProcessing) return;

    if (bar.label === round.correctLabel) {
      setIsProcessing(true);
      setPickedLabel(bar.label);
      const newStars = stars + 1;
      const newStreak = streak + 1;
      setStars(newStars);
      setStreak(newStreak);
      setShowCelebration(true);
      triggerPop();
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccess();
      speak(`Yes! ${bar.label}!`, { rate: 0.95, pitch: 1.15 });
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
            replayScreen: 'ReadTheChart',
            title: 'Chart Champion!',
            subtitle: `You read every chart!`,
          });
        }
      }, 1400);
    } else {
      setWrongLabel(bar.label);
      setStreak(0);
      triggerShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playWrong();
      speak('Try again!', { rate: 0.95, pitch: 1.15 });
      wrongTimeout.current = setTimeout(() => {
        if (isMounted.current) setWrongLabel(null);
      }, 400);
    }
  }
  // ---------------------------------------------------------------------

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  const compact = width < 360;
  // The scale runs to the tallest bar, rounded up, so gridlines are whole
  // numbers and every bar is readable against them.
  const maxCount = Math.max(...round.bars.map((b) => b.count), 1);
  const scaleTop = maxCount + 1;
  const plotH = compact ? 150 : 172;
  const unit = plotH / scaleTop;
  const barW = Math.max(38, Math.min(compact ? 46 : 54, (Math.min(width, 520) - 90) / round.bars.length));

  return (
    <LinearGradient colors={['#EFF3FC', '#F4F0FC', '#FFF5F0']} locations={[0, 0.5, 1]} style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topRow}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label="Data Handling" bg={ll.purpleSoft} color={ll.purpleDeep} style={styles.titlePill} />
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

      <View style={styles.askRow}>
        <Text style={styles.askLead}>Which one has the</Text>
        <View style={[styles.askChip, round.askMost ? styles.askChipMost : styles.askChipFew]}>
          <Text style={styles.askArrow}>{round.askMost ? '▲' : '▼'}</Text>
          <Text style={styles.askWord}>{round.askMost ? 'MOST' : 'FEWEST'}</Text>
        </View>
      </View>

      {/* THE CHART — with a scale, so it can be read. ------------------ */}
      <View style={styles.chartCast}>
        <LinearGradient colors={llSurface.white} style={[styles.chartCard, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />

          <View style={styles.plotRow}>
            {/* Numbered vertical axis. */}
            <View style={[styles.axis, { height: plotH }]}>
              {Array.from({ length: scaleTop + 1 }, (_, i) => scaleTop - i).map((v) => (
                <View key={v} style={styles.axisRow}>
                  <Text style={styles.axisNum}>{v}</Text>
                </View>
              ))}
            </View>

            <View style={{ position: 'relative' }}>
              {/* Gridlines — what turns heights into values. */}
              <View style={[styles.gridlines, { height: plotH }]} pointerEvents="none">
                {Array.from({ length: scaleTop + 1 }, (_, i) => (
                  <View key={i} style={[styles.gridline, i === scaleTop && styles.gridlineBase]} />
                ))}
              </View>

              <View style={[styles.bars, { height: plotH }]}>
                {round.bars.map((bar) => {
                  const isWrong = wrongLabel === bar.label;
                  const isPicked = pickedLabel === bar.label;
                  const h = grow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, bar.count * unit],
                  });
                  return (
                    <Animated.View
                      key={bar.label}
                      style={[styles.barCol, { width: barW }, isWrong && { transform: [{ translateX: shakeTranslate }] }]}
                    >
                      <Pressable
                        onPress={() => handleAnswer(bar)}
                        disabled={isProcessing || showCelebration}
                        accessibilityRole="button"
                        accessibilityLabel={`${bar.label}, ${bar.count}`}
                        style={styles.barPress}
                      >
                        {/* Value label at the top of the bar. */}
                        <Animated.View style={{ height: h, justifyContent: 'flex-start', width: '100%' }}>
                          <LinearGradient
                            colors={
                              isPicked ? [ll.greenLight, ll.greenDeep]
                                : isWrong ? ['#FFB3C9', ll.pinkDeep]
                                  : [ll.blueLight, ll.blue]
                            }
                            style={[styles.bar, isPicked && styles.barPicked]}
                          >
                            <Sheen variant="strong" radius={8} />
                            <View style={styles.barCap} pointerEvents="none" />
                          </LinearGradient>
                        </Animated.View>

                        <View style={[styles.valueChip, isPicked && styles.valueChipOk]}>
                          <Text style={[styles.valueText, isPicked && { color: ll.white }]}>{bar.count}</Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Category labels along the bottom. */}
          <View style={styles.labelRow}>
            <View style={{ width: 24 }} />
            {round.bars.map((bar) => (
              <View key={bar.label} style={[styles.labelCol, { width: barW }]}>
                <GameObject emoji={bar.emoji} size={compact ? 20 : 23} />
                <Text style={styles.labelText} numberOfLines={1} adjustsFontSizeToFit>{bar.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Mascot mood="cheer" size={78} />
          <Animated.Text style={[styles.celebrationText, { transform: [{ scale: popScale }] }]}>
            {round.correctLabel}!
          </Animated.Text>
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
  dotActive: { backgroundColor: ll.purple, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ll.white },

  askRow: { alignItems: 'center', gap: 5, marginTop: 14, marginBottom: 14 },
  askLead: { ...llType.cardTitle, color: ll.soft },
  askChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 18, borderRadius: llRadius.pill,
  },
  askChipMost: { backgroundColor: ll.blueSoft, borderWidth: 2, borderColor: withAlpha(ll.blue, 0.4) },
  askChipFew: { backgroundColor: ll.purpleSoft, borderWidth: 2, borderColor: withAlpha(ll.purple, 0.4) },
  askArrow: { fontSize: 12, color: ll.ink },
  askWord: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink, letterSpacing: 0.6 },

  chartCast: {
    borderRadius: llRadius.xl, alignSelf: 'stretch',
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  chartCard: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  plotRow: { flexDirection: 'row' },

  // The numbered scale — the reason a bar has a value, not just a height.
  axis: { width: 24, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 5 },
  axisRow: { height: 0, justifyContent: 'center' },
  axisNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: ll.muted },

  gridlines: {
    position: 'absolute', left: 0, right: 0, justifyContent: 'space-between',
  },
  gridline: { height: 1, backgroundColor: withAlpha('#8B86B8', 0.2) },
  gridlineBase: { height: 2.5, backgroundColor: withAlpha('#8B86B8', 0.55), borderRadius: 2 },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  barCol: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barPress: { width: '76%', alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: {
    width: '100%', flex: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8,
    overflow: 'hidden',
    shadowColor: '#2F55A8', shadowOpacity: 0.28, shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 }, elevation: 3,
  },
  barPicked: { shadowColor: ll.greenDeep, shadowOpacity: 0.45 },
  barCap: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  // The bar's own value, so the answer is read rather than guessed.
  valueChip: {
    position: 'absolute', top: -2, paddingVertical: 1, paddingHorizontal: 7,
    borderRadius: 7, backgroundColor: ll.white,
    borderWidth: 1.5, borderColor: withAlpha(ll.blueDeep, 0.3),
  },
  valueChipOk: { backgroundColor: ll.green, borderColor: ll.greenDeep },
  valueText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: ll.ink },

  labelRow: { flexDirection: 'row', marginTop: 7 },
  labelCol: { alignItems: 'center', gap: 1 },
  labelText: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: ll.ink,
    textAlign: 'center', paddingHorizontal: 2,
  },

  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 38, color: ll.greenDeep, marginTop: 8,
  },
});
