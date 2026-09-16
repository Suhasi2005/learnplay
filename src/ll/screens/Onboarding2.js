import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CREW, FACE } from '../art';
import { Dots, LLButton, Pop, SpeechRow } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { ll, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// Onboarding 2 — "Meet your adventure crew".
//
// A 2×2 grid of the four companions, each on its own tinted panel, then
// Buddy introducing himself. His line does real work: it tells the child up
// front that asking for help is safe and never punished, which is the
// promise the game screen later keeps.
//
// The premium pass makes these read as collectible character cards rather
// than list tiles: the art panel gets a soft vignette so the character lifts
// off it, a name plate sits on a gradient surface, and each card carries the
// character's own colour in its shadow — so the four are distinguishable
// before a single name is read.
export default function Onboarding2({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  return (
    <LinearGradient colors={llGradients.onb2} locations={[0, 0.46, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 26, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Meet your adventure crew</Text>
        <Text style={styles.body}>Four friends travel with you. They cheer, hint and celebrate every step.</Text>

        <View style={styles.grid}>
          {CREW.map((c, i) => (
            <Pop key={c.id} delay={i * 90} style={styles.gridItem}>
              <View style={[styles.crewCast, { shadowColor: c.tint ?? '#6054BE' }]}>
                <LinearGradient colors={llSurface.white} style={[styles.crewCard, llRing.faint]}>
                  <View style={[styles.crewArt, { backgroundColor: c.soft }, compact && { height: 132 }]}>
                    <Image source={c.img} style={styles.crewImg} accessibilityLabel={c.name} />
                    {/* A vignette lifts the character off the panel. */}
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0)', withAlpha('#2E2A63', 0.1)]}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                  </View>
                  <View style={styles.crewBody}>
                    <TopHighlight radius={0} />
                    <Text style={styles.crewName}>{c.name}</Text>
                    <Text style={styles.crewRole}>{c.role}</Text>
                  </View>
                </LinearGradient>
              </View>
            </Pop>
          ))}
        </View>

        <View style={styles.buddyCast}>
          <LinearGradient colors={llSurface.white} style={[styles.buddyCard, llRing.faint]}>
            <TopHighlight radius={llRadius.xl} />
            <Sheen variant="tile" radius={llRadius.xl} />
            <SpeechRow face={FACE.buddyHappy}>
              "I'm Buddy! Tap me any time you get stuck — I'll give you a friendly hint, never a wrong buzz."
            </SpeechRow>
          </LinearGradient>
        </View>

        <Dots count={3} index={1} active={ll.blue} />
        {/* Straight into choosing a class — that pick decides every screen
            after this one, so it comes before anything optional. */}
        <LLButton label="Nice to meet you!" tone="blue" onPress={() => navigation.navigate('LLStandard')} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 18 },
  title: { ...llType.h2, color: ll.ink, letterSpacing: -0.3 },
  body: { ...llType.body, color: ll.soft },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  // Two per row, accounting for the 14px gap between them.
  gridItem: { width: '47.5%' },
  crewCast: {
    borderRadius: llRadius.xl,
    shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 7,
  },
  crewCard: { borderRadius: llRadius.xl, overflow: 'hidden' },
  crewArt: { height: 150 },
  crewImg: { width: '100%', height: '100%' },
  crewBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 15, gap: 3 },
  crewName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: ll.ink },
  crewRole: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, lineHeight: 15.5, color: ll.body },

  buddyCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 26,
    shadowOffset: { width: 0, height: 13 }, elevation: 8,
  },
  buddyCard: { borderRadius: llRadius.xl, padding: 16, overflow: 'hidden' },
});
