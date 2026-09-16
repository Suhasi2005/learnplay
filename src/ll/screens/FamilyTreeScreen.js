import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, MEMBERS, TOTAL_ROUNDS } from '../games/familyTreeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Family Tree Riddle" — My Family (Grade 1).
//
// Solve a relationship riddle; the answer's name is written onto the tree.
//
// The teaching device is the path from "me". Every riddle is a route through
// the tree — my father's father, my uncle's child — so the tree now draws
// real connector lines between generations, and the child's own node is
// pinned pink at the bottom with a "YOU ARE HERE" marker. The riddle can be
// walked with a finger instead of recalled as vocabulary, which is the whole
// difference between reading a tree and memorising nine words.
//
// Names arrive rather than appear: a solved branch's node flips from "?" to
// its label with a pop and keeps it for the rest of the game, so the tree
// fills in as the child works down the list.
export default function FamilyTreeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-family', subjectId: 'EVS', standardId: 'Grade 1', title: 'My Family' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [named, setNamed] = useState(['me']);
  // Presentation-only: which node just got its name.
  const [justNamed, setJustNamed] = useState(null);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setJustNamed(null);
    flow.say(round.riddle.replace('…', ''));
  }, [flow.index]);

  // "Me" pulses gently — every riddle starts from there.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged riddle logic.
  function pick(member) {
    if (member.id === round.answer) {
      if (!named.includes(member.id)) setNamed([...named, member.id]);
      setJustNamed(member.id);
      flow.succeed(round.solved, { hold: 1600 });
    } else {
      flow.missOn(member.id, `Not ${member.label.toLowerCase()}. Follow the tree and try again.`);
    }
  }
  // ---------------------------------------------------------------------

  const rows = [0, 1, 2].map((row) => MEMBERS.filter((m) => m.row === row));
  const compact = width < 360;
  const nodeW = compact ? 66 : 74;
  const mePulse = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Solve the family riddle">
      {/* THE TREE -------------------------------------------------------- */}
      <View style={styles.treeCast}>
        <LinearGradient colors={['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.76)']} style={[styles.tree, llRing.light]}>
          <TopHighlight radius={llRadius.xl} />

          {rows.map((members, r) => (
            <View key={r} style={styles.generation}>
              {/* Connectors between generations: a drop, a crossbar, and a
                  riser to each node below. */}
              {r > 0 ? (
                <View style={styles.connectors} pointerEvents="none">
                  <View style={styles.drop} />
                  <View style={[styles.crossbar, { width: nodeW * (members.length - 1) + 8 }]} />
                  <View style={styles.risers}>
                    {members.map((m) => <View key={m.id} style={[styles.riser, { width: nodeW }]} />)}
                  </View>
                </View>
              ) : null}

              <View style={styles.row}>
                {members.map((m) => {
                  const isNamed = named.includes(m.id);
                  const isMe = m.id === 'me';
                  const isLit = flow.isProcessing && m.id === round.answer;
                  const popping = justNamed === m.id;

                  const node = (
                    <LinearGradient
                      colors={isLit ? [ll.greenLight, ll.greenDeep] : isMe ? ['#FFF3F8', '#FFE3EE'] : llSurface.white}
                      style={[
                        styles.node,
                        { width: nodeW },
                        isMe && styles.me,
                        isLit && styles.lit,
                      ]}
                    >
                      <Sheen variant="tile" radius={llRadius.md} />
                      <GameObject emoji={m.emoji} size={34} />
                      <Text style={[styles.name, isLit && styles.nameLit, !isNamed && styles.nameUnknown]}>
                        {isNamed ? m.label : '?'}
                      </Text>
                    </LinearGradient>
                  );

                  return (
                    <View key={m.id} style={styles.nodeWrap}>
                      {isMe ? (
                        <Animated.View style={{ transform: [{ scale: mePulse }] }}>
                          {node}
                          <View style={styles.youTag}>
                            <Text style={styles.youText}>YOU</Text>
                          </View>
                        </Animated.View>
                      ) : popping ? (
                        <Pop from={0.7}>{node}</Pop>
                      ) : node}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </LinearGradient>
      </View>

      {/* THE RIDDLE — on a card, since it's the question. ---------------- */}
      <View style={styles.riddleCast}>
        <LinearGradient colors={['#F1FBF5', '#E2F4EA']} style={[styles.riddleCard, llRing.light]}>
          <TopHighlight radius={llRadius.xl} />
          <Text style={styles.riddleLabel}>RIDDLE</Text>
          <Text style={styles.riddle}>{round.riddle}</Text>
        </LinearGradient>
      </View>

      <View style={styles.options}>
        {round.options.map((m) => (
          <Choice
            key={m.id}
            flow={flow}
            id={m.id}
            isAnswer={m.id === round.answer}
            onPress={() => pick(m)}
            label={m.label}
            style={[styles.option, compact && { minWidth: 96 }]}
          />
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  treeCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  tree: { padding: 10, borderRadius: llRadius.xl, overflow: 'hidden' },

  generation: { alignItems: 'center' },
  connectors: { alignItems: 'center' },
  drop: { width: 3, height: 9, borderRadius: 2, backgroundColor: '#B08A5E' },
  crossbar: { height: 3, borderRadius: 2, backgroundColor: '#B08A5E' },
  risers: { flexDirection: 'row' },
  riser: { alignItems: 'center', height: 9 },

  row: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  nodeWrap: { alignItems: 'center' },
  node: {
    paddingVertical: 5, borderRadius: llRadius.md, alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: withAlpha('#8B86B8', 0.16),
    shadowColor: '#6054BE', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  me: {
    borderWidth: 2.5, borderColor: ll.pink,
    shadowColor: ll.pink, shadowOpacity: 0.35, shadowRadius: 12,
  },
  lit: { borderColor: ll.greenDeep, shadowColor: ll.greenDeep, shadowOpacity: 0.4, shadowRadius: 14 },
  face: { fontSize: 26 },
  name: { ...llType.tiny, color: ll.ink },
  nameLit: { color: ll.white },
  nameUnknown: { color: ll.muted },
  youTag: {
    position: 'absolute', bottom: -7, alignSelf: 'center',
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 99,
    backgroundColor: ll.pink,
  },
  youText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 7.5, letterSpacing: 1, color: ll.white },

  riddleCast: {
    alignSelf: 'stretch', marginTop: 20, borderRadius: llRadius.xl,
    shadowColor: '#3F9A6C', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  riddleCard: {
    borderRadius: llRadius.xl, paddingVertical: 13, paddingHorizontal: 16,
    alignItems: 'center', overflow: 'hidden',
  },
  riddleLabel: { ...llType.eyebrow, color: ll.greenDeep, marginBottom: 4 },
  riddle: { ...llType.h4, color: ll.ink, textAlign: 'center' },

  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18 },
  option: { minWidth: 110 },
});
