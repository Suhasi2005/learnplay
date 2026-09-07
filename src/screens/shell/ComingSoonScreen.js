import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from '../../components/Character';
import { PeachButton, ShellScreen } from '../../components/shellUI';
import { fonts, shellRadius, shellShadow, shellType, shell } from '../../theme';

// An honest empty state.
//
// Stories and Activities are real plans with nothing built behind them yet.
// The alternative — dummy lesson cards that do nothing — would look better in
// a screenshot and be a lie the first time a child taps one. This says what
// is coming, admits it isn't here, and hands them somewhere real to go
// instead, which is the same standard the curriculum's "Coming Soon" topics
// already hold themselves to.

export function makeComingSoon({ icon, title, blurb, plans }) {
  return function ComingSoonScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    return (
      <ShellScreen>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: 130 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Character mood="think" size={130} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{icon}  COMING SOON</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.blurb}>{blurb}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What's planned</Text>
            {plans.map((p) => (
              <View key={p} style={styles.planRow}>
                <View style={styles.dot} />
                <Text style={styles.planText}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Text style={styles.ctaText}>In the meantime…</Text>
            <PeachButton
              label="Play a game"
              icon="🎮"
              onPress={() => navigation.navigate('Games')}
            />
          </View>
        </ScrollView>
      </ShellScreen>
    );
  };
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, alignItems: 'center' },
  hero: { alignItems: 'center' },
  badge: {
    backgroundColor: shell.primarySoft, borderRadius: shellRadius.pill,
    paddingVertical: 5, paddingHorizontal: 12, marginTop: 4,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 1, color: shell.primaryDeep },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: shell.ink, marginTop: 8, textAlign: 'center' },
  blurb: {
    ...shellType.body, color: shell.inkMuted, marginTop: 6,
    textAlign: 'center', maxWidth: 300,
  },

  card: {
    alignSelf: 'stretch', backgroundColor: shell.surface, borderRadius: shellRadius.lg,
    padding: 16, marginTop: 24, ...shellShadow.card,
  },
  cardTitle: { ...shellType.cardTitle, color: shell.ink, marginBottom: 10 },
  planRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: shell.accent, marginTop: 6 },
  planText: { ...shellType.body, color: shell.inkMuted, flex: 1 },

  cta: { alignItems: 'center', marginTop: 26, gap: 10 },
  ctaText: { ...shellType.body, color: shell.inkMuted },
});

export const StoriesScreen = makeComingSoon({
  icon: '📖',
  title: 'Stories',
  blurb: 'Short illustrated stories to read together, with the words read aloud.',
  plans: [
    'Picture stories narrated line by line',
    'Tap any word to hear it on its own',
    'Simple questions after each story',
    'Stories that reuse words from the games',
  ],
});

export const ActivitiesScreen = makeComingSoon({
  icon: '🎨',
  title: 'Activities',
  blurb: 'Things to make and do away from the screen, with a grown-up.',
  plans: [
    'Printable colouring and tracing sheets',
    'Counting games using things around the house',
    'Simple craft steps with pictures',
    'Activities matched to the topic just played',
  ],
});
