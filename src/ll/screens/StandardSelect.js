import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FACE, ICON } from '../art';
import { Floating, IconButton, Pill, Pop, SpeechRow, Track } from '../kit';
import { STANDARDS, SUBJECTS, countsFor, topicsFor } from '../syllabus';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { loadProgress } from '../../storage';

// Choose a standard.
//
// This is the hinge of the whole app: everything downstream — subjects,
// topics, the games themselves — is a slice of the standard picked here. So
// it gets a full screen rather than a dropdown, and each standard is
// presented as a place with a host, a colour and real numbers attached.

export default function StandardSelect({ navigation }) {
  const insets = useSafeAreaInsets();
  const [starsByStandard, setStarsByStandard] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        STANDARDS.map(async (s) => {
          const topics = SUBJECTS.flatMap((sub) => topicsFor(s.id, sub.id)).filter((t) => t.playable);
          const records = await Promise.all(topics.map((t) => loadProgress(t.id)));
          const stars = records.reduce((sum, p) => sum + (p?.stars ?? 0), 0);
          const done = records.filter((p, i) => p && p.index >= topics[i].total).length;
          return [s.id, { stars, done, playable: topics.length }];
        }),
      )
        .then((rows) => { if (!cancelled) setStarsByStandard(Object.fromEntries(rows)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, []),
  );

  return (
    <LinearGradient colors={llGradients.onb3} locations={[0, 0.5, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
          <View style={{ flex: 1 }} />
        </View>

        <Text style={styles.title}>Which class are you in?</Text>
        <Text style={styles.body}>
          Pick your class and we'll show the right lessons. You can change it any time.
        </Text>

        <SpeechRow face={FACE.miaWink} faceSize={52} tone={ll.pinkTint} textColor={ll.pinkDeep}>
          "Not sure? Choose the one you're starting this year — nothing is locked."
        </SpeechRow>

        <View style={styles.list}>
          {STANDARDS.map((s, i) => {
            const stats = starsByStandard[s.id] ?? { stars: 0, done: 0, playable: 0 };
            const counts = countsFor(s.id);
            const ratio = stats.playable ? stats.done / stats.playable : 0;

            return (
              <Pop key={s.id} delay={i * 110}>
                <Pressable
                  onPress={() => navigation.navigate('LLSubjects', { standardId: s.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name}, ${s.tag}. ${counts.playable} games ready of ${counts.total} topics.`}
                  style={({ pressed }) => [
                    styles.card,
                    { borderColor: s.tint },
                    pressed && styles.cardPressed,
                  ]}
                >
                  {/* World art sets the mood; a wash keeps the text readable
                      whatever the illustration does underneath. */}
                  <Image source={s.world} style={styles.cardArt} />
                  <LinearGradient
                    colors={['rgba(255,255,255,0.97)', 'rgba(255,255,255,0.86)', 'rgba(255,255,255,0.42)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.6 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.cardRow}>
                    <View style={styles.cardBody}>
                      <Pill label={s.tag} bg={s.soft} color={s.deep} />
                      <Text style={styles.cardName}>{s.name}</Text>
                      <Text style={styles.cardBlurb}>{s.blurb}</Text>

                      <View style={styles.metaRow}>
                        <View style={styles.metaChip}>
                          <Image source={ICON.star} style={styles.metaIcon} />
                          <Text style={styles.metaText}>{stats.stars}</Text>
                        </View>
                        <Text style={styles.metaSep}>
                          {counts.playable} ready · {counts.total} topics
                        </Text>
                      </View>

                      {stats.playable > 0 && (
                        <View style={styles.trackWrap}>
                          <Track
                            value={ratio}
                            height={12}
                            colors={[s.tint, s.deep]}
                          />
                          <Text style={styles.trackLabel}>
                            {stats.done} of {stats.playable} finished
                          </Text>
                        </View>
                      )}
                    </View>

                    <Floating duration={4200 + i * 300} distance={7} style={styles.cardHost}>
                      <Image source={s.pose} style={styles.cardHostImg} accessibilityLabel={s.host} />
                    </Floating>
                  </View>
                </Pressable>
              </Pop>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center' },

  title: { ...llType.h2, color: ll.ink },
  body: { ...llType.body, color: ll.soft },

  list: { gap: 14, marginTop: 4 },
  card: {
    borderRadius: llRadius.xxl,
    overflow: 'hidden',
    backgroundColor: ll.white,
    borderWidth: 2,
    ...llShadow.card,
  },
  cardPressed: { transform: [{ scale: 0.985 }] },
  cardArt: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },

  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  cardBody: { flex: 1, gap: 6 },
  cardName: { ...llType.h3, color: ll.ink },
  cardBlurb: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, lineHeight: 17, color: ll.body },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: ll.amberSoft, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 8,
  },
  metaIcon: { width: 16, height: 16, borderRadius: 5 },
  metaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: ll.amberInk },
  metaSep: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, color: ll.muted },

  trackWrap: { marginTop: 6, gap: 4 },
  trackLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10.5, color: ll.muted },

  cardHost: { flexShrink: 0 },
  cardHostImg: { width: 84, height: 84, borderRadius: 26 },
});
