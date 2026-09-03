import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GameButton from '../components/GameButton';
import Mascot from '../components/Mascot';
import SceneBackground from '../components/SceneBackground';
import StarRow from '../components/StarRow';
import { CURRICULUM } from '../curriculum';
import { useSound } from '../context/SoundContext';
import { loadProgress } from '../storage';
import { colors, fonts, radius, shadow, spacing, subjectTheme, type } from '../theme';

// Home.
//
// The brief for this screen is that a child should know what to do within a
// second. So there is exactly one big thing to press. Everything else —
// the star count, the resume card — is status, deliberately smaller and
// below it, never competing for the same glance.

// Every playable topic across the whole curriculum, flattened once.
const PLAYABLE = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

export default function WelcomeScreen({ navigation }) {
  const { soundOn, toggleSound } = useSound();
  const [totalStars, setTotalStars] = useState(0);
  const [resume, setResume] = useState(null);

  // Re-read on focus so finishing a game updates the home screen behind it.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(PLAYABLE.map((t) => loadProgress(t.id).then((p) => [t, p])))
        .then((entries) => {
          if (cancelled) return;
          const stars = entries.reduce((sum, [, p]) => sum + (p?.stars ?? 0), 0);
          // Same bound as TopicSelect: a record at or past the final round is
          // finished, not resumable, and must never be offered as "Continue".
          const inProgress = entries.find(
            ([topic, p]) => p && p.index > 0 && p.index < topic.total,
          );
          setTotalStars(stars);
          setResume(inProgress ? { topic: inProgress[0], progress: inProgress[1] } : null);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  const playedCount = PLAYABLE.length;

  return (
    <SceneBackground>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.starPill}>
            <Text style={styles.starPillIcon}>⭐</Text>
            <Text style={styles.starPillText}>{totalStars}</Text>
          </View>

          <Pressable
            onPress={toggleSound}
            style={styles.soundToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: soundOn }}
            accessibilityLabel={soundOn ? 'Sound on. Tap to mute.' : 'Sound off. Tap to unmute.'}
          >
            <Text style={styles.soundIcon}>{soundOn ? '🔊' : '🔇'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Mascot mood="happy" size={150} />
          <Text style={styles.title}>LearnPlay</Text>
          <Text style={styles.subtitle}>Play with Pip and learn something new!</Text>
        </View>

        <GameButton
          label="PLAY"
          icon="▶"
          size="lg"
          onPress={() => navigation.navigate('GradeSelect')}
          style={styles.cta}
        />

        {resume && (
          <Pressable
            style={styles.resumeCard}
            onPress={() =>
              navigation.navigate(resume.topic.playable, {
                startIndex: resume.progress.index,
                startStars: resume.progress.stars,
                topicId: resume.topic.id,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Keep playing ${resume.topic.label}`}
          >
            <View
              style={[
                styles.resumeIcon,
                { backgroundColor: subjectTheme[resume.topic.subject]?.soft ?? colors.grapeSoft },
              ]}
            >
              <Text style={styles.resumeEmoji}>{resume.topic.emoji}</Text>
            </View>
            <View style={styles.resumeBody}>
              <Text style={styles.resumeEyebrow}>KEEP GOING</Text>
              <Text style={styles.resumeTitle} numberOfLines={1}>{resume.topic.label}</Text>
              <Text style={styles.resumeMeta}>
                Round {resume.progress.index + 1} of {resume.topic.total}
              </Text>
            </View>
            <Text style={styles.resumeChevron}>›</Text>
          </Pressable>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{playedCount}</Text>
            <Text style={styles.statLabel}>games to play</Text>
          </View>
          <View style={styles.statCard}>
            <StarRow earned={Math.min(3, Math.floor(totalStars / 25))} size={20} />
            <Text style={styles.statLabel}>your badges</Text>
          </View>
        </View>

        <View style={styles.subjectRow}>
          {Object.entries(subjectTheme).map(([id, s]) => (
            <View key={id} style={[styles.subjectChip, { backgroundColor: s.soft }]}>
              <Text style={styles.subjectEmoji}>{s.emoji}</Text>
              <Text style={styles.subjectLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate('ParentGate')}
          style={styles.parentLink}
          accessibilityRole="button"
        >
          <Text style={styles.parentLinkText}>For Grown-Ups</Text>
        </Pressable>
      </ScrollView>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg, alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', alignItems: 'center' },
  starPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.white, paddingVertical: 7, paddingHorizontal: spacing.sm,
    borderRadius: radius.pill, ...shadow.sm,
  },
  starPillIcon: { fontSize: 15 },
  starPillText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  soundToggle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  soundIcon: { fontSize: 19 },

  hero: { alignItems: 'center', marginTop: spacing.sm },
  title: { ...type.hero, color: colors.ink, marginTop: spacing.xs },
  subtitle: { ...type.body, color: colors.muted, marginTop: 2, textAlign: 'center' },

  cta: { marginTop: spacing.lg, minWidth: 220 },

  resumeCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.sm, marginTop: spacing.lg, alignSelf: 'stretch', ...shadow.md,
  },
  resumeIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  resumeEmoji: { fontSize: 26 },
  resumeBody: { flex: 1 },
  resumeEyebrow: { ...type.eyebrow, color: colors.grapeDeep },
  resumeTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink },
  resumeMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  resumeChevron: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.lock, marginRight: spacing.xs },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radius.md,
    paddingVertical: spacing.sm, alignItems: 'center', gap: 2, ...shadow.sm,
  },
  statNumber: { ...type.numeral, color: colors.grapeDeep, includeFontPadding: false },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },

  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  subjectChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: spacing.sm, borderRadius: radius.pill,
  },
  subjectEmoji: { fontSize: 14 },
  subjectLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.ink },

  parentLink: { marginTop: spacing.lg, padding: spacing.sm },
  parentLinkText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
});
