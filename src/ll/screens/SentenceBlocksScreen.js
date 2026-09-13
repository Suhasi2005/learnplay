import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Floating, Pop } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/sentenceBlocksData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Sentence Blocks" — Simple Sentences (Senior KG).
//
// A picture, a row of empty slots, and the sentence's words as jumbled
// blocks. Tapping the next word in reading order snaps it into the next
// slot; a word out of order wobbles and stays in the tray. The capital on
// the first word and the full stop at the end are visible the whole time —
// they're the two clues to where a sentence starts and stops.
export default function SentenceBlocksScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-en-sentences', subjectId: 'English', standardId: 'Senior KG', title: 'Simple Sentences' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [placed, setPlaced] = useState([]);
  const [wrongId, setWrongId] = useState(null);

  useEffect(() => {
    setPlaced([]);
    setWrongId(null);
    flow.say(`${round.sentence} Build the sentence!`);
  }, [flow.index]);

  const expected = round.words[placed.length];
  const hintId = flow.hinting ? round.blocks.find((b) => !placed.includes(b.id) && b.word === expected)?.id : null;

  function handleTap(block) {
    if (flow.isProcessing || placed.includes(block.id)) return;
    if (block.word === expected) {
      const next = [...placed, block.id];
      setPlaced(next);
      if (next.length === round.words.length) {
        flow.succeed(round.sentence, { hold: 1600 });
      } else {
        flow.cheer(block.word);
      }
    } else {
      setWrongId(block.id);
      flow.miss('Which word comes next?');
      flow.later(() => setWrongId(null), 420);
    }
  }

  const placedBlocks = placed.map((id) => round.blocks.find((b) => b.id === id));
  const done = placed.length === round.words.length;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Tap the words in order">
      <Pressable onPress={() => flow.say(round.sentence)} accessibilityRole="button" accessibilityLabel="Hear the sentence again">
        <Floating distance={8} duration={2600} style={styles.picture}>
          <Text style={styles.pictureEmoji}>{round.emoji}</Text>
          <Text style={styles.hear}>🔊 Hear it</Text>
        </Floating>
      </Pressable>

      <View style={[styles.line, done && styles.lineDone]}>
        {round.words.map((_, i) => {
          const b = placedBlocks[i];
          return b ? (
            <Pop key={`${flow.index}-${i}`} from={0.4}>
              <View style={[styles.block, { backgroundColor: b.color }]}>
                <Text style={styles.blockText}>{b.word}</Text>
              </View>
            </Pop>
          ) : (
            <View key={`${flow.index}-${i}`} style={[styles.slot, i === placed.length && styles.slotNext]} />
          );
        })}
        <Text style={[styles.stop, done && { color: ll.greenDeep }]}>.</Text>
      </View>

      <View style={styles.tray}>
        {round.blocks.map((b) => {
          const used = placed.includes(b.id);
          return (
            <Animated.View key={`${flow.index}-${b.id}`} style={wrongId === b.id && { transform: [{ translateX: flow.shakeX }] }}>
              <Pressable
                onPress={() => handleTap(b)}
                disabled={used || flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={b.word}
                style={[styles.block, styles.trayBlock, { backgroundColor: used ? ll.track : b.color },
                  hintId === b.id && styles.hint]}
              >
                <Text style={[styles.blockText, used && { color: 'transparent' }]}>{b.word}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  picture: {
    width: 132, height: 132, borderRadius: llRadius.xxl, backgroundColor: ll.white, alignItems: 'center',
    justifyContent: 'center', ...llShadow.card,
  },
  pictureEmoji: { fontSize: 64 },
  hear: { ...llType.tiny, color: ll.pinkDeep, marginTop: 2 },

  line: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center', gap: 6,
    alignSelf: 'stretch', minHeight: 70, marginTop: 26, paddingVertical: 12, paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: llRadius.xl, borderWidth: 2, borderColor: ll.lilac,
  },
  lineDone: { borderColor: ll.green, backgroundColor: ll.white },
  slot: {
    width: 62, height: 44, borderRadius: llRadius.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: ll.lilac,
  },
  slotNext: { borderColor: ll.pink },
  stop: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40, color: ll.muted },

  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 30 },
  block: {
    minWidth: 62, height: 44, borderRadius: llRadius.sm, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
  },
  trayBlock: { height: 54, minWidth: 76, borderBottomWidth: 4, borderBottomColor: 'rgba(46,42,99,0.18)', ...llShadow.soft },
  blockText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.white },
  hint: { borderWidth: 3, borderColor: ll.amber },
});
