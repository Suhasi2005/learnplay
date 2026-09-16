import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ICON, REWARD_ART, SCENE } from '../art';
import { Floating, LLButton, LLTextButton, Pill, Pop, Track } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { subject } from '../syllabus';
import { ll, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import { useSound } from '../../context/SoundContext';

// The reward moment.
//
// Staged rather than simultaneous: the headline bursts, then the stars pop
// one at a time, then the totals fill. Everything arriving at once reads as
// a single flash — staggering it makes each star feel earned separately,
// which is the whole emotional point of the screen.
//
// The premium pass adds the thing a reward screen most needs and this one
// lacked: a sense of light. A sunburst sits behind the stars and turns
// slowly, earned stars carry their own amber glow while unearned ones are
// drawn as empty sockets rather than dimmed copies — an empty socket reads
// as "still available", a greyed star reads as "you failed to get this" —
// and the score card is a raised surface instead of a flat panel.

// Three badge stars from the score. 60% earns one, 80% two, everything right
// earns three — so a full sweep still means something without making anything
// below it feel like failure.
function badgeStars(stars, total) {
  if (!total) return 0;
  const pct = stars / total;
  if (pct >= 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}

export default function RewardScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    title = 'Lesson',
    subjectId = 'EVS',
    stars = 0,
    total = 0,
    standardId,
  } = route.params ?? {};

  const sub = subject(subjectId);
  const earned = badgeStars(stars, total);
  const perfect = total > 0 && stars === total;
  const { speak } = useSound();
  const rays = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    speak(perfect ? 'Perfect! You got every one right!' : 'Well done! Lesson complete.',
      { rate: 0.95, pitch: 1.15 });
  }, []);

  // The sunburst turns slowly behind everything — light, not decoration.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rays, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const compact = width < 360;
  const burst = Math.min(width * 0.95, 360);

  return (
    <LinearGradient colors={llGradients.reward} locations={[0, 0.45, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ConfettiCannon count={80} origin={{ x: 0, y: 0 }} fadeOut fallSpeed={3000} />
      <ConfettiCannon count={80} origin={{ x: width, y: 0 }} fadeOut fallSpeed={3000} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Light behind the celebration. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.burst,
            { width: burst, height: burst, top: insets.top + 40, transform: [{ rotate: spin }] },
          ]}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.ray,
                {
                  height: burst,
                  transform: [{ rotate: `${i * 15}deg` }],
                  backgroundColor: withAlpha('#FFD166', i % 2 ? 0.1 : 0.16),
                },
              ]}
            />
          ))}
        </Animated.View>

        <Pill label="LESSON COMPLETE" bg={ll.white} color={ll.pinkDeep} spaced style={styles.badge} />

        <Pop from={0.4}>
          <Text style={[styles.title, compact && { fontSize: 32, lineHeight: 36 }]}>
            {perfect ? 'Perfect!' : 'You did it!'}
          </Text>
        </Pop>

        {/* Earned stars glow; unearned ones are empty sockets waiting to be
            filled, not failed copies. */}
        <View style={styles.starRow}>
          {[0, 1, 2].map((i) => {
            const got = i < earned;
            const big = i === 1;
            const size = big ? (compact ? 62 : 70) : (compact ? 46 : 52);
            return (
              <Pop key={i} delay={140 + i * 130}>
                {got ? (
                  <View style={[styles.starGlow, { shadowRadius: big ? 22 : 16 }]}>
                    <Image source={ICON.star} style={{ width: size, height: size, borderRadius: size / 3 }} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.starSocket,
                      { width: size, height: size, borderRadius: size / 3 },
                    ]}
                  />
                )}
              </Pop>
            );
          })}
        </View>

        <Floating duration={4600} distance={7}>
          <View style={styles.heroCast}>
            <Image source={SCENE.miaReward} style={styles.hero} accessibilityLabel="Mia celebrating" />
          </View>
        </Floating>

        {/* THE SCORE CARD ---------------------------------------------- */}
        <View style={styles.cardCast}>
          <LinearGradient colors={llSurface.white} style={[styles.card, llRing.faint]}>
            <TopHighlight radius={llRadius.xxl} />

            <View style={styles.cardHead}>
              <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
              <View style={[styles.scorePill, { backgroundColor: withAlpha(sub.deep, 0.12) }]}>
                <Text style={[styles.cardScore, { color: sub.deep }]}>{stars} / {total}</Text>
              </View>
            </View>

            <Track value={total ? stars / total : 0} height={16} colors={[ll.amberWarm, ll.pink, ll.purpleMid]} glow />

            <View style={styles.stats}>
              <Stat icon={REWARD_ART.star3} value={earned} label="BADGE STARS" tint={ll.amberSoft} ink={ll.amberInk} />
              <Stat icon={REWARD_ART.coin} value={stars * 5} label="COINS" tint={ll.pinkTint} ink={ll.pinkDeep} />
              <Stat icon={REWARD_ART.gem} value={perfect ? 2 : 1} label="GEMS" tint={ll.blueSoft} ink={ll.blueDeep} />
            </View>
          </LinearGradient>
        </View>

        {perfect && (
          <Pop delay={500}>
            <View style={styles.medalCast}>
              <LinearGradient colors={['#FFF7E3', '#FFE9C2']} style={[styles.medal, llRing.light]}>
                <Sheen variant="tile" radius={llRadius.xl} />
                <TopHighlight radius={llRadius.xl} />
                <Floating duration={4000} distance={6}>
                  <Image source={REWARD_ART.medal} style={styles.medalArt} />
                </Floating>
                <View style={styles.medalText}>
                  <Text style={styles.medalEyebrow}>NEW BADGE UNLOCKED</Text>
                  <Text style={styles.medalName}>{title} Master</Text>
                  <Text style={styles.medalNote}>Every answer right, first time.</Text>
                </View>
              </LinearGradient>
            </View>
          </Pop>
        )}

        <View style={styles.actions}>
          <LLButton
            label="Keep learning"
            tone="purple"
            shine
            onPress={() => navigation.navigate('LLSyllabus', { standardId, subjectId })}
          />
          <LLTextButton label="Back to classes" onPress={() => navigation.navigate('LLStandard')} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Stat({ icon, value, label, tint, ink }) {
  return (
    <View style={styles.statCast}>
      <View style={[styles.stat, { backgroundColor: tint }]}>
        <TopHighlight radius={llRadius.md} />
        <Image source={icon} style={styles.statIcon} />
        <Text style={[styles.statValue, { color: ink }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 22, alignItems: 'center', gap: 13 },

  burst: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 26, borderRadius: 13 },

  badge: { alignSelf: 'center' },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 36, lineHeight: 40,
    color: ll.ink, textAlign: 'center', letterSpacing: -0.5,
  },

  starRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  starGlow: {
    shadowColor: ll.amber, shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  starSocket: {
    borderWidth: 2.5, borderStyle: 'dashed', borderColor: withAlpha('#9A93C7', 0.5),
    backgroundColor: withAlpha('#FFFFFF', 0.35),
  },

  heroCast: {
    borderRadius: 36,
    shadowColor: '#5442A8', shadowOpacity: 0.3, shadowRadius: 40,
    shadowOffset: { width: 0, height: 22 }, elevation: 12,
  },
  hero: { width: 228, height: 198, borderRadius: 36 },

  cardCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 }, elevation: 10,
  },
  card: { borderRadius: llRadius.xxl, padding: 18, gap: 14, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, ...llType.cardTitle, fontSize: 17, color: ll.ink },
  scorePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: llRadius.pill },
  cardScore: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },

  stats: { flexDirection: 'row', gap: 10 },
  statCast: {
    flex: 1, borderRadius: llRadius.md,
    shadowColor: '#6054BE', shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  stat: {
    borderRadius: llRadius.md, paddingVertical: 12, alignItems: 'center', gap: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  statIcon: { width: 34, height: 34 },
  statValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.ink },
  statLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8.5, letterSpacing: 0.5, color: ll.body },

  medalCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xl,
    shadowColor: '#C09134', shadowOpacity: 0.28, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  medal: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    borderRadius: llRadius.xl, padding: 16, overflow: 'hidden',
  },
  medalArt: { width: 64, height: 64 },
  medalText: { flex: 1 },
  medalEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5, letterSpacing: 1, color: ll.clay },
  medalName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink },
  medalNote: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, color: '#8B7A62' },

  actions: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
});
