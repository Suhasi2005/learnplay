import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/robotFixData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Robot Fix-It" — Basic Grammar (Grade 1).
// Step 1: tap the broken word. Step 2: pick the word that fixes it.
export default function RobotFixScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-grammar', subjectId: 'English', standardId: 'Grade 1', title: 'Basic Grammar' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [phase, setPhase] = useState('find'); // find → fix → done

  useEffect(() => {
    setPhase('find');
    flow.say(`Beep boop! ${round.sentence} One word is broken. Can you find it?`);
  }, [flow.index]);

  function tapWord(i) {
    if (phase !== 'find') return;
    if (i === round.wrong) {
      setPhase('fix');
      flow.cheer(`Yes! ${round.words[i]} is broken. Which word fixes it?`);
    } else {
      flow.missOn(`w${i}`, `${round.words[i]} is fine. Find the broken word.`);
    }
  }

  function pickFix(option) {
    if (phase !== 'fix') return;
    if (option === round.fix) {
      setPhase('done');
      flow.succeed(`${round.rule} ${round.fixedSentence}`, { hold: 2400 });
    } else {
      flow.missOn(`o${option}`, `${option} doesn't fix it. Try another word.`);
    }
  }

  const heading = phase === 'find' ? 'Tap the broken word' : phase === 'fix' ? 'Pick the right word' : 'Fixed!';

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt={heading}>
      <View style={styles.robotRow}>
        <Text style={styles.robot}>{phase === 'done' ? '🤖✨' : '🤖'}</Text>
        <Text style={styles.bubble}>{phase === 'done' ? round.rule : 'Beep! One word is broken.'}</Text>
      </View>

      <View style={styles.sentence}>
        {round.words.map((word, i) => {
          const isBroken = i === round.wrong && phase !== 'find';
          const shown = i === round.wrong && phase === 'done' ? round.fix : word;
          return (
            <Choice
              key={`${flow.index}-${i}`}
              flow={flow}
              id={`w${i}`}
              isAnswer={phase === 'find' && i === round.wrong}
              done={isBroken && phase === 'done'}
              disabled={phase !== 'find' && !isBroken}
              onPress={() => tapWord(i)}
              style={[styles.word, isBroken && phase === 'fix' && styles.broken]}
            >
              <Text style={styles.wordText}>{shown}</Text>
            </Choice>
          );
        })}
      </View>

      {phase === 'fix' ? (
        <View style={styles.options}>
          {round.options.map((option) => (
            <Choice key={option} flow={flow} id={`o${option}`} isAnswer={option === round.fix} onPress={() => pickFix(option)} style={styles.option}>
              <Text style={styles.wordText}>{option}</Text>
            </Choice>
          ))}
        </View>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  robotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  robot: { fontSize: 50 },
  bubble: { ...llType.body, flex: 1, color: ll.blueInk, backgroundColor: ll.blueTint, borderRadius: llRadius.lg, padding: 12, overflow: 'hidden' },
  sentence: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24, padding: 14, alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: llRadius.xl, ...llShadow.soft,
  },
  word: { minWidth: 0, minHeight: 48, paddingHorizontal: 10 },
  broken: { borderColor: '#E5484D', backgroundColor: '#FFE8E8' },
  wordText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
  options: { flexDirection: 'row', gap: 12, marginTop: 26 },
  option: { minWidth: 96 },
});
