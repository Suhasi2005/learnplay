import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { FACE, ICON, POSE, SCENE } from '../art';
import { Hearts, IconButton, LLButton, Pill, Pop, Rise, StarChip, Track } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import { LETTERS, MAX_HEARTS, buildRound } from '../quiz/engine';
import { quizFor } from '../quiz/content';
import { subject } from '../syllabus';
import { ll, llGradients, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';
import GameObject from '../objects';

// The quiz round.
//
// Progress bar and hearts up top, the question on a white card, lettered
// choices, and Buddy's hint available on demand rather than pushed at you.
//
// The important rule this screen keeps is the one Buddy promises during
// onboarding: a wrong answer is never a failure. It opens a friendly sheet
// with the hint and two ways forward — try again, or be shown. Hearts go
// down but running out costs nothing; it just means the answer is revealed.
//
// The premium pass targets the two moments that carry that promise:
//
//  - Choices are physical keys. Each has a lettered cap, a gradient face and
//    a bottom edge that depresses on press. A quiz whose options are flat
//    rows reads as a worksheet; keys read as something to play.
//  - Birdie reacts. The face beside the question changes with the phase —
//    happy while asking, excited on a right answer, thinking during the
//    retry sheet — so the character is answering with the child rather than
//    watching them.
export default function QuizScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    topicId,
    subjectId = 'EVS',
    title = 'Quiz',
    startIndex = 0,
    startStars = 0,
  } = route.params ?? {};

  const questions = useMemo(() => quizFor(topicId) ?? [], [topicId]);
  const sub = subject(subjectId);

  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, questions.length - 1)));
  const [stars, setStars] = useState(startStars);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [picked, setPicked] = useState(null);
  const [phase, setPhase] = useState('asking'); // asking | correct | wrong | revealed
  const [hintOpen, setHintOpen] = useState(false);

  const round = useMemo(() => (questions[index] ? buildRound(questions[index]) : null), [questions, index]);
  const confetti = useRef(null);
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const { speak, playSuccess, playWrong, playComplete } = useSound();

  const isLast = index >= questions.length - 1;

  useEffect(() => {
    if (round) speak(round.prompt, { rate: 0.95, pitch: 1.12 });
    setPicked(null);
    setPhase('asking');
    setHintOpen(false);
    glow.setValue(0);
  }, [index, round?.prompt]);

  // ---------------------------------------------------------------------
  // Unchanged answer logic.
  const answer = useCallback((choiceIndex) => {
    if (phase !== 'asking' || !round) return;
    setPicked(choiceIndex);

    if (choiceIndex === round.answerIndex) {
      const next = stars + 1;
      setStars(next);
      setPhase('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSuccess();
      confetti.current?.start();
      speak('That is right!', { rate: 0.95, pitch: 1.2 });
      saveProgress(topicId, index + 1, next);
      Animated.spring(glow, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }).start();
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setPhase('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      playWrong();
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [phase, round, stars, index, topicId, speak, playSuccess, playWrong, shake]);

  function next() {
    if (isLast) {
      clearProgress(topicId);
      playComplete();
      navigation.replace('LLReward', {
        topicId, subjectId, title,
        stars, total: questions.length,
      });
      return;
    }
    setIndex((i) => i + 1);
  }
  // ---------------------------------------------------------------------

  if (!round) {
    return (
      <LinearGradient colors={llGradients.game} style={styles.fill}>
        <View style={styles.empty}>
          <Image source={POSE.buddyThink} style={styles.emptyArt} />
          <Text style={styles.emptyTitle}>No questions yet</Text>
          <Text style={styles.emptyBody}>This topic is still being built.</Text>
          <LLButton label="Go back" tone="blue" full={false} onPress={() => navigation.goBack()} />
        </View>
      </LinearGradient>
    );
  }

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const compact = width < 360;

  // Birdie answers along with the child. (There's no thinking face in the
  // set, so a wrong answer keeps the happy one — which is also the right
  // call: the character should never look disappointed.)
  const face = phase === 'correct' ? FACE.birdieExcited : FACE.birdieHappy;

  return (
    <LinearGradient colors={llGradients.game} locations={[0, 0.52, 1]} style={styles.fill}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <IconButton icon={ICON.back} label="Back" size={40} onPress={() => navigation.goBack()} />
          <View style={styles.topTrack}>
            <Track
              value={questions.length ? index / questions.length : 0}
              height={16}
              colors={[ll.amberWarm, ll.pink]}
              bg="rgba(255,255,255,0.9)"
            />
          </View>
          <Hearts total={MAX_HEARTS} left={hearts} />
        </View>

        <View style={styles.metaRow}>
          <Pill label={`${index + 1} of ${questions.length}`} bg={ll.white} color={ll.blueDeep} />
          <Pill label={title} bg={sub.soft} color={sub.deep} />
          <View style={{ flex: 1 }} />
          <StarChip count={stars} />
        </View>

        {/* THE QUESTION ------------------------------------------------- */}
        <Animated.View style={[styles.cardCast, { transform: [{ translateX }] }]}>
          <LinearGradient colors={llSurface.white} style={[styles.card, llRing.faint]}>
            <TopHighlight radius={llRadius.xxl} />

            <View style={styles.qRow}>
              <View style={styles.qFaceRing}>
                <Image source={face} style={styles.qFace} />
              </View>
              <Text style={[styles.prompt, compact && { fontSize: 20, lineHeight: 25 }]}>{round.prompt}</Text>
            </View>

            {round.show ? (
              <LinearGradient colors={['#FFFBF0', '#FFF1D6']} style={[styles.showBox, llRing.light]}>
                <Sheen variant="trough" radius={llRadius.lg} />
                <Text style={styles.showText}>{round.show}</Text>
              </LinearGradient>
            ) : null}

            <View style={styles.choices}>
              {round.choices.map((c, i) => {
                const isAnswer = i === round.answerIndex;
                const isPicked = picked === i;
                const reveal = phase === 'correct' || phase === 'revealed';
                const good = reveal && isAnswer;
                const bad = phase === 'wrong' && isPicked;
                const spent = phase !== 'asking' && !good && !bad;

                return (
                  <Pressable
                    key={`${c.label}-${i}`}
                    onPress={() => answer(i)}
                    disabled={phase !== 'asking'}
                    accessibilityRole="button"
                    accessibilityLabel={c.label}
                    style={({ pressed }) => [
                      styles.choiceCast,
                      good && styles.choiceCastGood,
                      bad && styles.choiceCastBad,
                      spent && styles.choiceCastSpent,
                      pressed && phase === 'asking' && styles.choicePressed,
                    ]}
                  >
                    <LinearGradient
                      colors={good ? ['#F1FBF5', '#DFF3E8'] : bad ? ['#FFF3F7', '#FFE4EE'] : ['#F9F7FF', '#F1ECFC']}
                      style={[
                        styles.choice,
                        good && styles.choiceGood,
                        bad && styles.choiceBad,
                      ]}
                    >
                      <TopHighlight radius={llRadius.lg} />

                      {/* Lettered key cap. */}
                      <LinearGradient
                        colors={good ? [ll.greenLight, ll.greenDeep] : bad ? [ll.pinkLight, ll.pink] : ['#FFFFFF', '#F2EDFC']}
                        style={[styles.key, (good || bad) && styles.keyOn]}
                      >
                        <Text style={[styles.keyText, (good || bad) && { color: ll.white }]}>{LETTERS[i]}</Text>
                      </LinearGradient>

                      {c.emoji ? <GameObject id={c.id} emoji={c.emoji} size={40} accessibilityLabel={c.label} /> : null}
                      <Text
                        style={[styles.choiceLabel, good && { color: ll.greenDeep }, bad && { color: ll.pinkDeep }]}
                        numberOfLines={2}
                      >
                        {c.label}
                      </Text>
                      {good ? <Text style={styles.tick}>✓</Text> : null}
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          </LinearGradient>
        </Animated.View>

        {round.hint && phase === 'asking' && (
          <Pressable
            style={({ pressed }) => [styles.hintBtnCast, pressed && { transform: [{ translateY: 2 }] }]}
            onPress={() => setHintOpen((v) => !v)}
            accessibilityRole="button"
          >
            <LinearGradient colors={llSurface.chrome} style={[styles.hintBtn, llRing.faint]}>
              <TopHighlight radius={llRadius.lg} />
              <Image source={ICON.hint} style={styles.hintIcon} />
              <Text style={styles.hintLabel}>
                {hintOpen ? 'Hide Buddy’s hint' : 'Ask Buddy for a hint'}
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        {hintOpen && phase === 'asking' && (
          <Rise style={styles.hintRow}>
            <Image source={POSE.buddyFloat} style={styles.hintBuddy} />
            <View style={styles.hintBubbleCast}>
              <LinearGradient colors={['#F3F8FF', '#E6EFFF']} style={[styles.hintBubble, llRing.light]}>
                <TopHighlight radius={20} />
                <Text style={styles.hintEyebrow}>BUDDY'S HINT</Text>
                <Text style={styles.hintText}>{round.hint}</Text>
              </LinearGradient>
              <View style={styles.hintTail} pointerEvents="none" />
            </View>
          </Rise>
        )}

        {(phase === 'correct' || phase === 'revealed') && (
          <Pop style={styles.nextWrap}>
            <LLButton
              label={isLast ? 'Finish' : 'Next question'}
              tone={phase === 'correct' ? 'green' : 'blue'}
              shine={phase === 'correct'}
              onPress={next}
            />
          </Pop>
        )}
      </ScrollView>

      {/* Gentle retry. Never a failure state — two ways forward, always. */}
      {phase === 'wrong' && (
        <Rise style={[styles.sheetWrap, { paddingBottom: insets.bottom + 22 }]} distance={30}>
          <LinearGradient colors={['#FFFFFF', '#FFF9FC']} style={styles.sheet}>
            {/* Grab handle: the sheet reads as something that arrived. */}
            <View style={styles.grabber} pointerEvents="none" />

            <View style={styles.sheetTop}>
              <Image source={SCENE.buddyHint} style={styles.sheetArt} />
              <View style={styles.sheetText}>
                <Text style={styles.sheetTitle}>Almost there!</Text>
                <Text style={styles.sheetBody}>
                  Good try. Have another look — Buddy will help.
                </Text>
              </View>
            </View>

            {round.hint ? (
              <LinearGradient colors={['#F3F8FF', '#E6EFFF']} style={[styles.sheetHint, llRing.light]}>
                <Text style={styles.hintEyebrow}>BUDDY'S HINT</Text>
                <Text style={styles.hintText}>{round.hint}</Text>
              </LinearGradient>
            ) : null}

            <View style={styles.sheetActions}>
              <LLButton
                label="Try again"
                tone="pink"
                full={false}
                style={styles.sheetBtn}
                onPress={() => { setPhase('asking'); setPicked(null); }}
              />
              <Pressable
                onPress={() => { setPhase('revealed'); setHintOpen(false); }}
                style={({ pressed }) => [styles.showMe, pressed && { transform: [{ translateY: 2 }] }]}
                accessibilityRole="button"
              >
                <Text style={styles.showMeText}>Show me</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Rise>
      )}

      <ConfettiCannon ref={confetti} count={45} origin={{ x: width / 2, y: 0 }} autoStart={false} fadeOut fallSpeed={2600} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTrack: { flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  cardCast: {
    borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.2, shadowRadius: 30,
    shadowOffset: { width: 0, height: 15 }, elevation: 9,
  },
  card: { borderRadius: llRadius.xxl, padding: 18, gap: 14, overflow: 'hidden' },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qFaceRing: {
    width: 56, height: 56, borderRadius: 28, padding: 2, flexShrink: 0,
    backgroundColor: withAlpha(ll.amber, 0.22),
  },
  qFace: { width: '100%', height: '100%', borderRadius: 26 },
  prompt: { flex: 1, ...llType.h4, color: ll.ink },

  showBox: {
    borderRadius: llRadius.lg, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  showText: { fontSize: 44, letterSpacing: 4 },

  choices: { gap: 10 },
  choiceCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 }, elevation: 4,
  },
  choiceCastGood: { shadowColor: ll.greenDeep, shadowOpacity: 0.34, shadowRadius: 20 },
  choiceCastBad: { shadowColor: ll.pink, shadowOpacity: 0.3, shadowRadius: 18 },
  choiceCastSpent: { shadowOpacity: 0.07 },
  choicePressed: { transform: [{ translateY: 2 }, { scale: 0.99 }] },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: llRadius.lg, paddingVertical: 14, paddingHorizontal: 15,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
    borderBottomWidth: 4, borderBottomColor: withAlpha('#6054BE', 0.16),
  },
  choiceGood: { borderColor: ll.green, borderBottomColor: ll.greenDeep },
  choiceBad: { borderColor: ll.pink, borderBottomColor: ll.pinkDeep },
  key: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 2, borderBottomColor: withAlpha('#6054BE', 0.18),
  },
  keyOn: { borderBottomColor: 'rgba(20,10,60,0.22)' },
  keyText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.purpleDeep },
  choiceLabel: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.ink },
  tick: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: ll.greenDeep },

  hintBtnCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.13, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: llRadius.lg, padding: 13, overflow: 'hidden',
  },
  hintIcon: { width: 32, height: 32, borderRadius: 11 },
  hintLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.ink },

  hintRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 11 },
  hintBuddy: { width: 64, height: 64, borderRadius: 22, flexShrink: 0 },
  hintBubbleCast: {
    flex: 1,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  hintBubble: {
    borderRadius: 20, borderBottomLeftRadius: 6, padding: 13, overflow: 'hidden',
  },
  hintTail: {
    position: 'absolute', left: -4, bottom: 8, width: 10, height: 10,
    backgroundColor: '#E6EFFF', transform: [{ rotate: '45deg' }],
  },
  hintEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5, letterSpacing: 1, color: '#7B9BD8' },
  hintText: { fontFamily: 'Nunito_700Bold', fontSize: 13, lineHeight: 18.5, color: ll.blueInk, marginTop: 3 },

  nextWrap: { marginTop: 2 },

  sheetWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    shadowColor: '#6054BE', shadowOpacity: 0.26, shadowRadius: 44,
    shadowOffset: { width: 0, height: -18 }, elevation: 16,
  },
  sheet: {
    borderTopLeftRadius: llRadius.sheet, borderTopRightRadius: llRadius.sheet,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22, gap: 13,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.9)',
  },
  grabber: {
    alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 8,
    backgroundColor: withAlpha('#8B86B8', 0.3),
  },
  sheetTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  sheetArt: { width: 88, height: 88, borderRadius: 26, flexShrink: 0 },
  sheetText: { flex: 1 },
  sheetTitle: { ...llType.h4, color: ll.ink },
  sheetBody: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, lineHeight: 17.5, color: ll.body, marginTop: 4 },
  sheetHint: { borderRadius: llRadius.md, padding: 13, overflow: 'hidden' },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sheetBtn: { flex: 1 },
  showMe: {
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: llRadius.lg,
    backgroundColor: ll.purpleTint,
    borderBottomWidth: 3, borderBottomColor: withAlpha(ll.purpleDeep, 0.25),
  },
  showMeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: ll.purpleDeep },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  emptyArt: { width: 120, height: 120, borderRadius: 34 },
  emptyTitle: { ...llType.h3, color: ll.ink },
  emptyBody: { ...llType.body, color: ll.soft, textAlign: 'center' },
});
