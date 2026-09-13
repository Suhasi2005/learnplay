import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/numberFishingData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Number Fishing" — Numbers 1 to 9 (Grade 1).
// Catch the fish whose number matches: a counted group, a number word, one
// more, or one less.
function promptFor(r) {
  if (r.kind === 'count') return 'Catch the number that shows how many';
  if (r.kind === 'word') return `Catch the fish for "${r.word}"`;
  if (r.kind === 'more') return `Catch one more than ${r.n}`;
  return `Catch one less than ${r.n}`;
}

export default function NumberFishingScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-num1to9', subjectId: 'Math', standardId: 'Grade 1', title: 'Numbers 1 to 9' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [caught, setCaught] = useState(null);
  const prompt = promptFor(round);

  useEffect(() => {
    setCaught(null);
    flow.say(round.kind === 'count' ? 'How many shells? Catch that number.' : prompt);
  }, [flow.index]);

  function pick(fish) {
    if (caught) return;
    if (fish.number === round.answer) {
      setCaught(fish.id);
      flow.succeed(`You caught ${round.answer}!`);
    } else if (round.kind === 'count') {
      flow.missOn(fish.id, `That fish is ${fish.number}. Count the shells again.`);
    } else if (round.kind === 'word') {
      flow.missOn(fish.id, `That fish is ${fish.number}. Find ${round.word}.`);
    } else {
      flow.missOn(fish.id, `${fish.number} is not one ${round.kind} than ${round.n}.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      <View style={styles.clue}>
        {round.kind === 'count' ? (
          <View style={styles.shells}>
            {Array.from({ length: round.n }, (_, i) => <Text key={i} style={styles.shell}>🐚</Text>)}
          </View>
        ) : (
          <Text style={styles.clueText}>{round.kind === 'word' ? round.word : `${round.n} ${round.kind === 'more' ? '+ 1' : '− 1'}`}</Text>
        )}
      </View>

      <View style={styles.pond}>
        {round.fish.map((fish) => (
          <Choice
            key={fish.id}
            flow={flow}
            id={fish.id}
            isAnswer={fish.number === round.answer}
            done={caught === fish.id}
            onPress={() => pick(fish)}
            style={[styles.fish, { backgroundColor: fish.color }]}
            accessibilityLabel={`fish number ${fish.number}`}
          >
            <Text style={styles.fishEmoji}>{caught === fish.id ? '🎣' : '🐟'}</Text>
            <Text style={styles.fishNumber}>{fish.number}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  clue: { minWidth: 180, minHeight: 90, padding: 14, borderRadius: llRadius.xl, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center', ...llShadow.card },
  shells: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 180 },
  shell: { fontSize: 30, lineHeight: 38, width: 36, textAlign: 'center' },
  clueText: { ...llType.h1, color: ll.ink },
  pond: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 26, padding: 18, alignSelf: 'stretch',
    backgroundColor: '#BFDDFB', borderRadius: llRadius.screen,
  },
  fish: { width: 92, height: 104, borderRadius: 46 },
  fishEmoji: { fontSize: 30 },
  fishNumber: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: ll.ink },
});
