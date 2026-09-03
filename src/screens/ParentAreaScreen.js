import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import ProgressRing, { RingLabel } from '../components/ProgressRing';
import { CURRICULUM } from '../curriculum';
import { useSound } from '../context/SoundContext';
import { clearProgress, loadProgress } from '../storage';
import { colors, fonts, radius, shadow, spacing, subjectTheme, type } from '../theme';

// The grown-up side.
//
// Deliberately a different visual register from the game: flat surfaces, no
// mascot, no gradient, information-first. It should feel like the settings
// screen of a product a parent trusts, not another playground.

const PLAYABLE = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

export default function ParentAreaScreen({ navigation }) {
  const { soundOn, toggleSound } = useSound();
  const [rows, setRows] = useState([]);

  const refresh = useCallback(() => {
    let cancelled = false;
    Promise.all(PLAYABLE.map((t) => loadProgress(t.id).then((p) => ({ topic: t, progress: p }))))
      .then((result) => { if (!cancelled) setRows(result); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useFocusEffect(refresh);

  const totalStars = rows.reduce((sum, r) => sum + (r.progress?.stars ?? 0), 0);
  const started = rows.filter((r) => r.progress && r.progress.stars > 0);
  const finished = rows.filter((r) => r.progress && r.progress.index >= r.topic.total);

  // Which subjects has the child actually spent stars in? This is the one
  // genuinely useful signal here — it shows what they gravitate to and what
  // they're avoiding.
  const bySubject = Object.keys(subjectTheme).map((id) => {
    const subjectRows = rows.filter((r) => r.topic.subject === id);
    const stars = subjectRows.reduce((sum, r) => sum + (r.progress?.stars ?? 0), 0);
    const done = subjectRows.filter((r) => r.progress && r.progress.index >= r.topic.total).length;
    return { id, ...subjectTheme[id], stars, done, total: subjectRows.length };
  });

  function confirmReset() {
    Alert.alert(
      'Reset all progress?',
      'This clears every star and unlocks nothing new. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Promise.all(PLAYABLE.map((t) => clearProgress(t.id)));
            refresh();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PARENT DASHBOARD</Text>
          <Text style={styles.title}>Learning progress</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalStars}</Text>
            <Text style={styles.summaryLabel}>stars earned</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{started.length}</Text>
            <Text style={styles.summaryLabel}>games tried</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{finished.length}</Text>
            <Text style={styles.summaryLabel}>completed</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By subject</Text>
        <View style={styles.card}>
          {bySubject.map((s, i) => (
            <View key={s.id} style={[styles.subjectRow, i > 0 && styles.divider]}>
              <ProgressRing
                progress={s.total ? s.done / s.total : 0}
                size={48}
                strokeWidth={5}
                color={s.base}
              >
                <RingLabel size={13}>{s.done}/{s.total}</RingLabel>
              </ProgressRing>
              <View style={styles.subjectBody}>
                <Text style={styles.subjectName}>{s.emoji}  {s.label}</Text>
                <Text style={styles.subjectMeta}>
                  {s.stars} {s.stars === 1 ? 'star' : 'stars'} · {s.done} of {s.total} finished
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.card}>
          {started.length === 0 ? (
            <Text style={styles.empty}>No games played yet.</Text>
          ) : (
            started.map((r, i) => (
              <View key={r.topic.id} style={[styles.activityRow, i > 0 && styles.divider]}>
                <Text style={styles.activityEmoji}>{r.topic.emoji}</Text>
                <View style={styles.activityBody}>
                  <Text style={styles.activityName} numberOfLines={1}>{r.topic.label}</Text>
                  <Text style={styles.activityMeta}>
                    {r.topic.grade} · {subjectTheme[r.topic.subject]?.label ?? r.topic.subject}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityStars}>⭐ {r.progress.stars}</Text>
                  <Text style={styles.activityProgress}>
                    {Math.min(r.progress.index, r.topic.total)}/{r.topic.total}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingBody}>
              <Text style={styles.settingName}>Sound & voice</Text>
              <Text style={styles.settingMeta}>Spoken instructions and effect sounds</Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={toggleSound}
              trackColor={{ true: colors.grape, false: colors.disabled }}
              thumbColor={colors.white}
            />
          </View>
          <Pressable style={[styles.settingRow, styles.divider]} onPress={confirmReset}>
            <View style={styles.settingBody}>
              <Text style={[styles.settingName, styles.danger]}>Reset all progress</Text>
              <Text style={styles.settingMeta}>Clears every star on this device</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable style={styles.exit} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.exitText}>← Back to the games</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6FB' },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  header: { marginBottom: spacing.md },
  eyebrow: { ...type.eyebrow, color: colors.muted },
  title: { ...type.title, color: colors.ink, marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center', ...shadow.sm,
  },
  summaryNumber: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.grapeDeep },
  summaryLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radius.md, ...shadow.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },

  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  subjectBody: { flex: 1 },
  subjectName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  subjectMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  activityEmoji: { fontSize: 22 },
  activityBody: { flex: 1 },
  activityName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
  activityMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  activityRight: { alignItems: 'flex-end' },
  activityStars: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  activityProgress: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  empty: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, padding: spacing.md, textAlign: 'center' },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, gap: spacing.sm },
  settingBody: { flex: 1 },
  settingName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  settingMeta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  danger: { color: colors.coralDeep },
  chevron: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.lock },

  exit: { marginTop: spacing.lg, alignItems: 'center', padding: spacing.sm },
  exitText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.grapeDeep },
});
