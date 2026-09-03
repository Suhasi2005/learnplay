import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import GameButton from '../components/GameButton';
import SceneBackground from '../components/SceneBackground';
import { shuffle } from '../utils';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

// Parental gate.
//
// A two-digit multiplication is past a Junior KG / Grade 1 child by design —
// this app's own maths games top out at adding single digits and counting in
// twos, so the gate sits deliberately outside everything it teaches. It
// guards settings and progress-reset, not anything sensitive, so the bar is
// "a young child can't pass it by accident", not real security.

function buildChallenge() {
  const a = 6 + Math.floor(Math.random() * 7); // 6..12
  const b = 5 + Math.floor(Math.random() * 8); // 5..12
  const answer = a * b;

  // Distractors near the answer so it can't be solved by picking the biggest
  // or smallest number on screen.
  const options = new Set([answer]);
  while (options.size < 4) {
    const delta = (1 + Math.floor(Math.random() * 12)) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    if (candidate > 0) options.add(candidate);
  }
  return { a, b, answer, options: shuffle([...options]) };
}

export default function ParentGateScreen({ navigation }) {
  const [challenge, setChallenge] = useState(() => buildChallenge());
  const [wrong, setWrong] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const prompt = useMemo(() => `${challenge.a} × ${challenge.b}`, [challenge]);

  function handleAnswer(value) {
    if (value === challenge.answer) {
      navigation.replace('ParentArea');
      return;
    }
    setWrong(true);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      // New question each failure, so repeated guessing can't converge.
      setChallenge(buildChallenge());
      setWrong(false);
    });
  }

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] });

  return (
    <SceneBackground>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Animated.View style={[styles.card, { transform: [{ translateX }] }]}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.title}>Grown-Ups Only</Text>
          <Text style={styles.body}>Solve this to continue.</Text>

          <Text style={styles.problem}>{prompt}</Text>

          <View style={styles.options}>
            {challenge.options.map((value) => (
              <Pressable
                key={value}
                style={[styles.option, wrong && styles.optionMuted]}
                onPress={() => handleAnswer(value)}
                accessibilityRole="button"
                accessibilityLabel={String(value)}
              >
                <Text style={styles.optionText}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <GameButton
          label="Back to the games"
          variant="soft"
          size="sm"
          onPress={() => navigation.goBack()}
          style={styles.back}
        />
      </View>
    </SceneBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', alignSelf: 'stretch', ...shadow.lg,
  },
  lock: { fontSize: 34 },
  title: { ...type.title, color: colors.ink, marginTop: spacing.xs },
  body: { ...type.body, color: colors.muted, marginBottom: spacing.md },
  problem: { fontFamily: fonts.displayBold, fontSize: 46, color: colors.grapeDeep, marginBottom: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  option: {
    minWidth: 82, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.grapeSoft, alignItems: 'center',
  },
  optionMuted: { opacity: 0.5 },
  optionText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  back: { marginTop: spacing.lg },
});
