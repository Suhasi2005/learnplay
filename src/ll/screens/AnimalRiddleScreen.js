import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/animalRiddleData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Animal Riddle Reveal" — Animals Around Us (Grade 1).
// Clues arrive one at a time; guess whenever you're sure. A wrong guess
// greys that animal out and reveals the next clue.
export default function AnimalRiddleScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-animals', subjectId: 'EVS', standardId: 'Grade 1', title: 'Animals Around Us' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [shown, setShown] = useState(1);
  const [out, setOut] = useState([]);

  useEffect(() => {
    setShown(1);
    setOut([]);
    flow.say(`Who am I? ${round.clues[0]}`);
  }, [flow.index]);

  function nextClue() {
    if (shown >= round.clues.length) return;
    flow.say(round.clues[shown]);
    setShown(shown + 1);
  }

  function guess(animal) {
    if (animal.id === round.answer) {
      setShown(round.clues.length);
      flow.succeed(`Yes! I am a ${animal.label}!`);
    } else {
      setOut([...out, animal.id]);
      const clue = round.clues[shown];
      flow.missOn(animal.id, `I am not a ${animal.label}.${clue ? ` Here is another clue. ${clue}` : ''}`);
      if (clue) setShown(shown + 1);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Who am I?">
      <View style={styles.clues}>
        {round.clues.slice(0, shown).map((clue, i) => (
          <Text key={i} style={styles.clue}>🔍 {clue}</Text>
        ))}
      </View>

      <Choice flow={flow} id="more" label={shown < round.clues.length ? 'Another clue' : 'No more clues'} disabled={shown >= round.clues.length} onPress={nextClue} style={styles.more} />

      <View style={styles.animals}>
        {round.options.map((animal) => (
          <Choice
            key={animal.id}
            flow={flow}
            id={animal.id}
            isAnswer={animal.id === round.answer}
            disabled={out.includes(animal.id)}
            done={flow.isProcessing && animal.id === round.answer}
            onPress={() => guess(animal)}
            style={styles.animal}
            accessibilityLabel={animal.label}
          >
            <Text style={choiceText.emoji}>{animal.emoji}</Text>
            <Text style={choiceText.small}>{animal.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  clues: { alignSelf: 'stretch', gap: 6, padding: 14, minHeight: 120, borderRadius: llRadius.xl, backgroundColor: ll.white, ...llShadow.card },
  clue: { ...llType.cardTitle, color: ll.ink },
  more: { marginTop: 12, minWidth: 160, backgroundColor: ll.amberSoft },
  animals: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 18, width: 300 },
  animal: { width: 130, height: 100 },
});
