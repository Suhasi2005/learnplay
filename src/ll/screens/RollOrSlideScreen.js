import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/rollSlideData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius } from '../tokens';

// "Roll or Slide?" — What is Long? What is Round? (Grade 1).
// Decide whether an object rolls or slides, or is long or round; a right
// answer is acted out on the ramp.
export default function RollOrSlideScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-shapes', subjectId: 'Math', standardId: 'Grade 1', title: 'What is Long? What is Round?' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const go = useRef(new Animated.Value(0)).current;

  const prompt = round.kind === 'move' ? `Will the ${round.label} roll or slide?` : `Is the ${round.label} long or round?`;

  useEffect(() => {
    go.setValue(0);
    flow.say(prompt);
  }, [flow.index]);

  function pick(option) {
    if (option.id === round.answer) {
      Animated.timing(go, { toValue: 1, duration: 1000, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
      flow.succeed(round.kind === 'move' ? `Yes! A ${round.label} ${round.answer}.` : `Yes! A ${round.label} is ${round.answer}.`, { hold: 1500 });
    } else {
      flow.missOn(option.id, round.kind === 'move'
        ? `Think: does a ${round.label} have a curved side or a flat side?`
        : `Look at the ${round.label}'s shape again.`);
    }
  }

  const rolls = round.answer === 'rolls' || round.answer === 'round';
  const transform = [
    { translateX: go.interpolate({ inputRange: [0, 1], outputRange: [0, 190] }) },
    { translateY: go.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
    { rotate: go.interpolate({ inputRange: [0, 1], outputRange: ['0deg', rolls ? '720deg' : '12deg'] }) },
  ];

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      <View style={styles.stage}>
        <Animated.Text style={[styles.object, { transform }]}>{round.emoji}</Animated.Text>
        <View style={styles.ramp} />
      </View>

      <View style={styles.options}>
        {round.options.map((option) => (
          <Choice key={option.id} flow={flow} id={option.id} isAnswer={option.id === round.answer} onPress={() => pick(option)} style={styles.option} accessibilityLabel={option.label}>
            <Text style={choiceText.emoji}>{option.emoji}</Text>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { width: 300, height: 190, justifyContent: 'flex-end', overflow: 'hidden' },
  object: { position: 'absolute', left: 24, top: 36, fontSize: 60 },
  ramp: {
    height: 16, width: 340, marginLeft: -10, marginBottom: 40, borderRadius: 8, backgroundColor: '#CDAE86',
    transform: [{ rotate: '12deg' }],
  },
  options: { flexDirection: 'row', gap: 16, marginTop: 20 },
  option: { width: 130, height: 120, borderRadius: llRadius.xl },
  optionLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.ink },
});
