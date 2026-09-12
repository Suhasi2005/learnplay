import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ICON, REWARD_ART, SCENE } from '../art';
import { Floating, LLButton, LLTextButton, Pill, Pop, StarRow, Track } from '../kit';
import { subject } from '../syllabus';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';

const SCREEN_W = Dimensions.get('window').width;

// The reward moment.
//
// Staged rather than simultaneous: the headline bursts, then the stars pop one
// at a time, then the totals fill. Everything arriving at once reads as a
// single flash — staggering it makes each star feel earned separately, which
// is the whole emotional point of the screen.

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

  useEffect(() => {
    speak(perfect ? 'Perfect! You got every one right!' : 'Well done! Lesson complete.',
      { rate: 0.95, pitch: 1.15 });
  }, []);

  return (
    <LinearGradient colors={llGradients.reward} locations={[0, 0.45, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ConfettiCannon count={80} origin={{ x: 0, y: 0 }} fadeOut fallSpeed={3000} />
      <ConfettiCannon count={80} origin={{ x: SCREEN_W, y: 0 }} fadeOut fallSpeed={3000} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pill label="LESSON COMPLETE" bg={ll.white} color={ll.pinkDeep} spaced style={styles.badge} />

        <Pop from={0.4}>
          <Text style={styles.title}>{perfect ? 'Perfect!' : 'You did it!'}</Text>
        </Pop>

        <StarRow count={3} size={0} animate={false} />
        <View style={styles.starRow}>
          {[0, 1, 2].map((i) => (
            <Pop key={i} delay={140 + i * 130}>
              <Image
                source={ICON.star}
                style={[
                  i === 1 ? styles.starBig : styles.starSmall,
                  i >= earned && styles.starDim,
                ]}
              />
            </Pop>
          ))}
        </View>

        <Floating duration={4600} distance={7}>
          <Image source={SCENE.miaReward} style={styles.hero} accessibilityLabel="Mia celebrating" />
        </Floating>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
            <Text style={[styles.cardScore, { color: sub.deep }]}>{stars} / {total}</Text>
          </View>

          <Track value={total ? stars / total : 0} height={16} colors={[ll.amberWarm, ll.pink, ll.purpleMid]} />

          <View style={styles.stats}>
            <Stat icon={REWARD_ART.star3} value={earned} label="BADGE STARS" tint={ll.amberSoft} />
            <Stat icon={REWARD_ART.coin} value={stars * 5} label="COINS" tint={ll.pinkTint} />
            <Stat icon={REWARD_ART.gem} value={perfect ? 2 : 1} label="GEMS" tint={ll.blueSoft} />
          </View>
        </View>

        {perfect && (
          <Pop delay={500}>
            <View style={styles.medal}>
              <Floating duration={4000} distance={6}>
                <Image source={REWARD_ART.medal} style={styles.medalArt} />
              </Floating>
              <View style={styles.medalText}>
                <Text style={styles.medalEyebrow}>NEW BADGE UNLOCKED</Text>
                <Text style={styles.medalName}>{title} Master</Text>
                <Text style={styles.medalNote}>Every answer right, first time.</Text>
              </View>
            </View>
          </Pop>
        )}

        <View style={styles.actions}>
          <LLButton
            label="Keep learning"
            tone="purple"
            onPress={() => navigation.navigate('LLSyllabus', { standardId, subjectId })}
          />
          <LLTextButton label="Back to classes" onPress={() => navigation.navigate('LLStandard')} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function Stat({ icon, value, label, tint }) {
  return (
    <View style={[styles.stat, { backgroundColor: tint }]}>
      <Image source={icon} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 22, alignItems: 'center', gap: 13 },
  badge: { alignSelf: 'center' },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 36, lineHeight: 40, color: ll.ink, textAlign: 'center' },

  starRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  starSmall: { width: 52, height: 52, borderRadius: 16 },
  starBig: { width: 70, height: 70, borderRadius: 20 },
  starDim: { opacity: 0.28 },

  hero: { width: 228, height: 198, borderRadius: 36, ...llShadow.lift },

  card: { alignSelf: 'stretch', backgroundColor: ll.white, borderRadius: llRadius.xxl, padding: 18, gap: 14, ...llShadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, ...llType.cardTitle, fontSize: 17, color: ll.ink },
  cardScore: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },

  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: llRadius.md, paddingVertical: 12, alignItems: 'center', gap: 3 },
  statIcon: { width: 34, height: 34 },
  statValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.ink },
  statLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8.5, letterSpacing: 0.5, color: ll.body },

  medal: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#FFF3D6', borderRadius: llRadius.xl, padding: 16,
  },
  medalArt: { width: 64, height: 64 },
  medalText: { flex: 1 },
  medalEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5, letterSpacing: 1, color: ll.clay },
  medalName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink },
  medalNote: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, color: '#8B7A62' },

  actions: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
});
