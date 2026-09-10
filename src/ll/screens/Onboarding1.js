import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

  // All three clips, each doing a job:
  //   idle  — the resting loop, always underneath
  //   wave  — she greets on arrival, and again whenever she's tapped
  //   point — a nudge toward the button if the child hasn't moved on
  //
  // wave and point are one-shots. Mia3D reports back through onSettled when a
  // clip ends and we drop to idle; pinning mood to a one-shot would clamp her
  // on its last frame forever, which reads as frozen rather than alive.
  const [mood, setMood] = useState('idle');
  const [nudged, setNudged] = useState(false);
  const settle = useCallback(() => setMood('idle'), []);

  // A beat before she waves, so the screen has finished appearing first.
  useEffect(() => {
    const id = setTimeout(() => setMood('wave'), 600);
    return () => clearTimeout(id);
  }, []);

  // Still here after a while? Point at what to press. Once only — a character
  // who keeps pointing stops reading as helpful and starts reading as nagging.
  useEffect(() => {
    if (nudged) return undefined;
    const id = setTimeout(() => { setMood('point'); setNudged(true); }, 7000);
    return () => clearTimeout(id);
  }, [nudged]);

  return (
    <LinearGradient colors={llGradients.onb1} locations={[0, 0.34, 0.78, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      {/* Soft colour orbs behind the character. */}
      <View style={[styles.orb, styles.orbPink]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbBlue]} pointerEvents="none" />

      <Floating duration={4400} distance={6} rotate={2} style={[styles.birdie, { top: insets.top + 50 }]}>
        <Image source={POSE.birdieFly} style={styles.birdieImg} accessibilityLabel="Birdie" />
      </Floating>

      {/* Tapping Mia makes her wave again — the first thing most children try
          is touching the character, and nothing happening teaches them the
          screen is a picture. */}
      <Pressable
        style={styles.stage}
        onPress={() => setMood('wave')}
        accessibilityRole="button"
        accessibilityLabel="Mia. Tap to make her wave."
      >
        {/* No fixed height: the canvas takes whatever the stage has left after
            the sheet, and the camera refits itself to that size. On a short
            screen Mia gets smaller rather than losing her head. */}
        <Mia3D mood={mood} onSettled={settle} />
      </Pressable>

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
          {/* Skip lands on the existing app shell. Swaps to the Little
              Learners home the moment that screen exists. */}
          <LLTextButton label="Skip for now" onPress={() => navigation.replace('Shell')} />
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

  // The stage absorbs all leftover height and never goes below a floor, so on
  // a short screen the sheet stays put and Mia scales down instead of being
  // cropped. `overflow: hidden` keeps the canvas honest about its bounds.
  stage: { flex: 1, minHeight: 200, overflow: 'hidden' },

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
