import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GroundedCharacter } from '../components/Character';
import GameButton from '../components/GameButton';
import ParallaxWorld from '../components/ParallaxWorld';
import { CURRICULUM } from '../curriculum';
import { useSound } from '../context/SoundContext';
import { loadProgress } from '../storage';
import { OUTLINE_WIDTH, colors, fonts, radius, spacing } from '../theme';

// Home, composed as a scene rather than a page.
//
// The character is a first-class part of the composition — large, standing on
// the ground at the left, facing the primary action — rather than an
// illustration parked above a heading. The UI floats inside the world on
// plates, which is also what makes it safe: artwork is arbitrary, so text
// never sits directly on it.

const PLAYABLE = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

export default function WelcomeScreen({ navigation }) {
  const { soundOn, toggleSound } = useSound();
  const [totalStars, setTotalStars] = useState(0);
  const [resume, setResume] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(PLAYABLE.map((t) => loadProgress(t.id).then((p) => [t, p])))
        .then((entries) => {
          if (cancelled) return;
          setTotalStars(entries.reduce((sum, [, p]) => sum + (p?.stars ?? 0), 0));
          // Same bound as everywhere else: a record at or past the final round
          // is finished, not resumable.
          const open = entries.find(([topic, p]) => p && p.index > 0 && p.index < topic.total);
          setResume(open ? { topic: open[0], progress: open[1] } : null);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  return (
    <ParallaxWorld scene="meadow">
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <View style={styles.starPill}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.starCount}>{totalStars}</Text>
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

      <View style={styles.titlePlate}>
        <Text style={styles.title}>LearnPlay</Text>
        <Text style={styles.tagline}>An adventure that teaches</Text>
      </View>

      <View style={styles.stage}>
        {/* Character anchored bottom-left, facing the action on the right. */}
        <View style={styles.characterSlot}>
          <GroundedCharacter mood="happy" size={190} />
        </View>

        <View style={styles.actionSlot}>
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
              <Text style={styles.resumeEyebrow}>KEEP GOING</Text>
              <Text style={styles.resumeTitle} numberOfLines={1}>{resume.topic.emoji} {resume.topic.label}</Text>
              <View style={styles.resumeTrack}>
                <View
                  style={[
                    styles.resumeFill,
                    { width: `${Math.round((resume.progress.index / resume.topic.total) * 100)}%` },
                  ]}
                />
              </View>
            </Pressable>
          )}

          <GameButton
            label="Let's Explore!"
            icon="▶"
            size="lg"
            onPress={() => navigation.navigate('GradeSelect')}
            fullWidth
          />

          <Pressable
            onPress={() => navigation.navigate('ParentGate')}
            style={styles.parentLink}
            accessibilityRole="button"
          >
            <Text style={styles.parentLinkText}>For Grown-Ups</Text>
          </Pressable>
        </View>
      </View>
    </ParallaxWorld>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.xl,
  },
  starPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.sun, paddingVertical: 6, paddingHorizontal: spacing.sm,
    borderRadius: radius.pill, borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  starIcon: { fontSize: 14 },
  starCount: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  soundToggle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  soundIcon: { fontSize: 18 },

  // Text sits on a plate, never directly on artwork — the art can be anything,
  // and a plate is the only guarantee the title stays readable.
  titlePlate: {
    alignSelf: 'center', marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    borderRadius: radius.lg, borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
    alignItems: 'center',
  },
  title: { fontFamily: fonts.displayBold, fontSize: 36, color: colors.grapeDeep, includeFontPadding: false },
  tagline: { fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft },

  stage: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.lg },
  characterSlot: { alignItems: 'flex-start', paddingLeft: spacing.sm, marginBottom: -spacing.xs },
  actionSlot: { paddingHorizontal: spacing.md, gap: spacing.sm },

  resumeCard: {
    backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.md,
    padding: spacing.sm, borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
  },
  resumeEyebrow: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: colors.grapeDeep },
  resumeTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 1 },
  resumeTrack: {
    height: 9, borderRadius: 5, backgroundColor: colors.disabled, marginTop: 6, overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.outline,
  },
  resumeFill: { height: '100%', backgroundColor: colors.grass },

  parentLink: { alignSelf: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  parentLinkText: {
    fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white,
    textShadowColor: 'rgba(12,10,28,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});
