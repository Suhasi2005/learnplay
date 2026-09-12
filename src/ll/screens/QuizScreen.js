import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { FACE, ICON, POSE, SCENE } from '../art';
import { Hearts, IconButton, LLButton, Pill, Pop, Rise, StarRow, Track } from '../kit';
import { LETTERS, MAX_HEARTS, buildRound } from '../quiz/engine';
import { quizFor } from '../quiz/content';
import { subject } from '../syllabus';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';
import { useSound } from '../../context/SoundContext';
import { clearProgress, saveProgress } from '../../storage';

// The quiz round.
//
// Rebuilt from the Little Learners game screen: progress bar and hearts up
// top, the question on a white card, lettered choices, and Buddy's hint
// available on demand rather than pushed at you.
//
// The important rule this screen keeps is the one Buddy promises during
// onboarding: a wrong answer is never a failure. It opens a friendly sheet
// with the hint and two ways forward — try again, or be shown. Hearts go down
// but running out costs nothing; it just means the answer is revealed.

export default function QuizScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
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
  const { speak, playSuccess, playWrong, playComplete } = useSound();

  const isLast = index >= questions.length - 1;

  useEffect(() => {
    if (round) speak(round.prompt, { rate: 0.95, pitch: 1.12 });
    setPicked(null);
    setPhase('asking');
    setHintOpen(false);
  }, [index, round?.prompt]);

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
          <View style={styles.starChip}>
            <Image source={ICON.star} style={styles.starIcon} />
            <Text style={styles.starText}>{stars}</Text>
          </View>
        </View>

        <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
          <View style={styles.qRow}>
            <Image source={FACE.birdieHappy} style={styles.qFace} />
            <Text style={styles.prompt}>{round.prompt}</Text>
          </View>

          {round.show ? (
            <View style={styles.showBox}>
              <Text style={styles.showText}>{round.show}</Text>
            </View>
          ) : null}

          <View style={styles.choices}>
            {round.choices.map((c, i) => {
              const isAnswer = i === round.answerIndex;
              const isPicked = picked === i;
              const reveal = phase === 'correct' || phase === 'revealed';
              const good = reveal && isAnswer;
              const bad = phase === 'wrong' && isPicked;

              return (
                <Pressable
                  key={`${c.label}-${i}`}
                  onPress={() => answer(i)}
                  disabled={phase !== 'asking'}
                  accessibilityRole="button"
                  accessibilityLabel={c.label}
                  style={({ pressed }) => [
                    styles.choice,
                    good && styles.choiceGood,
                    bad && styles.choiceBad,
                    pressed && phase === 'asking' && styles.choicePressed,
                  ]}
                >
                  <View style={[styles.key, good && styles.keyGood, bad && styles.keyBad]}>
                    <Text style={[styles.keyText, (good || bad) && { color: ll.white }]}>{LETTERS[i]}</Text>
                  </View>
                  {c.emoji ? <Text style={styles.choiceEmoji}>{c.emoji}</Text> : null}
                  <Text style={[styles.choiceLabel, good && { color: ll.greenDeep }]} numberOfLines={2}>
                    {c.label}
                  </Text>
                  {good ? <Text style={styles.tick}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {round.hint && phase === 'asking' && (
          <Pressable style={styles.hintBtn} onPress={() => setHintOpen((v) => !v)} accessibilityRole="button">
            <Image source={ICON.hint} style={styles.hintIcon} />
            <Text style={styles.hintLabel}>
              {hintOpen ? 'Hide Buddy’s hint' : 'Ask Buddy for a hint'}
            </Text>
          </Pressable>
        )}

        {hintOpen && phase === 'asking' && (
          <Rise style={styles.hintRow}>
            <Image source={POSE.buddyFloat} style={styles.hintBuddy} />
            <View style={styles.hintBubble}>
              <Text style={styles.hintEyebrow}>BUDDY'S HINT</Text>
              <Text style={styles.hintText}>{round.hint}</Text>
            </View>
          </Rise>
        )}

        {(phase === 'correct' || phase === 'revealed') && (
          <Pop style={styles.nextWrap}>
            <LLButton
              label={isLast ? 'Finish' : 'Next question'}
              tone={phase === 'correct' ? 'green' : 'blue'}
              onPress={next}
            />
          </Pop>
        )}
      </ScrollView>

      {/* Gentle retry. Never a failure state — two ways forward, always. */}
      {phase === 'wrong' && (
        <Rise style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]} distance={30}>
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
            <View style={styles.sheetHint}>
              <Text style={styles.hintEyebrow}>BUDDY'S HINT</Text>
              <Text style={styles.hintText}>{round.hint}</Text>
            </View>
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
              style={styles.showMe}
              accessibilityRole="button"
            >
              <Text style={styles.showMeText}>Show me</Text>
            </Pressable>
          </View>
        </Rise>
      )}

      {phase === 'correct' && (
        <View style={styles.praise} pointerEvents="none">
          <StarRow count={1} size={0} animate={false} />
        </View>
      )}

      <ConfettiCannon ref={confetti} count={45} origin={{ x: 200, y: 0 }} autoStart={false} fadeOut fallSpeed={2600} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 18, gap: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTrack: { flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon: { width: 18, height: 18, borderRadius: 6 },
  starText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.ink },

  card: { backgroundColor: ll.white, borderRadius: llRadius.xxl, padding: 18, gap: 14, ...llShadow.card },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  qFace: { width: 54, height: 54, borderRadius: 27, flexShrink: 0 },
  prompt: { flex: 1, ...llType.h4, color: ll.ink },

  showBox: {
    borderRadius: llRadius.lg, backgroundColor: ll.amberSoft,
    paddingVertical: 18, alignItems: 'center', justifyContent: 'center',
  },
  showText: { fontSize: 44, letterSpacing: 4 },

  choices: { gap: 10 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ll.purpleTint, borderRadius: llRadius.lg,
    paddingVertical: 14, paddingHorizontal: 15,
    borderWidth: 2, borderColor: 'transparent',
  },
  choicePressed: { transform: [{ scale: 0.985 }] },
  choiceGood: { backgroundColor: '#E4F6EC', borderColor: ll.green },
  choiceBad: { backgroundColor: ll.pinkTint, borderColor: ll.pink },
  key: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: ll.white,
    alignItems: 'center', justifyContent: 'center',
  },
  keyGood: { backgroundColor: ll.green },
  keyBad: { backgroundColor: ll.pink },
  keyText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.purpleDeep },
  choiceEmoji: { fontSize: 26 },
  choiceLabel: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.ink },
  tick: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: ll.greenDeep },

  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ll.white, borderRadius: llRadius.lg, padding: 13, ...llShadow.soft,
  },
  hintIcon: { width: 32, height: 32, borderRadius: 11 },
  hintLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.ink },

  hintRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 11 },
  hintBuddy: { width: 64, height: 64, borderRadius: 22, flexShrink: 0 },
  hintBubble: { flex: 1, backgroundColor: ll.blueTint, borderRadius: 20, borderBottomLeftRadius: 6, padding: 13 },
  hintEyebrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9.5, letterSpacing: 1, color: '#7B9BD8' },
  hintText: { fontFamily: 'Nunito_700Bold', fontSize: 13, lineHeight: 18.5, color: ll.blueInk, marginTop: 3 },

  nextWrap: { marginTop: 2 },

  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: ll.white,
    borderTopLeftRadius: llRadius.sheet, borderTopRightRadius: llRadius.sheet,
    paddingHorizontal: 20, paddingTop: 22, gap: 13, ...llShadow.sheet,
  },
  sheetTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  sheetArt: { width: 88, height: 88, borderRadius: 26, flexShrink: 0 },
  sheetText: { flex: 1 },
  sheetTitle: { ...llType.h4, color: ll.ink },
  sheetBody: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, lineHeight: 17.5, color: ll.body, marginTop: 4 },
  sheetHint: { backgroundColor: ll.blueTint, borderRadius: llRadius.md, padding: 13 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sheetBtn: { flex: 1 },
  showMe: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: llRadius.lg, backgroundColor: ll.purpleTint },
  showMeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: ll.purpleDeep },

  praise: { position: 'absolute', top: 0 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  emptyArt: { width: 120, height: 120, borderRadius: 34 },
  emptyTitle: { ...llType.h3, color: ll.ink },
  emptyBody: { ...llType.body, color: ll.soft, textAlign: 'center' },
});
