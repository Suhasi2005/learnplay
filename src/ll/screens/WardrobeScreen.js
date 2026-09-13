import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/wardrobeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Dress for It" — Our Clothes (Grade 1).
// Dress for the weather, job or occasion, one body part at a time.
export default function WardrobeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-clothes', subjectId: 'EVS', standardId: 'Grade 1', title: 'Our Clothes' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);
  const current = round.steps[step];

  useEffect(() => {
    setStep(0);
    flow.say(`Get dressed for ${round.scene}.`);
  }, [flow.index]);

  function pick(option) {
    if (!current) return;
    if (option.id === current.answer.id) {
      setStep(step + 1);
      if (step === round.steps.length - 1) flow.succeed(`Ready for ${round.scene}!`);
      else flow.cheer(option.label);
    } else {
      flow.missOn(option.id, `Not the ${option.label} for ${round.scene}.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={`Dress for ${round.scene}`}>
      <View style={styles.scene}>
        <Text style={styles.sceneEmoji}>{round.emoji}</Text>
        <View style={styles.slots}>
          {round.steps.map((s, i) => (
            <View key={s.slot} style={[styles.slotRow, i === step && styles.slotCurrent]}>
              <Text style={styles.slotName}>{s.slot}</Text>
              <Text style={styles.slotItem}>{i < step ? s.answer.emoji : i === step ? '?' : ''}</Text>
            </View>
          ))}
        </View>
      </View>

      {current ? <Text style={styles.ask}>What goes on: {current.slot}?</Text> : null}

      <View style={styles.options}>
        {(current?.options ?? []).map((option) => (
          <Choice key={`${step}-${option.id}`} flow={flow} id={option.id} isAnswer={option.id === current.answer.id} onPress={() => pick(option)} style={styles.option} accessibilityLabel={option.label}>
            <Text style={choiceText.emoji}>{option.emoji}</Text>
            <Text style={choiceText.small}>{option.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  scene: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch', padding: 14, borderRadius: llRadius.xl, backgroundColor: ll.white, ...llShadow.card },
  sceneEmoji: { fontSize: 60 },
  slots: { flex: 1, gap: 6 },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, height: 40, borderRadius: 20, backgroundColor: ll.track },
  slotCurrent: { backgroundColor: '#E3F5EA', borderWidth: 2, borderColor: ll.green },
  slotName: { ...llType.cardTitle, color: ll.ink },
  slotItem: { fontSize: 24 },
  ask: { ...llType.cardTitle, color: ll.greenDeep, marginTop: 20 },
  options: { flexDirection: 'row', gap: 10, marginTop: 14 },
  option: { width: 104, height: 110 },
});
