import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/caterpillarData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow } from '../tokens';

// "Caterpillar Sentence" — Simple Sentence Formation (Grade 1).
// Fill each blank segment to match the picture, then choose the tail: . or ?
export default function CaterpillarScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-sentences', subjectId: 'English', standardId: 'Grade 1', title: 'Simple Sentence Formation' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);
  const [filled, setFilled] = useState({});

  useEffect(() => {
    setStep(0);
    setFilled({});
    flow.say('Make a sentence about the picture.');
  }, [flow.index]);

  const current = round.steps[step];

  function pick(option) {
    if (!current) return;
    if (option === current.answer) {
      setFilled({ ...filled, [current.segId]: option });
      setStep(step + 1);
      if (step === round.steps.length - 1) flow.succeed(round.sentence);
      else flow.cheer(option);
    } else if (current.kind === 'mark') {
      flow.missOn(option, round.mark === '?'
        ? 'This sentence is asking something, so it needs a question mark.'
        : 'This sentence is telling us something, so it ends with a full stop.');
    } else {
      flow.missOn(option, `Look at the picture. Is it about ${option}?`);
    }
  }

  const segText = (seg) => seg.text ?? filled[seg.id] ?? (current?.segId === seg.id ? '?' : '…');

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Build a sentence about the picture">
      <View style={styles.picture}><Text style={styles.pictureEmoji}>{round.emoji}</Text></View>

      <View style={styles.body}>
        <Text style={styles.head}>🐛</Text>
        {round.segments.map((seg) => (
          <View key={seg.id} style={[styles.segment, !seg.text && styles.blank, current?.segId === seg.id && styles.current,
            filled[seg.id] && styles.done]}>
            <Text style={styles.segText}>{segText(seg)}</Text>
          </View>
        ))}
        <View style={[styles.segment, styles.tail, current?.segId === 'mark' && styles.current, filled.mark && styles.done]}>
          <Text style={styles.segText}>{filled.mark ?? (current?.segId === 'mark' ? '?' : '…')}</Text>
        </View>
      </View>

      <View style={styles.options}>
        {(current?.options ?? []).map((option) => (
          <Choice key={`${step}-${option}`} flow={flow} id={option} isAnswer={option === current.answer} onPress={() => pick(option)} style={styles.option}>
            <Text style={current.kind === 'mark' ? choiceText.big : styles.optionText}>{option}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  picture: { width: 120, height: 120, borderRadius: llRadius.xxl, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center', ...llShadow.card },
  pictureEmoji: { fontSize: 64 },
  body: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  head: { fontSize: 34 },
  segment: { minHeight: 46, paddingHorizontal: 12, borderRadius: 23, backgroundColor: ll.greenLight, alignItems: 'center', justifyContent: 'center' },
  blank: { backgroundColor: ll.white, borderWidth: 2, borderStyle: 'dashed', borderColor: ll.lilac },
  current: { borderColor: ll.pink, borderStyle: 'solid', borderWidth: 3 },
  done: { backgroundColor: ll.green, borderWidth: 0 },
  tail: { minWidth: 46 },
  segText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 },
  option: { minWidth: 96 },
  optionText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.ink },
});
