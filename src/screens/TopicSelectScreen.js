import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { ALPHABET } from '../gameData';
import { clearProgress, loadProgress } from '../storage';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const TOPICS = [
  { id: 'abc', label: 'Learn ABC', emoji: '🔠', available: true, description: 'Match each letter to the right picture' },
  { id: 'rhyme', label: 'Rhyme Time', emoji: '🎵', available: false },
  { id: 'sight', label: 'Sight Words', emoji: '📖', available: false },
];

export default function TopicSelectScreen({ route, navigation }) {
  const { grade, subject } = route.params;
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress().then(setProgress);
    });
    return unsubscribe;
  }, [navigation]);

  function startNew() {
    clearProgress();
    navigation.navigate('AlphabetGame', { startIndex: 0, startStars: 0 });
  }

  function continueGame() {
    if (!progress) return;
    navigation.navigate('AlphabetGame', { startIndex: progress.index, startStars: progress.stars });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · {subject} · Step 3</Text>
      <Text style={styles.title}>Pick a game!</Text>

      {progress && progress.index > 0 && progress.index < ALPHABET.length && (
        <View style={styles.resumeBanner}>
          <Text style={styles.resumeText}>
            You were on letter {ALPHABET[progress.index].letter}! ⭐ {progress.stars}
          </Text>
          <View style={styles.resumeButtons}>
            <BouncyButton style={[styles.resumeButton, styles.resumePrimary]} onPress={continueGame}>
              <Text style={styles.resumeButtonTextPrimary}>Continue</Text>
            </BouncyButton>
            <BouncyButton style={styles.resumeButton} onPress={startNew}>
              <Text style={styles.resumeButtonText}>Start Over</Text>
            </BouncyButton>
          </View>
        </View>
      )}

      <View style={styles.grid}>
        {TOPICS.map((topic, i) => {
          const palette = cardPalette[(i + 4) % cardPalette.length];
          return (
            <BouncyButton
              key={topic.id}
              disabled={!topic.available}
              style={[
                styles.card,
                { backgroundColor: topic.available ? palette.bg : colors.disabled },
              ]}
              onPress={startNew}
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
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.md, marginTop: spacing.xs },
  resumeBanner: {
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 2, borderColor: colors.grape,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  resumeText: { fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: spacing.sm },
  resumeButtons: { flexDirection: 'row', gap: spacing.sm },
  resumeButton: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.pill,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border,
  },
  resumePrimary: { backgroundColor: colors.grape, borderColor: colors.grape },
  resumeButtonText: { fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 13 },
  resumeButtonTextPrimary: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 13 },
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
