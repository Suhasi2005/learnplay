import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import FadeInCard from '../components/FadeInCard';
import { CURRICULUM } from '../curriculum';
import { clearProgress, loadProgress } from '../storage';
import { bgGradient, cardPalette, colors, fonts, radius, spacing } from '../theme';

export default function TopicSelectScreen({ route, navigation }) {
  const { grade, subject } = route.params;
  const topics = CURRICULUM[grade]?.[subject] ?? [];
  const [progressByTopic, setProgressByTopic] = useState({});

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Promise.all(
        topics.filter((t) => t.playable).map((t) => loadProgress(t.id).then((p) => [t.id, p])),
      ).then((entries) => setProgressByTopic(Object.fromEntries(entries)));
    });
    return unsubscribe;
    // topics is derived from `subject`, which is stable for this screen instance
  }, [navigation, subject]);

  function startNew(topic) {
    clearProgress(topic.id);
    navigation.navigate(topic.playable, { startIndex: 0, startStars: 0, topicId: topic.id });
  }

  function continueGame(topic) {
    const progress = progressByTopic[topic.id];
    if (!progress) return;
    navigation.navigate(topic.playable, {
      startIndex: progress.index, startStars: progress.stars, topicId: topic.id,
    });
  }

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>{grade} · {subject} · Step 3</Text>
      <Text style={styles.title}>Pick a game!</Text>

      <View style={styles.grid}>
        {topics.map((topic, i) => {
          const palette = cardPalette[(i + 4) % cardPalette.length];
          const progress = topic.playable ? progressByTopic[topic.id] : null;
          const hasProgress = progress && progress.index > 0;

          return (
            <FadeInCard key={topic.id} index={i}>
              <BouncyButton
                disabled={!topic.playable}
                style={[
                  styles.card,
                  { backgroundColor: topic.playable ? palette.bg : colors.disabled },
                ]}
                onPress={() => (hasProgress ? continueGame(topic) : startNew(topic))}
              >
                <Text style={styles.cardEmoji}>{topic.emoji}</Text>
                <Text style={[styles.cardLabel, !topic.playable && styles.cardLabelDisabled]}>
                  {topic.label}
                </Text>
                {topic.playable
                  ? <Text style={styles.description}>{topic.description}</Text>
                  : <Text style={styles.soon}>Coming Soon</Text>}
              </BouncyButton>

              {hasProgress && (
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeText}>⭐ {progress.stars} so far</Text>
                  <BouncyButton style={styles.startOverButton} onPress={() => startNew(topic)}>
                    <Text style={styles.startOverText}>Start Over</Text>
                  </BouncyButton>
                </View>
              )}
            </FadeInCard>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
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
