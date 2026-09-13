import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, ITEMS, TOTAL_ROUNDS } from '../games/backpackData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Pack the Backpack" — My School (Grade 1).
// Tap things in and out of the bag, then zip it to check against today's plan.
export default function BackpackScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-school', subjectId: 'EVS', standardId: 'Grade 1', title: 'My School' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [packed, setPacked] = useState([]);

  useEffect(() => {
    setPacked([]);
    flow.say(`Today is ${round.plan}. Pack your bag!`);
  }, [flow.index]);

  function toggle(id) {
    setPacked(packed.includes(id) ? packed.filter((p) => p !== id) : [...packed, id]);
  }

  function zip() {
    const extra = packed.find((id) => !round.needed.includes(id));
    const missing = round.needed.filter((id) => !packed.includes(id));
    if (!extra && missing.length === 0) {
      flow.succeed(`All packed for ${round.plan}!`);
    } else if (extra) {
      flow.missOn('zip', `We don't need the ${ITEMS[extra].label} for ${round.plan}.`);
    } else {
      flow.missOn('zip', `Something is missing. ${missing.length === 1 ? 'One thing' : `${missing.length} things`} still need packing.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Pack the bag for today">
      <View style={styles.plan}>
        <Text style={styles.planLabel}>TODAY</Text>
        <Text style={styles.planText}>{round.plan}</Text>
      </View>

      <View style={styles.bag}>
        <Text style={styles.bagEmoji}>🎒</Text>
        <Text style={styles.bagContents}>{packed.length ? packed.map((id) => ITEMS[id].emoji).join(' ') : 'Empty'}</Text>
      </View>

      <View style={styles.tray}>
        {round.tray.map((item) => (
          <Choice
            key={`${flow.index}-${item.id}`}
            flow={flow}
            id={item.id}
            isAnswer={round.needed.includes(item.id) && !packed.includes(item.id)}
            selected={packed.includes(item.id)}
            onPress={() => toggle(item.id)}
            style={styles.item}
            accessibilityLabel={`${item.label}${packed.includes(item.id) ? ', packed' : ''}`}
          >
            <Text style={choiceText.emoji}>{item.emoji}</Text>
            <Text style={choiceText.small}>{item.label}</Text>
          </Choice>
        ))}
      </View>

      <Choice flow={flow} id="zip" label="Zip it! 🤐" onPress={zip} style={styles.zip} />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  plan: { alignSelf: 'stretch', padding: 12, borderRadius: llRadius.lg, backgroundColor: ll.white, alignItems: 'center', ...llShadow.soft },
  planLabel: { ...llType.eyebrow, color: ll.greenDeep },
  planText: { ...llType.cardTitle, color: ll.ink, textAlign: 'center' },
  bag: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, minHeight: 60 },
  bagEmoji: { fontSize: 44 },
  bagContents: { fontSize: 24, color: ll.muted, maxWidth: 220 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14 },
  item: { width: 100, height: 96 },
  zip: { marginTop: 18, minWidth: 180, backgroundColor: ll.greenLight },
});
