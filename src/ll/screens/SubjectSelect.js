import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICON } from '../art';
import { Floating, IconButton, Pill, Pop, SpeechRow, Track } from '../kit';
import { SUBJECTS, standard, topicsFor } from '../syllabus';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { loadProgress } from '../../storage';

// Subjects within a standard.
//
// Each subject keeps the colour and host it has everywhere else in the app.
// The numbers are real: "ready" counts topics that actually open today, and
// the screen never pretends the rest are playable.

export default function SubjectSelect({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { standardId } = route.params;
  const std = standard(standardId);
  const [stats, setStats] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        SUBJECTS.map(async (sub) => {
          const all = topicsFor(standardId, sub.id);
          const playable = all.filter((t) => t.playable);
          const records = await Promise.all(playable.map((t) => loadProgress(t.id)));
          return [sub.id, {
            total: all.length,
            playable: playable.length,
            done: records.filter((p, i) => p && p.index >= playable[i].total).length,
            stars: records.reduce((sum, p) => sum + (p?.stars ?? 0), 0),
          }];
        }),
      )
        .then((rows) => { if (!cancelled) setStats(Object.fromEntries(rows)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [standardId]),
  );

  return (
    <LinearGradient colors={llGradients.onb2} locations={[0, 0.46, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 34 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
          <Pill label={std.name.toUpperCase()} bg={std.soft} color={std.deep} spaced style={styles.stdPill} />
        </View>

        <Text style={styles.title}>What shall we learn?</Text>
        <Text style={styles.body}>Three subjects, each with its own friend to guide you.</Text>

        <SpeechRow face={std.face} faceSize={52} tone={std.soft} textColor={std.deep}>
          {`"Welcome to ${std.name}! Pick a subject and let's begin."`}
        </SpeechRow>

        <View style={styles.list}>
          {SUBJECTS.map((sub, i) => {
            const s = stats[sub.id] ?? { total: 0, playable: 0, done: 0, stars: 0 };
            const ratio = s.playable ? s.done / s.playable : 0;
            const none = s.playable === 0;

            return (
              <Pop key={sub.id} delay={i * 100}>
                <Pressable
                  disabled={none}
                  onPress={() => navigation.navigate('LLSyllabus', { standardId, subjectId: sub.id })}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: none }}
                  accessibilityLabel={
                    none
                      ? `${sub.name}, no games yet`
                      : `${sub.name}. ${s.playable} games ready, ${s.done} finished.`
                  }
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: sub.soft },
                    none && styles.cardOff,
                    pressed && styles.cardPressed,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: sub.tint }]}>
                      <Image source={sub.pose} style={styles.iconImg} />
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{sub.name}</Text>
                      <Text style={styles.cardBlurb}>{sub.blurb}</Text>
                      <Text style={[styles.cardCount, { color: sub.deep }]}>
                        {none ? 'Coming soon' : `${s.playable} ready · ${s.total} topics`}
                      </Text>
                    </View>

                    <Floating duration={3800 + i * 260} distance={5}>
                      <Image source={sub.face} style={styles.hostFace} />
                    </Floating>
                  </View>

                  {!none && (
                    <View style={styles.trackWrap}>
                      <Track value={ratio} height={12} colors={[sub.tint, sub.deep]} bg="rgba(255,255,255,0.75)" />
                      <View style={styles.trackMeta}>
                        <Text style={styles.trackLabel}>{s.done} of {s.playable} finished</Text>
                        <View style={styles.starChip}>
                          <Image source={ICON.star} style={styles.starIcon} />
                          <Text style={styles.starText}>{s.stars}</Text>
                        </View>
                      </View>
                    </View>
                  )}
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stdPill: { alignSelf: 'center' },

  title: { ...llType.h2, color: ll.ink },
  body: { ...llType.body, color: ll.soft },

  list: { gap: 13, marginTop: 4 },
  card: { borderRadius: llRadius.xxl, padding: 15, gap: 12, ...llShadow.card },
  cardOff: { opacity: 0.6 },
  cardPressed: { transform: [{ scale: 0.985 }] },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 62, height: 62, borderRadius: llRadius.md, overflow: 'hidden' },
  iconImg: { width: '100%', height: '100%' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  cardBlurb: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: ll.body },
  cardCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, marginTop: 2 },
  hostFace: { width: 46, height: 46, borderRadius: 23 },

  trackWrap: { gap: 5 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10.5, color: ll.body },
  starChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starIcon: { width: 15, height: 15, borderRadius: 5 },
  starText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: ll.ink },
});
