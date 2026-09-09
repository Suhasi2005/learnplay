import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CREW, FACE } from '../art';
import { Dots, LLButton, Pop, SpeechRow } from '../kit';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';

// Onboarding 2 — "Meet your adventure crew".
//
// A 2×2 grid of the four companions, each on its own tinted panel, then
// Buddy introducing himself. His line does real work: it tells the child
// up front that asking for help is safe and never punished, which is the
// promise the game screen later keeps.

export default function Onboarding2({ navigation }) {
  const insets = useSafeAreaInsets();

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
              <View style={styles.crewCard}>
                <View style={[styles.crewArt, { backgroundColor: c.soft }]}>
                  <Image source={c.img} style={styles.crewImg} accessibilityLabel={c.name} />
                </View>
                <View style={styles.crewBody}>
                  <Text style={styles.crewName}>{c.name}</Text>
                  <Text style={styles.crewRole}>{c.role}</Text>
                </View>
              </View>
            </Pop>
          ))}
        </View>

        <View style={styles.buddyCard}>
          <SpeechRow face={FACE.buddyHappy}>
            "I'm Buddy! Tap me any time you get stuck — I'll give you a friendly hint, never a wrong buzz."
          </SpeechRow>
        </View>

        <Dots count={3} index={1} active={ll.blue} />
        <LLButton label="Nice to meet you!" tone="blue" onPress={() => navigation.navigate('LLOnboarding3')} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 18 },
  title: { ...llType.h2, color: ll.ink },
  body: { ...llType.body, color: ll.soft },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  // Two per row, accounting for the 14px gap between them.
  gridItem: { width: '47.5%' },
  crewCard: { borderRadius: llRadius.xl, overflow: 'hidden', backgroundColor: ll.white, ...llShadow.card },
  crewArt: { height: 150 },
  crewImg: { width: '100%', height: '100%' },
  crewBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 15, gap: 3 },
  crewName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: ll.ink },
  crewRole: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, lineHeight: 15.5, color: ll.body },

  buddyCard: { backgroundColor: ll.white, borderRadius: llRadius.xl, padding: 16, ...llShadow.card },
});
