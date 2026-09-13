import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ICON } from '../art';
import { IconButton, Pill } from '../kit';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';

// Subject colours, matching the syllabus cards the child tapped to get here.
const TONES = {
  pink: { bg: ll.pinkSoft, ink: ll.pinkDeep },
  blue: { bg: ll.blueSoft, ink: ll.blueDeep },
  green: { bg: '#E3F5EA', ink: ll.greenDeep },
};

// The chrome around every Senior KG game: back, title, star count, round
// dots, the spoken prompt, confetti. The mechanic goes in `children`.
export default function GameFrame({ flow, navigation, prompt, tone = 'pink', children }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = TONES[tone] ?? TONES.pink;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <View style={[styles.topRow, { marginTop: insets.top + 10 }]}>
        <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
        <Pill label={flow.title} bg={t.bg} color={t.ink} style={styles.titlePill} />
        <View style={styles.starChip} accessibilityLabel={`${flow.stars} stars`}>
          <Text style={styles.starText}>⭐ {flow.stars}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: flow.total }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i < flow.index && styles.dotDone, i === flow.index && [styles.dotActive, { backgroundColor: t.ink }]]}
          />
        ))}
      </View>

      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}

      <View style={[styles.body, { paddingBottom: insets.bottom + 18 }]}>{children}</View>

      <ConfettiCannon ref={flow.confetti} count={35} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2500} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18 },
  titlePill: { flex: 1, alignSelf: 'center' },
  starChip: {
    backgroundColor: ll.white, borderRadius: llRadius.pill, paddingHorizontal: 12, paddingVertical: 6,
    ...llShadow.soft,
  },
  starText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.amberInk },

  progressRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 14,
    alignSelf: 'center', maxWidth: 260,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ll.lilac },
  dotDone: { backgroundColor: ll.green },
  dotActive: { width: 11, height: 11, borderRadius: 6 },

  prompt: { ...llType.h4, color: ll.ink, marginTop: 16, textAlign: 'center', paddingHorizontal: 24 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
});
