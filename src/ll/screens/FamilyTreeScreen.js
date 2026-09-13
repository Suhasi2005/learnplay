import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, MEMBERS, TOTAL_ROUNDS } from '../games/familyTreeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Family Tree Riddle" — My Family (Grade 1).
// Solve a relationship riddle; the answer's name is written onto the tree.
export default function FamilyTreeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-family', subjectId: 'EVS', standardId: 'Grade 1', title: 'My Family' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [named, setNamed] = useState(['me']);

  useEffect(() => { flow.say(round.riddle.replace('…', '')); }, [flow.index]);

  function pick(member) {
    if (member.id === round.answer) {
      if (!named.includes(member.id)) setNamed([...named, member.id]);
      flow.succeed(round.solved, { hold: 1600 });
    } else {
      flow.missOn(member.id, `Not ${member.label.toLowerCase()}. Follow the tree and try again.`);
    }
  }

  const rows = [0, 1, 2].map((row) => MEMBERS.filter((m) => m.row === row));

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Solve the family riddle">
      <View style={styles.tree}>
        {rows.map((members, r) => (
          <View key={r}>
            {r > 0 ? <View style={styles.trunk} /> : null}
            <View style={styles.row}>
              {members.map((m) => {
                const isNamed = named.includes(m.id);
                return (
                  <View key={m.id} style={[styles.node, m.id === 'me' && styles.me, flow.isProcessing && m.id === round.answer && styles.lit]}>
                    <Text style={styles.face}>{m.emoji}</Text>
                    <Text style={styles.name}>{isNamed ? m.label : '?'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.riddle}>{round.riddle}</Text>

      <View style={styles.options}>
        {round.options.map((m) => (
          <Choice key={m.id} flow={flow} id={m.id} isAnswer={m.id === round.answer} onPress={() => pick(m)} label={m.label} style={styles.option} />
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  tree: { alignSelf: 'stretch', padding: 10, borderRadius: llRadius.xl, backgroundColor: 'rgba(255,255,255,0.7)', ...llShadow.soft },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  trunk: { width: 3, height: 12, backgroundColor: '#B08A5E', alignSelf: 'center' },
  node: { width: 76, paddingVertical: 4, borderRadius: llRadius.md, backgroundColor: ll.white, alignItems: 'center' },
  me: { borderWidth: 2, borderColor: ll.pink },
  lit: { backgroundColor: ll.greenLight },
  face: { fontSize: 26 },
  name: { ...llType.tiny, color: ll.ink },
  riddle: { ...llType.h4, color: ll.ink, textAlign: 'center', marginTop: 18 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
  option: { minWidth: 110 },
});
