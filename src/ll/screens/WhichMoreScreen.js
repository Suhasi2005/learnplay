import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/whichMoreData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Which Has More?" — Pre-Number Concepts (Grade 1).
// Compare groups (more/fewer), sizes (tallest/shortest/biggest), and match
// a group with the same number.
function Group({ emoji, count, size = 22 }) {
  return (
    <View style={styles.group}>
      {Array.from({ length: count }, (_, i) => <Text key={i} style={{ fontSize: size, lineHeight: size + 6 }}>{emoji}</Text>)}
    </View>
  );
}

function promptFor(round) {
  if (round.kind === 'compare') return `Which has ${round.ask}?`;
  if (round.kind === 'size') return `Which is the ${round.ask}?`;
  return 'Which group has the same number?';
}

export default function WhichMoreScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-prenum', subjectId: 'Math', standardId: 'Grade 1', title: 'Pre-Number Concepts' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const prompt = promptFor(round);

  useEffect(() => { flow.say(prompt); }, [flow.index]);

  function pick(option) {
    if (option.id === round.answerId) {
      if (round.kind === 'compare') flow.succeed(`Yes! ${option.count} is ${round.ask} than the other group.`);
      else if (round.kind === 'size') flow.succeed(`Yes! That one is the ${round.ask}.`);
      else flow.succeed(`Yes! Both groups have ${round.n}.`);
    } else if (round.kind === 'size') {
      flow.missOn(option.id, `Look again. Which one is the ${round.ask}?`);
    } else {
      flow.missOn(option.id, `That group has ${option.count}. Count again!`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {round.kind === 'same' ? (
        <View style={styles.target}>
          <Text style={styles.targetLabel}>Match this group</Text>
          <Group emoji={round.emoji} count={round.n} size={26} />
        </View>
      ) : null}

      <View style={styles.options}>
        {round.options.map((option) => (
          <Choice
            key={option.id}
            flow={flow}
            id={option.id}
            isAnswer={option.id === round.answerId}
            onPress={() => pick(option)}
            style={[styles.card, round.kind === 'compare' && styles.cardWide, round.kind === 'size' && styles.cardTall]}
            accessibilityLabel={round.kind === 'size' ? 'picture' : `group of ${option.count}`}
          >
            {round.kind === 'size'
              ? <Text style={{ fontSize: 84 * option.scale }}>{round.emoji}</Text>
              : <Group emoji={round.emoji} count={option.count} />}
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  target: { alignItems: 'center', backgroundColor: ll.blueTint, borderRadius: llRadius.xl, padding: 14, marginBottom: 20, ...llShadow.soft },
  targetLabel: { ...llType.tiny, color: ll.blueInk, marginBottom: 6 },
  group: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 104 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 12 },
  card: { width: 110, minHeight: 110 },
  cardWide: { width: 140, minHeight: 150 },
  cardTall: { height: 150, justifyContent: 'flex-end' },
});
