import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { ALPHABET } from '../gameData';
import { NUMBERS } from '../numberGameData';
import { clearProgress, loadProgress } from '../storage';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const TOPICS_BY_SUBJECT = {
  English: [
    {
      id: 'abc', label: 'Learn ABC', emoji: '🔠', available: true,
      description: 'Match each letter to the right picture',
      screen: 'AlphabetGame', total: ALPHABET.length,
      letterAt: (i) => ALPHABET[i]?.letter,
    },
    { id: 'rhyme', label: 'Rhyme Time', emoji: '🎵', available: false },
    { id: 'sight', label: 'Sight Words', emoji: '📖', available: false },
  ],
  Math: [
    {
      id: 'numbers', label: 'Count to 10', emoji: '🔢', available: true,
      description: 'Find the group with the right count',
      screen: 'NumberGame', total: NUMBERS.length,
      letterAt: (i) => NUMBERS[i]?.number,
    },
    { id: 'fractions', label: 'Fractions Fun', emoji: '🍕', available: false },
    { id: 'shapes', label: 'Shapes', emoji: '🔺', available: false },
  ],
  Colors: [
    { id: 'colormatch', label: 'Color Match', emoji: '🎨', available: false },
  ],
};

export default function TopicSelectScreen({ route, navigation }) {
  const { grade, subject } = route.params;
  const topics = TOPICS_BY_SUBJECT[subject] ?? [];
  const [progressByTopic, setProgressByTopic] = useState({});

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Promise.all(
        topics.filter((t) => t.available).map((t) => loadProgress(t.id).then((p) => [t.id, p])),
      ).then((entries) => setProgressByTopic(Object.fromEntries(entries)));
    });
    return unsubscribe;
    // topics is derived from `subject`, which is stable for this screen instance
  }, [navigation, subject]);

  function startNew(topic) {
    clearProgress(topic.id);
    navigation.navigate(topic.screen, { startIndex: 0, startStars: 0 });
  }

  function continueGame(topic) {
    const progress = progressByTopic[topic.id];
    if (!progress) return;
    navigation.navigate(topic.screen, { startIndex: progress.index, startStars: progress.stars });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · {subject} · Step 3</Text>
      <Text style={styles.title}>Pick a game!</Text>

      <View style={styles.grid}>
        {topics.map((topic, i) => {
          const palette = cardPalette[(i + 4) % cardPalette.length];
          const progress = topic.available ? progressByTopic[topic.id] : null;
          const hasProgress = progress && progress.index > 0 && progress.index < topic.total;

          return (
            <View key={topic.id}>
              <BouncyButton
                disabled={!topic.available}
                style={[
                  styles.card,
                  { backgroundColor: topic.available ? palette.bg : colors.disabled },
                ]}
                onPress={() => (hasProgress ? continueGame(topic) : startNew(topic))}
              >
                <Text style={styles.cardEmoji}>{topic.emoji}</Text>
                <Text style={[styles.cardLabel, !topic.available && styles.cardLabelDisabled]}>
                  {topic.label}
                </Text>
                {topic.available
                  ? <Text style={styles.description}>{topic.description}</Text>
                  : <Text style={styles.soon}>Coming Soon</Text>}
              </BouncyButton>

              {hasProgress && (
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeText}>
                    You were at {topic.letterAt(progress.index)} · ⭐ {progress.stars}
                  </Text>
                  <BouncyButton style={styles.startOverButton} onPress={() => startNew(topic)}>
                    <Text style={styles.startOverText}>Start Over</Text>
                  </BouncyButton>
                </View>
              )}
            </View>
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
  resumeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs, paddingHorizontal: spacing.xs,
  },
  resumeText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, flex: 1 },
  startOverButton: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  startOverText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.grapeDeep },
});
