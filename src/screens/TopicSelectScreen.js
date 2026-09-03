import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import FadeInCard from '../components/FadeInCard';
import GameButton from '../components/GameButton';
import ProgressRing from '../components/ProgressRing';
import SceneBackground from '../components/SceneBackground';
import StarRow from '../components/StarRow';
import { CURRICULUM } from '../curriculum';
import { clearProgress, loadProgress } from '../storage';
import { colors, fonts, radius, shadow, spacing, subjectTheme, type } from '../theme';

// Level select.
//
// Each playable topic is a level card carrying its own state: untouched,
// in progress, or finished. A child should be able to tell those apart
// without reading — the ring, the stars and the button label all say it.

// Stars are awarded per round, so "how well did I do" is stars/total. Three
// badge stars at 60/80/100% keeps a full sweep meaningful without making
// anything below it feel like failure.
function badgeStars(stars, total) {
  if (!total) return 0;
  const pct = stars / total;
  if (pct >= 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}

export default function TopicSelectScreen({ route, navigation }) {
  const { grade, subject } = route.params;
  const topics = CURRICULUM[grade]?.[subject] ?? [];
  const theme = subjectTheme[subject] ?? subjectTheme.Math;
  const [progressByTopic, setProgressByTopic] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        topics.filter((t) => t.playable).map((t) => loadProgress(t.id).then((p) => [t.id, p])),
      )
        .then((entries) => { if (!cancelled) setProgressByTopic(Object.fromEntries(entries)); })
        .catch(() => {});
      return () => { cancelled = true; };
      // topics is derived from `subject`, which is stable for this screen instance
    }, [subject]),
  );

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
    <SceneBackground>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>{grade.toUpperCase()}  ·  {theme.label.toUpperCase()}</Text>
        <Text style={styles.title}>Pick a game</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {topics.map((topic, i) => {
          const progress = topic.playable ? progressByTopic[topic.id] : null;
          // Bounded by topic.total: a record saved at (or past) the final
          // round — a narrow race if the app closes between the last correct
          // answer and the completion screen clearing it — is finished, not
          // resumable, and must never offer "Continue" into a dead round.
          const inProgress = progress && progress.index > 0 && progress.index < topic.total;
          const finished = progress && progress.index >= topic.total;
          const stars = progress?.stars ?? 0;

          if (!topic.playable) {
            return (
              <FadeInCard key={topic.id} index={i}>
                <View style={[styles.card, styles.cardLocked]}>
                  <View style={styles.lockIcon}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.labelLocked}>{topic.label}</Text>
                    <Text style={styles.metaLocked}>Coming soon</Text>
                  </View>
                </View>
              </FadeInCard>
            );
          }

          return (
            <FadeInCard key={topic.id} index={i}>
              <View style={[styles.card, finished && { borderColor: theme.base }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: theme.soft }]}>
                    <Text style={styles.icon}>{topic.emoji}</Text>
                    {inProgress && (
                      <ProgressRing
                        progress={progress.index / topic.total}
                        size={62}
                        strokeWidth={4}
                        color={theme.deep}
                        trackColor="transparent"
                        style={styles.ring}
                      />
                    )}
                    {finished && (
                      <View style={[styles.tick, { backgroundColor: theme.deep }]}>
                        <Text style={styles.tickText}>✓</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.body}>
                    <Text style={styles.label}>{topic.label}</Text>
                    <Text style={styles.description} numberOfLines={2}>{topic.description}</Text>
                    <View style={styles.statusRow}>
                      <StarRow earned={badgeStars(stars, topic.total)} size={16} />
                      <Text style={styles.statusText}>
                        {finished
                          ? `Finished · ⭐ ${stars}`
                          : inProgress
                            ? `Round ${progress.index + 1} of ${topic.total}`
                            : `${topic.total} rounds`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actions}>
                  <GameButton
                    label={inProgress ? 'Continue' : finished ? 'Play again' : 'Play'}
                    icon={inProgress ? '▶' : finished ? '↻' : '▶'}
                    size="sm"
                    variant={inProgress ? 'primary' : 'accent'}
                    color={inProgress ? undefined : { bg: theme.base, deep: theme.deep }}
                    onPress={() => (inProgress ? continueGame(topic) : startNew(topic))}
                    style={styles.playButton}
                  />
                  {inProgress && (
                    <Pressable
                      onPress={() => startNew(topic)}
                      style={styles.startOver}
                      accessibilityRole="button"
                      accessibilityLabel={`Start ${topic.label} over`}
                    >
                      <Text style={styles.startOverText}>Start over</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </FadeInCard>
          );
        })}
      </ScrollView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  eyebrow: { ...type.eyebrow, color: colors.grapeDeep },
  title: { ...type.title, color: colors.ink, marginTop: 2 },

  list: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.sm, borderWidth: 2, borderColor: 'transparent', ...shadow.sm,
  },
  cardLocked: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.disabled, opacity: 0.75 },
  cardTop: { flexDirection: 'row', gap: spacing.sm },

  iconWrap: { width: 62, height: 62, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 30 },
  ring: { position: 'absolute', top: 0, left: 0 },
  tick: {
    position: 'absolute', bottom: -3, right: -3, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white,
  },
  tickText: { color: colors.white, fontFamily: fonts.displayBold, fontSize: 12, includeFontPadding: false },

  lockIcon: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  lockEmoji: { fontSize: 22 },

  body: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.displayBold, fontSize: 17.5, color: colors.ink },
  labelLocked: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.muted },
  description: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  metaLocked: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  statusText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  playButton: { flex: 1 },
  startOver: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  startOverText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
});
