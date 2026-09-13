import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/alphabetLadderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow } from '../tokens';

// "Alphabet Ladder" — Alphabet Recognition (Grade 1).
// Letters climb the ladder bottom to top; fill each missing rung in turn.
export default function AlphabetLadderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-alphabet', subjectId: 'English', standardId: 'Grade 1', title: 'Alphabet Recognition' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    flow.say('Which letter is missing on the ladder?');
  }, [flow.index]);

  const current = round.steps[step];
  const hidden = round.steps.map((s) => s.pos);
  const solved = round.steps.slice(0, step).map((s) => s.pos);

  function pick(letter) {
    if (!current) return;
    if (letter === current.answer) {
      setStep(step + 1);
      if (step === round.steps.length - 1) flow.succeed(round.letters.join(', '));
      else flow.cheer(letter);
    } else {
      flow.missOn(letter, `Not ${letter}. Say the letters in order from the bottom.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Fill the missing letter">
      <View style={styles.ladder}>
        {round.letters.map((letter, pos) => {
          const isHidden = hidden.includes(pos) && !solved.includes(pos);
          const isCurrent = current?.pos === pos;
          return (
            <View key={pos} style={styles.rungRow}>
              <Text style={styles.climber}>{isCurrent ? '🐒' : ''}</Text>
              <View style={[styles.rung, isCurrent && styles.rungCurrent, solved.includes(pos) && styles.rungSolved]}>
                <Text style={styles.rungText}>{isHidden ? (isCurrent ? '?' : '·') : letter}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.options}>
        {(current?.options ?? []).map((letter) => (
          <Choice key={`${step}-${letter}`} flow={flow} id={letter} isAnswer={letter === current.answer} onPress={() => pick(letter)} style={styles.option}>
            <Text style={choiceText.big}>{letter}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  // column-reverse: the first letter sits on the bottom rung.
  ladder: {
    flexDirection: 'column-reverse', gap: 8, paddingVertical: 14, paddingHorizontal: 22,
    borderLeftWidth: 6, borderRightWidth: 6, borderColor: '#CDAE86', backgroundColor: 'rgba(255,255,255,0.5)',
  },
  rungRow: { flexDirection: 'row', alignItems: 'center' },
  climber: { width: 36, fontSize: 26, marginLeft: -52 },
  rung: {
    width: 120, height: 46, borderRadius: llRadius.sm, backgroundColor: '#E2C9A6', alignItems: 'center', justifyContent: 'center',
  },
  rungCurrent: { backgroundColor: ll.white, borderWidth: 3, borderColor: ll.pink, ...llShadow.soft },
  rungSolved: { backgroundColor: ll.greenLight },
  rungText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, lineHeight: 32, color: ll.ink },
  options: { flexDirection: 'row', gap: 14, marginTop: 24 },
  option: { width: 80, height: 80 },
});
