import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Character from '../../components/Character';
import {
  CategoryCircle, ContentCard, GreetingRow, LevelCard, PeachButton, ShellScreen,
} from '../../components/shellUI';
import { CURRICULUM } from '../../curriculum';
import { ANIMALS } from '../../sceneAssets';
import { loadProgress } from '../../storage';
import { shell } from '../../theme';

// The landing tab.
//
// Reads top to bottom as: who you are → where you're up to → where you can go
// → what's worth doing next. Everything above the fold answers a question a
// child actually has, which is why the level card sits before the categories.

const PLAYABLE = Object.entries(CURRICULUM).flatMap(([grade, subjects]) =>
  Object.entries(subjects).flatMap(([subject, topics]) =>
    topics.filter((t) => t.playable).map((t) => ({ ...t, grade, subject })),
  ),
);

// A level per 20 stars. Slow enough that levelling up stays an event, fast
// enough that a new player sees Level 2 within a session or two.
const STARS_PER_LEVEL = 20;

export default function LessonsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(0);
  const [resume, setResume] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(PLAYABLE.map((t) => loadProgress(t.id).then((p) => [t, p])))
        .then((entries) => {
          if (cancelled) return;
          setStars(entries.reduce((s, [, p]) => s + (p?.stars ?? 0), 0));
          setDone(entries.filter(([t, p]) => p && p.index >= t.total).length);
          const open = entries.find(([t, p]) => p && p.index > 0 && p.index < t.total);
          setResume(open ? { topic: open[0], progress: open[1] } : null);
        })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  const level = Math.floor(stars / STARS_PER_LEVEL) + 1;
  const intoLevel = (stars % STARS_PER_LEVEL) / STARS_PER_LEVEL;

  return (
    <ShellScreen>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <GreetingRow
          name="friend"
          progressLabel={`${done} of ${PLAYABLE.length} finished`}
          right={
            <Pressable
              style={styles.bell}
              onPress={() => navigation.navigate('ParentGate')}
              accessibilityRole="button"
              accessibilityLabel="For grown-ups"
            >
              <Text style={styles.bellGlyph}>⚙</Text>
            </Pressable>
          }
        />

        <View style={styles.block}>
          <LevelCard
            title={`Level ${level}`}
            subtitle={
              level === 1
                ? 'This is your first step to greatness!'
                : `${STARS_PER_LEVEL - (stars % STARS_PER_LEVEL)} more stars to Level ${level + 1}`
            }
            progress={intoLevel}
            trailing={<Text style={styles.trophy}>🏆</Text>}
          />
        </View>

        <View style={styles.categories}>
          <CategoryCircle icon="📚" label="Lessons" tint={shell.primarySoft} onPress={() => navigation.navigate('GradeSelect')} />
          <CategoryCircle icon="🎮" label="Games" tint={shell.tintPeach} onPress={() => navigation.navigate('Games')} />
          <CategoryCircle icon="📖" label="Stories" tint={shell.tintMint} onPress={() => navigation.navigate('Stories')} />
          <CategoryCircle icon="🎨" label="Activities" tint={shell.tintLavender} onPress={() => navigation.navigate('Activities')} />
          <CategoryCircle icon="🧭" label="Discover" tint={shell.accentSoft} onPress={() => navigation.navigate('Discover')} />
        </View>

        {resume && (
          <View style={styles.block}>
            <ContentCard
              icon="▶"
              title="Keep going"
              tint={shell.tintPeach}
              body={`${resume.topic.label} — round ${resume.progress.index + 1} of ${resume.topic.total}`}
              onPress={() =>
                navigation.navigate(resume.topic.playable, {
                  startIndex: resume.progress.index,
                  startStars: resume.progress.stars,
                  topicId: resume.topic.id,
                })
              }
              art={<Character mood="point" size={72} animate={false} />}
              footer={
                <PeachButton
                  small
                  label="Continue"
                  onPress={() =>
                    navigation.navigate(resume.topic.playable, {
                      startIndex: resume.progress.index,
                      startStars: resume.progress.stars,
                      topicId: resume.topic.id,
                    })
                  }
                  style={styles.inlineBtn}
                />
              }
            />
          </View>
        )}

        <View style={styles.block}>
          <ContentCard
            icon="✨"
            title="Meet Mia"
            tint={shell.accentSoft}
            body="Say hello to your 3D friend. Tap a button and watch her react."
            onPress={() => navigation.navigate('Mia')}
            art={<Character mood="happy" size={72} animate={false} />}
          />
        </View>

        <View style={styles.block}>
          <ContentCard
            icon="📚"
            title="Lessons"
            tint={shell.tintLavender}
            body="Follow the curriculum by grade and subject, one topic at a time."
            onPress={() => navigation.navigate('GradeSelect')}
            art={<Image source={ANIMALS.owl} style={styles.artImage} resizeMode="contain" />}
          />
        </View>

        <View style={styles.block}>
          <ContentCard
            icon="🎮"
            title="Games"
            tint={shell.tintMint}
            body="Jump straight into any game, no menus in the way."
            onPress={() => navigation.navigate('Games')}
            art={<Image source={ANIMALS.rabbit} style={styles.artImage} resizeMode="contain" />}
          />
        </View>
      </ScrollView>
    </ShellScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18 },
  block: { marginTop: 16 },
  bell: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: shell.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  bellGlyph: { fontSize: 17, color: shell.ink },
  trophy: { fontSize: 34 },
  categories: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 18, paddingHorizontal: 2,
  },
  artImage: { width: 74, height: 74 },
  inlineBtn: { alignSelf: 'flex-start' },
});
