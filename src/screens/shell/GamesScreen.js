import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CountBadge, FilterChips, HighlightTitle, PeachButton, ShellScreen,
} from '../../components/shellUI';
import { CURRICULUM } from '../../curriculum';
import { clearProgress, loadProgress } from '../../storage';
import { fonts, shellRadius, shellShadow, shellType, shell, subjectTheme } from '../../theme';

// Every game in one flat, searchable list.
//
// The curriculum path (grade → subject → topic) is the right way to *learn*,
// but a child who already knows what they want shouldn't have to walk three
// screens to reach it. This is the shortcut, and it's why the tab exists.

const ALL = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

const GRADES = ['All', 'Junior KG', 'Senior KG', 'Grade 1'];
const TINTS = [shell.tintLavender, shell.tintPeach, shell.tintMint];

export default function GamesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('All');
  const [progress, setProgress] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(ALL.map((t) => loadProgress(t.id).then((p) => [t.id, p])))
        .then((rows) => { if (!cancelled) setProgress(Object.fromEntries(rows)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter((t) => {
      if (grade !== 'All' && t.grade !== grade) return false;
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (subjectTheme[t.subject]?.label ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, grade]);

  function start(topic, fresh) {
    if (fresh) clearProgress(topic.id);
    const p = fresh ? null : progress[topic.id];
    navigation.navigate(topic.playable, {
      startIndex: p?.index ?? 0,
      startStars: p?.stars ?? 0,
      topicId: topic.id,
    });
  }

  return (
    <ShellScreen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HighlightTitle before="Pick a" highlight="Game" after="to play" />

        <View style={styles.search}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search games…"
            placeholderTextColor={shell.lock}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search games"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Text style={styles.clear}>✕</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.chips}>
          <FilterChips options={GRADES} value={grade} onChange={setGrade} />
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>🔍</Text>
            <Text style={styles.emptyTitle}>Nothing matches that</Text>
            <Text style={styles.emptyBody}>Try a different word, or tap “All”.</Text>
          </View>
        ) : (
          visible.map((topic, i) => {
            const p = progress[topic.id];
            const started = p && p.index > 0 && p.index < topic.total;
            const finished = p && p.index >= topic.total;
            const theme = subjectTheme[topic.subject];

            return (
              <View key={topic.id} style={[styles.card, { backgroundColor: TINTS[i % TINTS.length] }]}>
                <View style={styles.cardHead}>
                  <View style={styles.cardHeadText}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {topic.emoji}  {topic.label}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {topic.grade} · {theme?.label ?? topic.subject}
                    </Text>
                  </View>
                  <CountBadge done={Math.min(p?.index ?? 0, topic.total)} total={topic.total} />
                </View>

                <Text style={styles.cardBody} numberOfLines={2}>{topic.description}</Text>

                <View style={styles.cardActions}>
                  <PeachButton
                    small
                    label={finished ? 'Play again' : started ? 'Continue' : 'Start'}
                    icon={finished ? '↻' : '▶'}
                    onPress={() => start(topic, finished)}
                  />
                  {started && (
                    <Pressable onPress={() => start(topic, true)} style={styles.restart} accessibilityRole="button">
                      <Text style={styles.restartText}>Start over</Text>
                    </Pressable>
                  )}
                  {finished && <Text style={styles.doneTag}>✓ Finished</Text>}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: shell.surface, borderRadius: shellRadius.pill,
    paddingHorizontal: 14, height: 46, marginTop: 16, ...shellShadow.card,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: shell.ink, padding: 0 },
  clear: { fontSize: 14, color: shell.lock, paddingHorizontal: 4 },
  chips: { marginTop: 12, marginBottom: 4 },

  card: { borderRadius: shellRadius.lg, padding: 14, marginTop: 12, ...shellShadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardHeadText: { flex: 1 },
  cardTitle: { ...shellType.cardTitle, color: shell.ink },
  cardMeta: { ...shellType.small, color: shell.inkMuted, marginTop: 1 },
  cardBody: { ...shellType.body, color: shell.inkMuted, marginTop: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  restart: { paddingVertical: 6 },
  restartText: { ...shellType.label, color: shell.inkMuted, textDecorationLine: 'underline' },
  doneTag: { ...shellType.label, color: shell.primaryDeep },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 4 },
  emptyGlyph: { fontSize: 34, marginBottom: 4 },
  emptyTitle: { ...shellType.cardTitle, color: shell.ink },
  emptyBody: { ...shellType.body, color: shell.inkMuted },
});
