import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BackButton from '../components/BackButton';
import FadeInCard from '../components/FadeInCard';
import ProgressRing from '../components/ProgressRing';
import SceneBackground from '../components/SceneBackground';
import { CURRICULUM, isGradeAvailable } from '../curriculum';
import { loadProgress } from '../storage';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

// The adventure map.
//
// Three worlds on a winding path instead of three stacked buttons. The path
// is the point: it says these are stops on a journey with an order, which a
// list of equal cards does not. Each island shows real completion, so a child
// can see the world they're partway through.

const GRADES = [
  { id: 'jrkg', label: 'Junior KG', emoji: '🧸', world: 'Teddy Meadow', tint: colors.grass, deep: colors.grassDeep, soft: colors.grassSoft },
  { id: 'srkg', label: 'Senior KG', emoji: '🎈', world: 'Balloon Bay', tint: colors.sun, deep: colors.sunDeep, soft: colors.sunSoft },
  { id: 'g1', label: 'Grade 1', emoji: '📘', world: 'Story Summit', tint: colors.sky, deep: colors.skyDeep, soft: colors.skySoft },
];

function playableTopics(gradeLabel) {
  const subjects = CURRICULUM[gradeLabel] ?? {};
  return Object.values(subjects).flat().filter((t) => t.playable);
}

export default function GradeSelectScreen({ navigation }) {
  const [doneByGrade, setDoneByGrade] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        GRADES.map(async (g) => {
          const topics = playableTopics(g.label);
          const records = await Promise.all(topics.map((t) => loadProgress(t.id)));
          const done = records.filter((p, i) => p && p.index >= topics[i].total).length;
          return [g.label, { done, total: topics.length }];
        }),
      )
        .then((entries) => { if (!cancelled) setDoneByGrade(Object.fromEntries(entries)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  return (
    <SceneBackground>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>CHOOSE YOUR WORLD</Text>
        <Text style={styles.title}>Where to today?</Text>
      </View>

      <View style={styles.map}>
        {/* The trail behind the islands. Drawn once, behind everything, so
            the stops read as connected rather than as three separate cards. */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path
            d="M 70 60 C 240 100, 40 190, 200 250 C 320 300, 120 350, 150 430"
            stroke={colors.lock}
            strokeWidth="4"
            strokeDasharray="2 12"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </Svg>

        {GRADES.map((grade, i) => {
          const available = isGradeAvailable(grade.label);
          const stats = doneByGrade[grade.label] ?? { done: 0, total: 0 };
          const ratio = stats.total ? stats.done / stats.total : 0;
          const complete = stats.total > 0 && stats.done === stats.total;

          return (
            <FadeInCard key={grade.id} index={i}>
              <Pressable
                disabled={!available}
                onPress={() => navigation.navigate('SubjectSelect', { grade: grade.label })}
                style={[styles.island, i % 2 === 1 && styles.islandRight]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !available }}
                accessibilityLabel={
                  available
                    ? `${grade.world}, ${grade.label}. ${stats.done} of ${stats.total} games finished.`
                    : `${grade.label}, coming soon`
                }
              >
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: available ? grade.soft : colors.disabled },
                    available && { borderColor: grade.tint },
                  ]}
                >
                  <Text style={styles.badgeEmoji}>{available ? grade.emoji : '🔒'}</Text>
                  {available && stats.total > 0 && (
                    <ProgressRing
                      progress={ratio}
                      size={78}
                      strokeWidth={5}
                      color={grade.deep}
                      trackColor="transparent"
                      style={styles.ring}
                    />
                  )}
                </View>

                <View style={styles.islandBody}>
                  <Text style={[styles.worldName, !available && styles.dimmed]}>{grade.world}</Text>
                  <Text style={[styles.gradeName, !available && styles.dimmed]}>{grade.label}</Text>
                  {available ? (
                    <View style={[styles.chip, { backgroundColor: grade.soft }]}>
                      <Text style={styles.chipText}>
                        {complete ? '🏆 All done!' : `${stats.done}/${stats.total} games`}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.chipMuted}>
                      <Text style={styles.chipMutedText}>Coming soon</Text>
                    </View>
                  )}
                </View>
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

  map: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  island: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.sm, paddingRight: spacing.lg, ...shadow.md,
  },
  // Alternating inset so the row of islands traces the path rather than
  // sitting in a rigid column.
  islandRight: { marginLeft: spacing.lg },

  badge: {
    width: 78, height: 78, borderRadius: 39,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent',
  },
  badgeEmoji: { fontSize: 34 },
  ring: { position: 'absolute', top: -3, left: -3 },

  islandBody: { flex: 1, gap: 2 },
  worldName: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  gradeName: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  dimmed: { color: colors.lock },

  chip: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radius.pill, marginTop: 4 },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink },
  chipMuted: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.disabled, marginTop: 4 },
  chipMutedText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
});
