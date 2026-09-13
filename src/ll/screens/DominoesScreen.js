import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/dominoData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Equation Dominoes" — Addition & Subtraction up to 20 (Grade 1).
// Attach the domino showing the answer; its other half carries the next
// sum, which starts from that answer.
const sign = (op) => (op === '+' ? '+' : '−');
const word = (op) => (op === '+' ? 'plus' : 'take away');

function Domino({ left, right }) {
  return (
    <View style={styles.domino}>
      <Text style={styles.half}>{left}</Text>
      <View style={styles.divider} />
      <Text style={styles.half}>{right}</Text>
    </View>
  );
}

export default function DominoesScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-addsub20', subjectId: 'Math', standardId: 'Grade 1', title: 'Addition & Subtraction up to 20' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [link, setLink] = useState(0);
  const current = round.links[link];

  useEffect(() => {
    setLink(0);
    const first = round.links[0];
    flow.say(`${first.a} ${word(first.op)} ${first.b}. Find the domino.`);
  }, [flow.index]);

  function pick(n) {
    if (!current) return;
    if (n === current.answer) {
      const next = round.links[link + 1];
      setLink(link + 1);
      if (!next) flow.succeed(`${current.a} ${word(current.op)} ${current.b} is ${n}. Chain complete!`, { hold: 1600 });
      else flow.cheer(`${n}! Now ${next.a} ${word(next.op)} ${next.b}.`);
    } else {
      flow.missOn(`${link}-${n}`, `Not ${n}. Work out ${current.a} ${word(current.op)} ${current.b} again.`);
    }
  }

  const eq = (l) => `${l.a}${sign(l.op)}${l.b}`;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Attach the domino with the answer">
      <View style={styles.chain}>
        <Domino left="▶" right={eq(round.links[0])} />
        {round.links.slice(0, link).map((l, k) => (
          <Domino key={k} left={l.answer} right={round.links[k + 1] ? eq(round.links[k + 1]) : '🏁'} />
        ))}
      </View>

      {current ? (
        <>
          <Text style={styles.question}>{current.a} {sign(current.op)} {current.b} = ?</Text>
          <View style={styles.options}>
            {current.options.map((n) => (
              <Choice key={`${link}-${n}`} flow={flow} id={`${link}-${n}`} isAnswer={n === current.answer} onPress={() => pick(n)} style={styles.option} accessibilityLabel={`${n}`}>
                <Domino left={n} right="" />
              </Choice>
            ))}
          </View>
        </>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  chain: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, alignSelf: 'stretch' },
  domino: {
    flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 10, backgroundColor: ll.white,
    borderWidth: 2, borderColor: ll.ink, paddingHorizontal: 6, ...llShadow.soft,
  },
  half: { minWidth: 38, textAlign: 'center', fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink },
  divider: { width: 2, alignSelf: 'stretch', backgroundColor: ll.ink, marginVertical: 6 },
  question: { ...llType.h1, color: ll.ink, marginTop: 30 },
  options: { flexDirection: 'row', gap: 12, marginTop: 20 },
  option: { padding: 6, borderRadius: llRadius.md },
});
