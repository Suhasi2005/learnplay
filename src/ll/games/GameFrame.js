import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ICON } from '../art';
import { IconButton, Pill, StarChip } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { ll, llGradients, llRadius, llRing, llType, withAlpha } from '../tokens';

// The chrome around every Senior KG and Grade 1 game: back, title, star
// count, round dots, the spoken prompt, confetti. The mechanic goes in
// `children`.
//
// Upgrading this one file lifts every game that uses it, so the props are
// deliberately unchanged — `flow`, `navigation`, `prompt`, `tone`, `children`
// behave exactly as before. What's new is presentation:
//
//  - The prompt sits on a soft raised plate instead of floating on the
//    gradient. At this age the instruction is re-read constantly, and a
//    surface makes it findable.
//  - Progress dots became a track: done dots are filled and joined by a thin
//    rail, so "three of eight" is a distance rather than a count.
//  - The star chip is the shared StarChip, so it matches the Junior KG
//    screens that don't use this frame.
const TONES = {
  pink: { bg: ll.pinkSoft, ink: ll.pinkDeep, base: ll.pink },
  blue: { bg: ll.blueSoft, ink: ll.blueDeep, base: ll.blue },
  green: { bg: '#E3F5EA', ink: ll.greenDeep, base: ll.green },
};

export default function GameFrame({ flow, navigation, prompt, tone = 'pink', children }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = TONES[tone] ?? TONES.pink;
  const compact = width < 360;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      {/* A soft wash behind the top chrome, so the header reads as a bar
          without drawing an actual bar. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
        style={[styles.topWash, { height: insets.top + 120 }]}
        pointerEvents="none"
      />

      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={flow.title} bg={t.bg} color={t.ink} style={styles.titlePill} />
        <StarChip count={flow.stars} />
      </View>

      {/* PROGRESS — a track, not a scatter of dots. --------------------- */}
      <View style={styles.progressWrap}>
        <View style={styles.progressRail} pointerEvents="none" />
        <View style={styles.progressRow}>
          {Array.from({ length: flow.total }, (_, i) => {
            const done = i < flow.index;
            const here = i === flow.index;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  here && [styles.dotActive, { backgroundColor: t.base, shadowColor: t.base }],
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.progressCount, { color: t.ink }]}>
          {Math.min(flow.index + 1, flow.total)} / {flow.total}
        </Text>
      </View>

      {/* PROMPT — on a plate. ------------------------------------------- */}
      {prompt ? (
        <View style={styles.promptCast}>
          <LinearGradient colors={['rgba(255,255,255,0.96)', 'rgba(255,255,255,0.78)']} style={[styles.promptPlate, llRing.light]}>
            <TopHighlight radius={llRadius.xl} />
            <Sheen variant="tile" radius={llRadius.xl} />
            <Text style={[styles.prompt, compact && { fontSize: 20, lineHeight: 25 }]}>{prompt}</Text>
          </LinearGradient>
        </View>
      ) : null}

      <View style={[styles.body, { paddingBottom: insets.bottom + 18 }]}>{children}</View>

      <ConfettiCannon ref={flow.confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topWash: { position: 'absolute', left: 0, right: 0, top: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 },
  titlePill: { flex: 1, alignSelf: 'center' },

  progressWrap: { alignSelf: 'center', alignItems: 'center', marginTop: 14, maxWidth: 280 },
  progressRail: {
    position: 'absolute', top: 5, left: 6, right: 6, height: 2,
    borderRadius: 2, backgroundColor: withAlpha('#8B86B8', 0.28),
  },
  progressRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    alignItems: 'center', gap: 5,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  dotDone: { backgroundColor: ll.green },
  dotActive: {
    width: 12, height: 12, borderRadius: 6,
    shadowOpacity: 0.5, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  progressCount: {
    marginTop: 6, fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.2,
  },

  promptCast: {
    marginTop: 14, marginHorizontal: 20, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.13, shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 }, elevation: 4,
  },
  promptPlate: {
    borderRadius: llRadius.xl, paddingVertical: 12, paddingHorizontal: 18, overflow: 'hidden',
  },
  prompt: { ...llType.h4, color: ll.ink, textAlign: 'center', letterSpacing: -0.2 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
});
