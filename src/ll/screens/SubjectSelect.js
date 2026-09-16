import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICON } from '../art';
import { Floating, IconButton, Pill, Pop, SpeechRow, Track } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { SUBJECTS, standard, topicsFor } from '../syllabus';
import { ll, llGradients, llRadius, llType, withAlpha } from '../tokens';
import { loadProgress } from '../../storage';

// Subjects within a standard.
//
// Each subject keeps the colour and host it has everywhere else in the app.
// The numbers are real: "ready" counts topics that actually open today, and
// the screen never pretends the rest are playable.
//
// The premium pass fixes the weakest state on the screen. A subject with no
// games was drawn as the same card at 60% opacity, which reads as broken
// rather than forthcoming. It now has its own treatment — a dashed outline,
// a "COMING SOON" ribbon and its host peeking over the edge — so an empty
// subject looks like something being built, not something failing to load.
export default function SubjectSelect({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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

  const compact = width < 360;

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
                <View style={[styles.cardCast, { shadowColor: sub.deep }, none && styles.cardCastOff]}>
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
                    style={({ pressed }) => [pressed && styles.cardPressed]}
                  >
                    <LinearGradient
                      colors={none
                        ? ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)']
                        : [withAlpha('#FFFFFF', 0.55), sub.soft]}
                      style={[styles.card, none && styles.cardOff]}
                    >
                      {!none ? <Sheen variant="tile" radius={llRadius.xxl} /> : null}
                      <TopHighlight radius={llRadius.xxl} />

                      {/* Coming soon reads as forthcoming, not broken. */}
                      {none ? (
                        <View style={[styles.ribbon, { backgroundColor: sub.tint }]}>
                          <Text style={styles.ribbonText}>COMING SOON</Text>
                        </View>
                      ) : null}

                      <View style={styles.cardTop}>
                        <View style={[styles.iconCast, { shadowColor: sub.deep }]}>
                          <View style={[styles.iconWrap, { backgroundColor: sub.tint }, none && styles.iconWrapOff]}>
                            <Image source={sub.pose} style={styles.iconImg} />
                          </View>
                        </View>

                        <View style={styles.cardBody}>
                          <Text style={styles.cardName}>{sub.name}</Text>
                          <Text style={styles.cardBlurb}>{sub.blurb}</Text>
                          <Text style={[styles.cardCount, { color: none ? ll.muted : sub.deep }]}>
                            {none ? `${s.total} topics on the way` : `${s.playable} ready · ${s.total} topics`}
                          </Text>
                        </View>

                        <Floating duration={3800 + i * 260} distance={5}>
                          <View style={styles.hostCast}>
                            <Image source={sub.face} style={[styles.hostFace, none && styles.hostFaceOff]} />
                          </View>
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
                    </LinearGradient>
                  </Pressable>
                </View>
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

  title: { ...llType.h2, color: ll.ink, letterSpacing: -0.3 },
  body: { ...llType.body, color: ll.soft },

  list: { gap: 13, marginTop: 4 },
  cardCast: {
    borderRadius: llRadius.xxl,
    shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 7,
  },
  cardCastOff: { shadowOpacity: 0.07, shadowRadius: 14, elevation: 2 },
  card: {
    borderRadius: llRadius.xxl, padding: 15, gap: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  cardOff: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha('#8B86B8', 0.4),
  },
  cardPressed: { transform: [{ scale: 0.985 }, { translateY: 2 }] },

  ribbon: {
    position: 'absolute', top: 12, right: -26, paddingVertical: 3, paddingHorizontal: 30,
    transform: [{ rotate: '32deg' }],
  },
  ribbonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8.5, letterSpacing: 1.2, color: ll.white },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCast: {
    borderRadius: llRadius.md,
    shadowOpacity: 0.26, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  iconWrap: { width: 62, height: 62, borderRadius: llRadius.md, overflow: 'hidden' },
  iconWrapOff: { opacity: 0.62 },
  iconImg: { width: '100%', height: '100%' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  cardBlurb: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: ll.body },
  cardCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, marginTop: 2 },
  hostCast: {
    borderRadius: 23,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  hostFace: { width: 46, height: 46, borderRadius: 23 },
  hostFaceOff: { opacity: 0.6 },

  trackWrap: { gap: 5 },
  trackMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10.5, color: ll.body },
  starChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starIcon: { width: 15, height: 15, borderRadius: 5 },
  starText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: ll.ink },
});
