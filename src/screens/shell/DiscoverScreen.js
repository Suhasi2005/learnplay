import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from '../../components/Character';
import { ContentCard, HighlightTitle, PeachButton, ShellScreen } from '../../components/shellUI';
import { CURRICULUM } from '../../curriculum';
import { ANIMALS } from '../../sceneAssets';
import { loadProgress } from '../../storage';
import { fonts, shellRadius, shellShadow, shellType, shell, subjectTheme } from '../../theme';

// Discover.
//
// Its whole job is removing the decision. A child staring at nineteen games
// often picks none, so this offers exactly one — weighted toward things they
// haven't touched, because a suggestion they've already finished is useless.

const ALL = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

export default function DiscoverScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [pick, setPick] = useState(null);
  const [stats, setStats] = useState({ stars: 0, done: 0, untouched: 0 });

  const choose = useCallback((progressMap) => {
    const untouched = ALL.filter((t) => !progressMap[t.id]);
    const unfinished = ALL.filter((t) => {
      const p = progressMap[t.id];
      return p && p.index < t.total;
    });
    const pool = untouched.length ? untouched : unfinished.length ? unfinished : ALL;
    setPick(pool[Math.floor(Math.random() * pool.length)]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(ALL.map((t) => loadProgress(t.id).then((p) => [t.id, p])))
        .then((rows) => {
          if (cancelled) return;
          const map = Object.fromEntries(rows);
          setStats({
            stars: rows.reduce((s, [, p]) => s + (p?.stars ?? 0), 0),
            done: ALL.filter((t) => map[t.id] && map[t.id].index >= t.total).length,
            untouched: ALL.filter((t) => !map[t.id]).length,
          });
          choose(map);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [choose]),
  );

  return (
    <ShellScreen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <HighlightTitle before="Try something" highlight="new" />

        {pick && (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <Text style={styles.heroEyebrow}>SUGGESTED FOR YOU</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {pick.emoji}  {pick.label}
                </Text>
                <Text style={styles.heroMeta}>
                  {pick.grade} · {subjectTheme[pick.subject]?.label ?? pick.subject} · {pick.total} rounds
                </Text>
              </View>
              <Character mood="point" size={78} animate={false} />
            </View>

            <Text style={styles.heroBody}>{pick.description}</Text>

            <View style={styles.heroActions}>
              <PeachButton
                label="Play this"
                icon="▶"
                onPress={() =>
                  navigation.navigate(pick.playable, { startIndex: 0, startStars: 0, topicId: pick.id })
                }
              />
              <PeachButton
                small
                label="Something else"
                icon="🎲"
                style={styles.reroll}
                onPress={() =>
                  setPick(ALL[Math.floor(Math.random() * ALL.length)])
                }
              />
            </View>
          </View>
        )}

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.stars}</Text>
            <Text style={styles.statLabel}>stars</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.done}</Text>
            <Text style={styles.statLabel}>finished</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.untouched}</Text>
            <Text style={styles.statLabel}>not tried</Text>
          </View>
        </View>

        <View style={styles.block}>
          <ContentCard
            icon="📚"
            title="Follow the curriculum"
            tint={shell.tintLavender}
            body="Work through topics in order, by grade and subject."
            onPress={() => navigation.navigate('GradeSelect')}
            art={<Image source={ANIMALS.owl} style={styles.art} resizeMode="contain" />}
          />
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  block: { marginTop: 16 },

  hero: {
    backgroundColor: shell.surface, borderRadius: shellRadius.lg,
    padding: 16, marginTop: 16, ...shellShadow.raised,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroText: { flex: 1 },
  heroEyebrow: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1.1, color: shell.primaryDeep },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: shell.ink, marginTop: 2 },
  heroMeta: { ...shellType.small, color: shell.inkMuted, marginTop: 2 },
  heroBody: { ...shellType.body, color: shell.inkMuted, marginTop: 10 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  reroll: { backgroundColor: shell.primarySoft },

  statRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: {
    flex: 1, backgroundColor: shell.surface, borderRadius: shellRadius.md,
    paddingVertical: 14, alignItems: 'center', ...shellShadow.card,
  },
  statNum: { fontFamily: fonts.displayBold, fontSize: 22, color: shell.primaryDeep },
  statLabel: { ...shellType.small, color: shell.inkMuted, marginTop: 1 },

  art: { width: 74, height: 74 },
});
