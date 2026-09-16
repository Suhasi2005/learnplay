import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICON } from '../art';
import { IconButton, LLButton, Pill, Pop, SpeechRow, Track } from '../kit';
import { TopHighlight } from '../premium';
import { decorate, standard, subject, topicsFor } from '../syllabus';
import { ll, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import { clearProgress, loadProgress } from '../../storage';

// The syllabus for one subject in one standard.
//
// Every researched topic is listed, not just the ones that open — the scope
// is real and the gap is stated rather than hidden. A topic is in exactly
// one of four states and each looks different enough to read at a glance:
//
//   new      ready to start
//   started  partly done, resumable
//   done     finished, replayable
//   soon     researched, no game built yet
//
// The premium pass turns the list into a path. A syllabus is an ordered
// journey — topic 4 follows topic 3 — and a stack of identical cards says
// nothing about that. Now a trail runs down the left edge with a numbered
// node per topic: filled green when finished, amber and ringed when in
// progress, hollow when not started. The connector above each node is solid
// behind completed work and dashed ahead of it, so how far along you are is
// visible without reading a single number.
const STATE_STYLE = {
  done: { label: 'Finished', bg: '#E4F6EC', fg: ll.greenDeep },
  started: { label: 'In progress', bg: ll.amberSoft, fg: ll.amberInk },
  new: { label: 'Ready', bg: ll.blueSoft, fg: ll.blueDeep },
  soon: { label: 'Coming soon', bg: ll.purpleTint, fg: ll.muted },
};

export default function SyllabusList({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { standardId, subjectId } = route.params;
  const std = standard(standardId);
  const sub = subject(subjectId);

  const topics = useMemo(() => topicsFor(standardId, subjectId), [standardId, subjectId]);
  const [progressById, setProgressById] = useState({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all(
        topics.filter((t) => t.playable).map((t) => loadProgress(t.id).then((p) => [t.id, p])),
      )
        .then((rows) => { if (!cancelled) setProgressById(Object.fromEntries(rows)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [topics]),
  );

  const rows = useMemo(() => decorate(topics, progressById), [topics, progressById]);
  const ready = rows.filter((r) => r.state !== 'soon');
  const soon = rows.filter((r) => r.state === 'soon');
  const doneCount = rows.filter((r) => r.done).length;
  const stars = rows.reduce((sum, r) => sum + r.stars, 0);

  // ---------------------------------------------------------------------
  // Unchanged navigation.
  function open(topic, fresh) {
    if (fresh) clearProgress(topic.id);
    const p = fresh ? null : topic.progress;
    // The bespoke games only need their own params; the shared quiz engine
    // also needs to know which topic and subject it is rendering, so it can
    // title itself and pick up the subject's colour.
    navigation.navigate(topic.playable, {
      startIndex: p?.index ?? 0,
      startStars: p?.stars ?? 0,
      topicId: topic.id,
      subjectId,
      standardId,
      title: topic.label,
    });
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;

  return (
    <LinearGradient colors={llGradients.home} locations={[0, 0.26, 0.55, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
          <Pill label={std.name.toUpperCase()} bg={std.soft} color={std.deep} spaced />
        </View>

        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.title}>{sub.name}</Text>
            <Text style={styles.body}>{sub.blurb}</Text>
          </View>
          <View style={[styles.headArtCast, { shadowColor: sub.deep }]}>
            <View style={[styles.headArt, { backgroundColor: sub.soft }]}>
              <Image source={sub.pose} style={styles.headArtImg} />
            </View>
          </View>
        </View>

        <View style={styles.summaryCast}>
          <LinearGradient colors={llSurface.white} style={[styles.summary, llRing.faint]}>
            <TopHighlight radius={llRadius.lg} />
            <Track
              value={ready.length ? doneCount / ready.length : 0}
              height={14}
              colors={[sub.tint, sub.deep]}
            />
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryText}>
                {doneCount} of {ready.length} finished
              </Text>
              <View style={styles.starChip}>
                <Image source={ICON.star} style={styles.starIcon} />
                <Text style={styles.starText}>{stars}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* THE PATH ------------------------------------------------------ */}
        <View style={styles.path}>
          {ready.map((t, i) => {
            const st = STATE_STYLE[t.state];
            const nodeTint = t.done ? ll.green : t.started ? ll.amber : withAlpha('#8B86B8', 0.3);
            return (
              <Pop key={t.id} delay={Math.min(i, 6) * 70}>
                <View style={styles.stop}>
                  {/* Trail: solid behind finished work, dashed ahead. */}
                  <View style={styles.rail} pointerEvents="none">
                    {i > 0 ? (
                      <View
                        style={[
                          styles.railUp,
                          ready[i - 1].done ? styles.railSolid : styles.railDashed,
                        ]}
                      />
                    ) : null}
                    <View style={[styles.node, { borderColor: nodeTint }, t.done && styles.nodeDone, t.started && styles.nodeStarted]}>
                      <Text style={[styles.nodeText, (t.done || t.started) && styles.nodeTextOn]}>
                        {t.done ? '✓' : i + 1}
                      </Text>
                    </View>
                    {i < ready.length - 1 ? (
                      <View style={[styles.railDown, t.done ? styles.railSolid : styles.railDashed]} />
                    ) : null}
                  </View>

                  <View style={[styles.cardCast, t.done && { shadowColor: ll.greenDeep, shadowOpacity: 0.2 }]}>
                    <LinearGradient
                      colors={t.done ? ['#FBFFFC', '#F0FAF4'] : llSurface.white}
                      style={[styles.card, llRing.faint, t.done && { borderColor: sub.tint, borderWidth: 2 }]}
                    >
                      <TopHighlight radius={llRadius.xxl} />

                      <View style={styles.cardTop}>
                        <View style={[styles.emojiWrap, { backgroundColor: sub.soft }]}>
                          <Text style={styles.emoji}>{t.emoji}</Text>
                        </View>
                        <View style={styles.cardBody}>
                          <Text style={styles.cardName} numberOfLines={2}>{t.label}</Text>
                          {t.description ? (
                            <Text style={styles.cardDesc} numberOfLines={2}>{t.description}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.state, { backgroundColor: st.bg }]}>
                          <Text style={[styles.stateText, { color: st.fg }]}>{st.label}</Text>
                        </View>
                      </View>

                      {t.started && (
                        <View style={styles.rowTrack}>
                          <Track value={t.ratio} height={10} colors={[ll.amberWarm, ll.pink]} />
                          <Text style={styles.rowTrackLabel}>
                            Round {Math.min(t.progress.index + 1, t.total)} of {t.total}
                          </Text>
                        </View>
                      )}

                      <View style={styles.actions}>
                        <LLButton
                          label={t.done ? 'Play again' : t.started ? 'Continue' : 'Start'}
                          tone={t.started ? 'pink' : sub.button}
                          size="sm"
                          full={false}
                          style={[styles.play, compact && { minWidth: 104 }]}
                          onPress={() => open(t, t.done)}
                        />
                        {t.started && (
                          <Pressable onPress={() => open(t, true)} style={styles.restart} accessibilityRole="button">
                            <Text style={styles.restartText}>Start over</Text>
                          </Pressable>
                        )}
                        {t.stars > 0 && (
                          <View style={styles.earned}>
                            <Image source={ICON.star} style={styles.starIcon} />
                            <Text style={styles.earnedText}>{t.stars}</Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              </Pop>
            );
          })}

          {/* The path visibly continues into what isn't built yet. */}
          {soon.length > 0 ? (
            <View style={styles.stop}>
              <View style={styles.rail} pointerEvents="none">
                <View style={[styles.railUp, styles.railDashed]} />
                <View style={[styles.node, styles.nodeSoon]}>
                  <Image source={ICON.lock} style={styles.nodeLock} />
                </View>
              </View>
              <View style={styles.soonBlock}>
                <Text style={styles.soonHead}>Still being built</Text>
                <SpeechRow face={sub.face} faceSize={46} tone={sub.soft} textColor={sub.deep}>
                  {`"These ${soon.length} are part of the ${sub.name} syllabus — the games for them aren't ready yet."`}
                </SpeechRow>
                <View style={styles.soonGrid}>
                  {soon.map((t) => (
                    <View key={t.id} style={styles.soonChip}>
                      <Text style={styles.soonEmoji}>{t.emoji}</Text>
                      <Text style={styles.soonLabel} numberOfLines={2}>{t.label}</Text>
                      <Image source={ICON.lock} style={styles.soonLock} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  headText: { flex: 1 },
  title: { ...llType.h2, color: ll.ink, letterSpacing: -0.3 },
  body: { ...llType.body, color: ll.soft },
  headArtCast: {
    borderRadius: llRadius.md,
    shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5,
  },
  headArt: { width: 66, height: 66, borderRadius: llRadius.md, overflow: 'hidden' },
  headArtImg: { width: '100%', height: '100%' },

  summaryCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 4,
  },
  summary: { borderRadius: llRadius.lg, padding: 14, gap: 7, overflow: 'hidden' },
  summaryMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: ll.body },
  starChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon: { width: 16, height: 16, borderRadius: 5 },
  starText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.ink },

  // The trail down the left edge.
  path: { gap: 12 },
  stop: { flexDirection: 'row', gap: 10 },
  rail: { width: 30, alignItems: 'center' },
  railUp: { position: 'absolute', top: -14, height: 26, width: 0 },
  railDown: { position: 'absolute', top: 30, bottom: -22, width: 0 },
  railSolid: { borderLeftWidth: 3, borderLeftColor: withAlpha(ll.green, 0.55) },
  // RN applies borderStyle to every edge, but only the left edge has width.
  railDashed: { borderLeftWidth: 3, borderStyle: 'dashed', borderLeftColor: withAlpha('#8B86B8', 0.35) },
  node: {
    width: 30, height: 30, borderRadius: 15, marginTop: 14,
    borderWidth: 3, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  nodeDone: { backgroundColor: ll.green, borderColor: ll.greenDeep },
  nodeStarted: {
    backgroundColor: ll.amber, borderColor: ll.amberInk,
    shadowColor: ll.amber, shadowOpacity: 0.6, shadowRadius: 10,
  },
  nodeSoon: { borderColor: withAlpha('#8B86B8', 0.35), borderStyle: 'dashed' },
  nodeText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: ll.muted },
  nodeTextOn: { color: ll.white },
  nodeLock: { width: 15, height: 15, borderRadius: 5, opacity: 0.7 },

  cardCast: {
    flex: 1, borderRadius: llRadius.xxl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 }, elevation: 6,
  },
  card: {
    borderRadius: llRadius.xxl, padding: 14, gap: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: 'transparent',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  emojiWrap: { width: 52, height: 52, borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, lineHeight: 21, color: ll.ink },
  cardDesc: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, lineHeight: 15.5, color: ll.body },
  state: { borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 },
  stateText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5 },

  rowTrack: { gap: 4 },
  rowTrackLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10.5, color: ll.muted },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  play: { minWidth: 118 },
  restart: { paddingVertical: 6 },
  restartText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.muted, textDecorationLine: 'underline' },
  earned: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  earnedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.ink },

  soonBlock: { flex: 1, gap: 10, marginTop: 10 },
  soonHead: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.ink },
  soonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  soonChip: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: llRadius.md, padding: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  soonEmoji: { fontSize: 18, opacity: 0.75 },
  soonLabel: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 11, lineHeight: 14.5, color: ll.muted },
  soonLock: { width: 16, height: 16, borderRadius: 5, opacity: 0.6 },
});
