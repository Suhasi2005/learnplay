import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import LevelPath from '../components/LevelPath';
import SceneBackground from '../components/SceneBackground';
import ScreenHeader from '../components/ScreenHeader';
import StarRow from '../components/StarRow';
import { CURRICULUM } from '../curriculum';
import { clearProgress, loadProgress } from '../storage';
import { OUTLINE_WIDTH, colors, fonts, radius, spacing } from '../theme';
import { subjectTheme } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

  const totalStars = Object.values(progressByTopic)
    .reduce((sum, p) => sum + (p?.stars ?? 0), 0);

  function open(topic) {
    const progress = progressByTopic[topic.id];
    // Bounded by topic.total: a record saved at (or past) the final round —
    // a narrow race if the app closes between the last correct answer and the
    // completion screen clearing it — is finished, not resumable, and must
    // never resume into a dead round.
    const resumable = progress && progress.index > 0 && progress.index < topic.total;
    if (resumable) {
      navigation.navigate(topic.playable, {
        startIndex: progress.index, startStars: progress.stars, topicId: topic.id,
      });
      return;
    }
    clearProgress(topic.id);
    navigation.navigate(topic.playable, { startIndex: 0, startStars: 0, topicId: topic.id });
  }

  const items = topics.map((topic) => {
    const progress = topic.playable ? progressByTopic[topic.id] : null;
    const finished = progress && progress.index >= topic.total;
    const inProgress = progress && progress.index > 0 && progress.index < topic.total;
    return {
      key: topic.id,
      topic,
      label: topic.label,
      emoji: topic.emoji,
      locked: !topic.playable,
      color: finished ? theme.base : inProgress ? colors.sun : colors.white,
      finished,
      inProgress,
      stars: progress?.stars ?? 0,
      accessibilityLabel: topic.playable
        ? `${topic.label}. ${finished ? 'Finished' : inProgress ? `Round ${progress.index + 1} of ${topic.total}` : 'Not started'}.`
        : `${topic.label}, coming soon`,
    };
  });

  return (
    <SceneBackground>
      <StatusBar style="light" />
      <ScreenHeader
        title={theme.label}
        subtitle={grade}
        onBack={() => navigation.goBack()}
        stars={totalStars}
        color={theme.deep}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LevelPath
          items={items}
          width={SCREEN_WIDTH - spacing.md * 2}
          onSelect={(item) => !item.locked && open(item.topic)}
          renderBadge={(item) =>
            item.finished ? (
              <View style={styles.tick}>
                <Text style={styles.tickText}>✓</Text>
              </View>
            ) : item.inProgress ? (
              <View style={styles.nowPill}>
                <Text style={styles.nowText}>NOW</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Your stars</Text>
          <View style={styles.legendRows}>
            {items.filter((i) => i.finished || i.inProgress).length === 0 ? (
              <Text style={styles.legendEmpty}>Tap the first stop to begin!</Text>
            ) : (
              items
                .filter((i) => i.finished || i.inProgress)
                .map((i) => (
                  <View key={i.key} style={styles.legendRow}>
                    <Text style={styles.legendEmoji}>{i.emoji}</Text>
                    <Text style={styles.legendLabel} numberOfLines={1}>{i.label}</Text>
                    <StarRow earned={badgeStars(i.stars, i.topic.total)} size={15} />
                  </View>
                ))
            )}
          </View>
        </View>
      </ScrollView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },

  tick: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.grass,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  tickText: { color: colors.white, fontFamily: fonts.displayBold, fontSize: 13, includeFontPadding: false },
  nowPill: {
    backgroundColor: colors.coral, borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  nowText: { color: colors.white, fontFamily: fonts.displayBold, fontSize: 9, letterSpacing: 0.5 },

  legend: {
    marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.sm, borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  legendTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink, marginBottom: spacing.xs },
  legendRows: { gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendEmoji: { fontSize: 17 },
  legendLabel: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  legendEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
