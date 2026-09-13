import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/soundBlenderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Sound Blender" — Phonetics (Grade 1).
// Hear the word, see the picture, find the sound missing from its spelling.
export default function SoundBlenderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-phonetics', subjectId: 'English', standardId: 'Grade 1', title: 'Phonetics' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setSolved(false);
    flow.say(`${round.word}. Which sound is missing at the ${round.position}?`);
  }, [flow.index]);

  function pick(letter) {
    if (solved) return;
    if (letter === round.answer) {
      setSolved(true);
      flow.succeed(`${round.word.split('').join(', ')}. ${round.word}!`);
    } else {
      const tried = round.word.slice(0, round.missing) + letter + round.word.slice(round.missing + 1);
      flow.missOn(letter, `${tried} is not the picture. Listen: ${round.word}.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt={`Which sound is missing at the ${round.position}?`}>
      <Choice flow={flow} id="hear" onPress={() => flow.say(round.word)} style={styles.picture} accessibilityLabel="Hear the word again">
        <Text style={styles.pictureEmoji}>{round.emoji}</Text>
        <Text style={styles.hear}>🔊 Hear it</Text>
      </Choice>

      <View style={styles.tiles}>
        {round.word.split('').map((letter, i) => {
          const isGap = i === round.missing;
          return (
            <View key={i} style={[styles.tile, isGap && !solved && styles.gap, isGap && solved && styles.filled]}>
              <Text style={styles.tileText}>{isGap && !solved ? '?' : letter}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.options}>
        {round.options.map((letter) => (
          <Choice key={letter} flow={flow} id={letter} isAnswer={letter === round.answer} onPress={() => pick(letter)} style={styles.option}>
            <Text style={choiceText.big}>{letter}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  picture: { width: 140, height: 140, borderRadius: llRadius.xxl },
  pictureEmoji: { fontSize: 68 },
  hear: { ...llType.tiny, color: ll.pinkDeep },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 24 },
  tile: {
    width: 70, height: 78, borderRadius: llRadius.md, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center',
    ...llShadow.soft,
  },
  gap: { borderWidth: 3, borderStyle: 'dashed', borderColor: ll.pink, backgroundColor: ll.pinkTint },
  filled: { backgroundColor: ll.greenLight },
  tileText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 40, lineHeight: 48, color: ll.ink },
  options: { flexDirection: 'row', gap: 14, marginTop: 28 },
  option: { width: 80, height: 80, borderRadius: 40 },
});
