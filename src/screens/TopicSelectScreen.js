import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const TOPICS = [
  { id: 'abc', label: 'Learn ABC', emoji: '🔠', available: true, description: 'Match each letter to the right picture' },
  { id: 'rhyme', label: 'Rhyme Time', emoji: '🎵', available: false },
  { id: 'sight', label: 'Sight Words', emoji: '📖', available: false },
];

export default function TopicSelectScreen({ route, navigation }) {
  const { grade, subject } = route.params;

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · {subject} · Step 3</Text>
      <Text style={styles.title}>Pick a game!</Text>

      <View style={styles.grid}>
        {TOPICS.map((topic, i) => {
          const palette = cardPalette[(i + 4) % cardPalette.length];
          return (
            <BouncyButton
              key={topic.id}
              disabled={!topic.available}
              style={[
                styles.card,
                { backgroundColor: topic.available ? palette.bg : '#E4DED6' },
              ]}
              onPress={() => navigation.navigate('AlphabetGame')}
            >
              <Text style={styles.cardEmoji}>{topic.emoji}</Text>
              <Text style={[styles.cardLabel, !topic.available && styles.cardLabelDisabled]}>
                {topic.label}
              </Text>
              {topic.available
                ? <Text style={styles.description}>{topic.description}</Text>
                : <Text style={styles.soon}>Coming Soon</Text>}
            </BouncyButton>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardEmoji: { fontSize: 44, marginBottom: spacing.xs },
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.white },
  cardLabelDisabled: { color: colors.muted },
  description: { fontFamily: fonts.body, fontSize: 13, color: colors.white, opacity: 0.9, marginTop: 2 },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 4 },
});
