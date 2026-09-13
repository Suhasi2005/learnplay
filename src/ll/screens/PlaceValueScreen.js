import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, MAX_ONES, MAX_TENS, TOTAL_ROUNDS } from '../games/placeValueData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Place Value Tower" — Numbers 21 to 99 (Grade 1).
// Build a number from tens rods and ones cubes, or read the number a set of
// rods shows.
function Blocks({ tens, ones }) {
  return (
    <View style={styles.blocks}>
      <View style={styles.rods}>
        {Array.from({ length: tens }, (_, i) => (
          <View key={i} style={styles.rod}>
            {Array.from({ length: 9 }, (_, j) => <View key={j} style={styles.rodLine} />)}
          </View>
        ))}
      </View>
      <View style={styles.cubes}>
        {Array.from({ length: ones }, (_, i) => <View key={i} style={styles.cube} />)}
      </View>
    </View>
  );
}

export default function PlaceValueScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-num21to99', subjectId: 'Math', standardId: 'Grade 1', title: 'Numbers 21 to 99' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const isBuild = round.kind === 'build';

  useEffect(() => {
    setTens(0);
    setOnes(0);
    flow.say(isBuild ? `Build ${round.n} with tens and ones.` : 'What number do these blocks show?');
  }, [flow.index]);

  function addOne() {
    if (ones >= MAX_ONES) flow.say('Ten ones make a ten. Use a ten rod instead!');
    else setOnes(ones + 1);
  }

  function check() {
    const made = tens * 10 + ones;
    if (made === round.n) {
      flow.succeed(`${tens} tens and ${ones} ones make ${round.n}!`);
    } else if (flow.misses >= 1) {
      flow.missOn('check', `You made ${made}. ${round.n} needs ${round.tens} tens and ${round.ones} ones.`);
    } else {
      flow.missOn('check', `You made ${made}. Try again!`);
    }
  }

  function pick(n) {
    if (n === round.n) flow.succeed(`${round.tens} tens and ${round.ones} ones is ${round.n}.`);
    else flow.missOn(n, `${n} would be ${Math.floor(n / 10)} tens and ${n % 10} ones. Count the rods again.`);
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={isBuild ? `Build ${round.n}` : 'What number is this?'}>
      <View style={styles.tray}>
        {isBuild ? <Blocks tens={tens} ones={ones} /> : <Blocks tens={round.tens} ones={round.ones} />}
        {isBuild ? <Text style={styles.count}>{tens} tens · {ones} ones</Text> : null}
      </View>

      {isBuild ? (
        <>
          <View style={styles.controls}>
            <Choice flow={flow} id="t-" label="− Ten" disabled={tens === 0} onPress={() => setTens(tens - 1)} />
            <Choice flow={flow} id="t+" label="+ Ten" disabled={tens === MAX_TENS} onPress={() => setTens(tens + 1)} style={styles.tenBtn} />
            <Choice flow={flow} id="o-" label="− One" disabled={ones === 0} onPress={() => setOnes(ones - 1)} />
            <Choice flow={flow} id="o+" label="+ One" onPress={addOne} style={styles.oneBtn} />
          </View>
          <Choice flow={flow} id="check" label="Check ✓" onPress={check} style={styles.check} />
        </>
      ) : (
        <View style={styles.controls}>
          {round.options.map((n) => (
            <Choice key={n} flow={flow} id={n} isAnswer={n === round.n} onPress={() => pick(n)} style={styles.option}>
              <Text style={choiceText.big}>{n}</Text>
            </Choice>
          ))}
        </View>
      )}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  tray: { alignSelf: 'stretch', minHeight: 150, padding: 14, borderRadius: llRadius.xl, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center', ...llShadow.card },
  blocks: { flexDirection: 'row', alignItems: 'flex-end', gap: 18 },
  rods: { flexDirection: 'row', gap: 4 },
  rod: { width: 14, height: 100, borderRadius: 3, backgroundColor: ll.blue, justifyContent: 'space-evenly' },
  rodLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.7)' },
  cubes: { flexDirection: 'row', flexWrap: 'wrap-reverse', width: 54, gap: 3 },
  cube: { width: 14, height: 14, borderRadius: 2, backgroundColor: ll.amber },
  count: { ...llType.small, color: ll.body, marginTop: 10 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 22 },
  tenBtn: { backgroundColor: ll.blueSoft },
  oneBtn: { backgroundColor: ll.amberSoft },
  check: { marginTop: 16, minWidth: 160, backgroundColor: ll.greenLight },
  option: { width: 92, height: 80 },
});
