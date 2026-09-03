import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { ALPHABET, buildRound } from '../gameData';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

export default function AlphabetGameScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const round = useMemo(() => buildRound(index), [index]);
  const shake = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Speech.stop();
    Speech.speak(`Find the picture that starts with ${round.letter}`, { rate: 0.95, pitch: 1.15 });
  }, [index]);

  function triggerShake() {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function triggerPop() {
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  }

  function handleAnswer(option) {
    if (showCelebration) return;

    if (option.letter === round.letter) {
      setStars((s) => s + 1);
      setShowCelebration(true);
      triggerPop();
      Speech.stop();
      Speech.speak(`Yes! ${round.letter} is for ${round.word}!`, { rate: 0.95, pitch: 1.15 });

      setTimeout(() => {
        setShowCelebration(false);
        if (index + 1 < ALPHABET.length) {
          setIndex((i) => i + 1);
        } else {
          navigation.replace('Completion', { stars: stars + 1 });
        }
      }, 1400);
    } else {
      setWrongId(option.letter);
      triggerShake();
      Speech.stop();
      Speech.speak('Try again!', { rate: 0.95, pitch: 1.15 });
      setTimeout(() => setWrongId(null), 400);
    }
  }

  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] });
  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });

  return (
    <View style={styles.container}>
      <BackButton onPress={() => { Speech.stop(); navigation.navigate('Welcome'); }} />
      <View style={styles.progressRow}>
        {ALPHABET.map((item, i) => (
          <View
            key={item.letter}
            style={[
              styles.dot,
              i < index && styles.dotDone,
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.letterBox}>
        <Text style={styles.letterBig}>{round.letter}</Text>
        <Text style={styles.letterSmall}>{round.letter.toLowerCase()}</Text>
      </View>
      <Text style={styles.prompt}>Tap the picture that starts with "{round.letter}"</Text>

      <View style={styles.grid}>
        {round.options.map((option, i) => {
          const palette = cardPalette[i % cardPalette.length];
          const isWrong = wrongId === option.letter;
          return (
            <Animated.View
              key={option.letter}
              style={isWrong ? { transform: [{ translateX: shakeTranslate }] } : undefined}
            >
              <BouncyButton
                style={[styles.option, { backgroundColor: palette.bg }]}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              </BouncyButton>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.starsRow}>
        <Text style={styles.starsText}>⭐ {stars}</Text>
      </View>

      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: popScale }] }]}>
            {round.emoji}
          </Animated.Text>
          <Text style={styles.celebrationText}>{round.letter} is for {round.word}!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.md, alignItems: 'center' },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: spacing.sm, maxWidth: 320 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E4DED6' },
  dotDone: { backgroundColor: colors.grassDeep },
  dotActive: { backgroundColor: colors.sunDeep, width: 10, height: 10, borderRadius: 5 },
  letterBox: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.lg },
  letterBig: { fontFamily: fonts.displayBold, fontSize: 90, color: colors.grapeDeep, lineHeight: 92 },
  letterSmall: { fontFamily: fonts.displayBold, fontSize: 56, color: colors.grape, lineHeight: 64 },
  prompt: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, maxWidth: 340 },
  option: {
    width: 130, height: 130, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  optionEmoji: { fontSize: 64 },
  starsRow: { marginTop: spacing.lg },
  starsText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.sunDeep },
  celebrationOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  celebrationEmoji: { fontSize: 110 },
  celebrationText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.grassDeep, marginTop: spacing.sm },
});
