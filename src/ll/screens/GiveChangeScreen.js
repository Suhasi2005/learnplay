import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/changeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Give the Change" — Money (Grade 1).
// Add two prices, work out change from a note, or decide if you can afford it.
function PriceCard({ emoji, label, price }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemEmoji}>{emoji}</Text>
      <Text style={choiceText.small}>{label}</Text>
      <Text style={styles.tag}>₹{price}</Text>
    </View>
  );
}

function promptFor(r) {
  if (r.kind === 'total') return 'How much for both?';
  if (r.kind === 'change') return `You pay ₹${r.paid}. How much change?`;
  return `You have ₹${r.wallet}. Can you buy it?`;
}

export default function GiveChangeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-money', subjectId: 'Math', standardId: 'Grade 1', title: 'Money' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const prompt = promptFor(round);

  useEffect(() => { flow.say(prompt.replace(/₹(\d+)/g, '$1 rupees')); }, [flow.index]);

  function pick(option) {
    if (option === round.answer) {
      if (round.kind === 'total') flow.succeed(`${round.items[0].price} plus ${round.items[1].price} is ${round.answer} rupees.`);
      else if (round.kind === 'change') flow.succeed(`${round.paid} take away ${round.item.price} is ${round.answer} rupees change.`);
      else if (round.answer === 'Yes') flow.succeed(`Yes! ${round.wallet} rupees is enough for ${round.item.price}.`);
      else flow.succeed(`That's right. ${round.wallet} rupees is less than ${round.item.price}.`);
    } else if (round.kind === 'change' && option === round.item.price) {
      flow.missOn(option, `That's the price. Change is what you get back from ${round.paid}.`);
    } else if (round.kind === 'afford') {
      flow.missOn(option, `Compare ${round.wallet} and ${round.item.price}. Which is bigger?`);
    } else {
      flow.missOn(option, `Not ${option}. Work it out again.`);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      <View style={styles.counter}>
        {round.kind === 'total' ? (
          <>
            <PriceCard {...round.items[0]} />
            <Text style={styles.op}>+</Text>
            <PriceCard {...round.items[1]} />
          </>
        ) : (
          <>
            <PriceCard {...round.item} />
            <View style={styles.money}>
              <Text style={styles.moneyEmoji}>{round.kind === 'change' ? '💵' : '👛'}</Text>
              <Text style={styles.moneyText}>₹{round.kind === 'change' ? round.paid : round.wallet}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.options}>
        {round.options.map((option) => (
          <Choice key={option} flow={flow} id={option} isAnswer={option === round.answer} onPress={() => pick(option)} style={styles.option}>
            <Text style={choiceText.big}>{typeof option === 'number' ? `₹${option}` : option}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  counter: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  item: { width: 110, paddingVertical: 12, borderRadius: llRadius.xl, backgroundColor: ll.white, alignItems: 'center', ...llShadow.card },
  itemEmoji: { fontSize: 48 },
  tag: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: ll.amberInk, backgroundColor: ll.amberSoft, borderRadius: 10, paddingHorizontal: 10, marginTop: 4, overflow: 'hidden' },
  op: { ...llType.h1, color: ll.ink },
  money: { width: 110, paddingVertical: 12, borderRadius: llRadius.xl, backgroundColor: '#E3F5EA', alignItems: 'center' },
  moneyEmoji: { fontSize: 48 },
  moneyText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: ll.greenDeep },
  options: { flexDirection: 'row', gap: 12, marginTop: 30 },
  option: { minWidth: 96, height: 76 },
});
