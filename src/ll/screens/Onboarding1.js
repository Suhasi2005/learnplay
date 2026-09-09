import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Mia3D from '../../components/Mia3D';
import { POSE } from '../art';
import { Dots, Floating, LLButton, LLTextButton, Pill, Rise } from '../kit';
import { ll, llGradients, llRadius, llType } from '../tokens';

// Onboarding 1 — "Let's Start Your Learning Adventure".
//
// The design fills the upper two-thirds with a 470px Mia cutout. Per the
// build decision, the live 3D model stands in that slot instead of the
// rendered PNG, so the first thing a child sees is a character that actually
// moves. Everything around her — the blur orbs, Birdie drifting top-right,
// the cream sheet with its rounded shoulders — matches the source.

export default function Onboarding1({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={llGradients.onb1} locations={[0, 0.34, 0.78, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      {/* Soft colour orbs behind the character. */}
      <View style={[styles.orb, styles.orbPink]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbBlue]} pointerEvents="none" />

      <Floating duration={4400} distance={6} rotate={2} style={[styles.birdie, { top: insets.top + 50 }]}>
        <Image source={POSE.birdieFly} style={styles.birdieImg} accessibilityLabel="Birdie" />
      </Floating>

      <View style={styles.stage}>
        <Mia3D mood="wave" height={430} />
      </View>

      <View style={styles.sheet}>
        <Rise style={styles.sheetBody}>
          <View style={styles.badgeRow}>
            <Pill label="MIA SAYS HI" bg={ll.pinkSoft} color={ll.pinkDeep} />
            <Pill label="AGE 5–8" bg={ll.purpleSoft} color={ll.purpleDeep} />
          </View>

          <Text style={styles.title}>Let's Start Your Learning Adventure</Text>
          <Text style={styles.body}>
            Explore five magical worlds with Mia, Leo, Birdie and Buddy. Play, read, count and collect stars.
          </Text>

          <Dots count={3} index={0} active={ll.pink} />

          <LLButton label="Start Learning" tone="pink" shine onPress={() => navigation.navigate('LLOnboarding2')} />
          <LLTextButton label="Skip for now" onPress={() => navigation.replace('LLHome')} />
        </Rise>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  orb: { position: 'absolute', borderRadius: 999 },
  orbPink: { top: 74, left: -30, width: 220, height: 220, backgroundColor: '#FFD9E7', opacity: 0.55 },
  orbBlue: { top: 170, right: -40, width: 230, height: 230, backgroundColor: '#D9E7FF', opacity: 0.5 },

  birdie: { position: 'absolute', right: 24, zIndex: 3 },
  birdieImg: {
    width: 78, height: 78, borderRadius: 39,
    shadowColor: '#7E6EC8', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 5,
  },

  stage: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4 },

  sheet: {
    backgroundColor: ll.cream,
    borderTopLeftRadius: llRadius.screen, borderTopRightRadius: llRadius.screen,
    paddingHorizontal: 26, paddingTop: 30, paddingBottom: 30,
  },
  // The gap lives here, on the element that actually holds the children —
  // `Rise` is one node, so a gap on the sheet would never reach them.
  sheetBody: { gap: 14 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { ...llType.h1, color: ll.ink },
  body: { ...llType.body, color: ll.soft },
});
