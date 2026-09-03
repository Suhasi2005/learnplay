import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import FadeInCard from '../components/FadeInCard';
import { MascotBadge } from '../components/Mascot';
import ProgressRing, { RingLabel } from '../components/ProgressRing';
import SceneBackground from '../components/SceneBackground';
import { CURRICULUM, isSubjectAvailable } from '../curriculum';
import { loadProgress } from '../storage';
import { colors, fonts, radius, shadow, spacing, subjectTheme, type } from '../theme';

const SUBJECTS = ['English', 'Math', 'EVS'];

export default function SubjectSelectScreen({ route, navigation }) {
  const { grade } = route.params;
  const [statsBySubject, setStatsBySubject] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        SUBJECTS.map(async (id) => {
          const topics = (CURRICULUM[grade]?.[id] ?? []).filter((t) => t.playable);
          const records = await Promise.all(topics.map((t) => loadProgress(t.id)));
          const done = records.filter((p, i) => p && p.index >= topics[i].total).length;
          const stars = records.reduce((sum, p) => sum + (p?.stars ?? 0), 0);
          return [id, { done, stars, total: topics.length }];
        }),
      )
        .then((entries) => { if (!cancelled) setStatsBySubject(Object.fromEntries(entries)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [grade]),
  );

  return (
    <SceneBackground>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>{grade.toUpperCase()}</Text>
        <Text style={styles.title}>What shall we play?</Text>

        <View style={styles.pipRow}>
          <MascotBadge size={38} mood="happy" />
          <View style={styles.speech}>
            <Text style={styles.speechText}>Pick anything you like!</Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {SUBJECTS.map((id, i) => {
          const theme = subjectTheme[id];
          const available = isSubjectAvailable(grade, id);
          const stats = statsBySubject[id] ?? { done: 0, stars: 0, total: 0 };
          const ratio = stats.total ? stats.done / stats.total : 0;

          return (
            <FadeInCard key={id} index={i}>
              <Pressable
                disabled={!available}
                onPress={() => navigation.navigate('TopicSelect', { grade, subject: id })}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: available ? theme.soft : colors.disabled },
                  available && { borderColor: theme.base },
                  pressed && styles.cardPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !available }}
                accessibilityLabel={
                  available
                    ? `${theme.label}. ${stats.done} of ${stats.total} games finished.`
                    : `${theme.label}, coming soon`
                }
              >
                <View style={[styles.iconWrap, { backgroundColor: available ? theme.base : colors.lock }]}>
                  <Text style={styles.icon}>{available ? theme.emoji : '🔒'}</Text>
                </View>

                <View style={styles.body}>
                  <Text style={[styles.label, !available && styles.dimmed]}>{theme.label}</Text>
                  <Text style={[styles.meta, !available && styles.dimmed]}>
                    {available
                      ? `${stats.total} ${stats.total === 1 ? 'game' : 'games'} · ⭐ ${stats.stars}`
                      : 'Coming soon'}
                  </Text>
                </View>

                {available && stats.total > 0 && (
                  <ProgressRing progress={ratio} size={46} strokeWidth={5} color={theme.deep}>
                    <RingLabel size={12}>{stats.done}/{stats.total}</RingLabel>
                  </ProgressRing>
                )}
              </Pressable>
            </FadeInCard>
          );
        })}
      </View>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  eyebrow: { ...type.eyebrow, color: colors.grapeDeep },
  title: { ...type.title, color: colors.ink, marginTop: 2 },

  pipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  speech: {
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: spacing.sm, ...shadow.sm,
  },
  speechText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.lg, padding: spacing.sm, borderWidth: 2, borderColor: 'transparent',
    ...shadow.sm,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  iconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 27 },
  body: { flex: 1 },
  label: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  dimmed: { color: colors.muted },
});
