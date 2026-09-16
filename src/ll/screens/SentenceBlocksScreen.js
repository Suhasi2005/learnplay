import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Floating, Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import DragPiece from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/sentenceBlocksData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Sentence Blocks" — Simple Sentences (Senior KG).
//
// The child builds a sentence out of physical bricks. Words wait in a tray as
// chunky blocks with a thick bottom edge; dragging one up to the rail — or
// tapping it, which a five-year-old will often do — snaps it into the next
// slot with a click. A word out of order wobbles and stays put.
//
// Two things do the teaching, and both are visible the whole time:
//
//  - The first slot is marked with a capital-letter cue and the line ends in
//    a full stop, so "where a sentence starts and stops" is a property of the
//    rail rather than a rule to remember.
//  - Only the *next* slot is lit. A sentence is built left to right, one word
//    at a time, and the rail says so without any instruction text.
//
// The round logic is useRoundFlow's; handleTap below is unchanged, and both
// the drag and the tap route through it.
export default function SentenceBlocksScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-en-sentences', subjectId: 'English', standardId: 'Senior KG', title: 'Simple Sentences' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [placed, setPlaced] = useState([]);
  const [wrongId, setWrongId] = useState(null);
  // Presentation-only: the block currently in the child's hand.
  const [carried, setCarried] = useState(null);

  const railPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPlaced([]);
    setWrongId(null);
    setCarried(null);
    flow.say(`${round.sentence} Build the sentence!`);
  }, [flow.index]);

  // The waiting slot breathes while a block is being carried toward it.
  useEffect(() => {
    if (carried === null) {
      railPulse.stopAnimation();
      Animated.timing(railPulse, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(railPulse, { toValue: 1, duration: 460, useNativeDriver: true }),
        Animated.timing(railPulse, { toValue: 0, duration: 460, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [carried]);

  const expected = round.words[placed.length];
  const hintId = flow.hinting ? round.blocks.find((b) => !placed.includes(b.id) && b.word === expected)?.id : null;

  // ---------------------------------------------------------------------
  // Unchanged placement logic.
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
  // ---------------------------------------------------------------------

  const placedBlocks = placed.map((id) => round.blocks.find((b) => b.id === id));
  const done = placed.length === round.words.length;

  const slotScale = railPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const compact = width < 360;
  const blockH = compact ? 48 : 54;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt="Build the sentence">
      {/* THE PICTURE — tap to hear the sentence again. ------------------- */}
      <Pressable onPress={() => flow.say(round.sentence)} accessibilityRole="button" accessibilityLabel="Hear the sentence again">
        <Floating distance={8} duration={2600}>
          <View style={styles.pictureCast}>
            <LinearGradient colors={llSurface.whitePink} style={[styles.picture, llRing.faint]}>
              <TopHighlight radius={llRadius.xxl} />
              <GameObject id={round.id} emoji={round.emoji} size={56} />
              <View style={styles.hearChip}>
                <Text style={styles.hear}>🔊 Hear it</Text>
              </View>
            </LinearGradient>
          </View>
        </Floating>
      </Pressable>

      {/* THE RAIL — where the sentence gets built. ----------------------- */}
      <View style={[styles.railCast, done && styles.railCastDone]}>
        <LinearGradient
          colors={done ? ['#F1FBF5', '#E4F6EC'] : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.72)']}
          style={[styles.rail, done ? styles.railDone : llRing.light]}
        >
          <Sheen variant="trough" radius={llRadius.xl} />

          {round.words.map((_, i) => {
            const b = placedBlocks[i];
            const isNext = i === placed.length;
            if (b) {
              return (
                <Pop key={`${flow.index}-${i}`} from={0.4}>
                  <View style={[styles.blockCast, { shadowColor: b.color }]}>
                    <LinearGradient
                      colors={[withAlpha('#FFFFFF', 0.34), 'transparent']}
                      style={[styles.block, { backgroundColor: b.color, height: blockH - 10 }]}
                    >
                      <Text style={styles.blockText}>{b.word}</Text>
                    </LinearGradient>
                  </View>
                </Pop>
              );
            }
            return (
              <Animated.View
                key={`${flow.index}-${i}`}
                style={[
                  styles.slot,
                  { height: blockH - 10 },
                  isNext && styles.slotNext,
                  isNext && carried !== null && { transform: [{ scale: slotScale }] },
                ]}
              >
                {/* The capital-letter cue on the very first slot. */}
                {i === 0 ? <Text style={styles.capCue}>Aa</Text> : null}
              </Animated.View>
            );
          })}

          <Text style={[styles.stop, done && styles.stopDone]}>.</Text>
        </LinearGradient>
      </View>

      {/* THE TRAY — loose word blocks. ----------------------------------- */}
      <View style={styles.trayWrap}>
        <LinearGradient colors={['#F6F2FF', '#EAE3FB']} style={[styles.tray, llRing.light]}>
          <Sheen variant="trough" radius={llRadius.sheet} />
          <View style={styles.trayRow}>
            {round.blocks.map((b) => {
              const used = placed.includes(b.id);
              const isWrong = wrongId === b.id;
              if (used) {
                // The block has moved to the rail — leave its empty socket, so
                // the tray visibly empties as the sentence fills.
                return <View key={`${flow.index}-${b.id}`} style={[styles.socket, { height: blockH }]} />;
              }
              return (
                <DragPiece
                  key={`${flow.index}-${b.id}`}
                  direction="up"
                  threshold={42}
                  disabled={flow.isProcessing}
                  accessibilityLabel={b.word}
                  onLift={() => setCarried(b.id)}
                  onDrop={(placedNow) => {
                    setCarried(null);
                    if (placedNow) handleTap(b);
                  }}
                >
                  <Animated.View style={isWrong ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
                    <View
                      style={[
                        styles.trayCast,
                        { shadowColor: b.color },
                        carried === b.id && styles.trayCastLifted,
                        hintId === b.id && styles.trayCastHint,
                      ]}
                    >
                      <View style={[styles.trayBlock, { backgroundColor: b.color, height: blockH }, hintId === b.id && styles.hint]}>
                        <LinearGradient
                          colors={[withAlpha('#FFFFFF', 0.4), 'transparent', withAlpha('#000000', 0.14)]}
                          locations={[0, 0.55, 1]}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        <Text style={styles.blockText}>{b.word}</Text>
                        {/* Thick bottom edge — the brick has physical depth. */}
                        <View style={styles.brickEdge} pointerEvents="none" />
                      </View>
                    </View>
                  </Animated.View>
                </DragPiece>
              );
            })}
          </View>
          <Text style={styles.trayHint}>{carried !== null ? 'Drop it in the next space' : 'Drag the words up in order'}</Text>
        </LinearGradient>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  pictureCast: {
    borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.22, shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 }, elevation: 9,
  },
  picture: {
    width: 132, height: 132, borderRadius: llRadius.xxl, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  pictureEmoji: { fontSize: 62 },
  hearChip: {
    marginTop: 2, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99,
    backgroundColor: withAlpha(ll.pink, 0.14),
  },
  hear: { ...llType.tiny, color: ll.pinkDeep },

  railCast: {
    alignSelf: 'stretch', marginTop: 24, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 4,
  },
  railCastDone: { shadowColor: ll.green, shadowOpacity: 0.28, shadowRadius: 26 },
  rail: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
    gap: 6, minHeight: 72, paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: llRadius.xl, overflow: 'hidden',
  },
  railDone: { borderWidth: 2, borderColor: ll.greenLight },

  slot: {
    width: 62, borderRadius: llRadius.sm, borderWidth: 2, borderStyle: 'dashed',
    borderColor: ll.lilac, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  slotNext: { borderColor: ll.pink, backgroundColor: withAlpha(ll.pink, 0.09) },
  capCue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: withAlpha(ll.pinkDeep, 0.55) },

  blockCast: {
    borderRadius: llRadius.sm,
    shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  block: {
    minWidth: 62, borderRadius: llRadius.sm, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  blockText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.22)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  stop: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40, color: ll.muted },
  stopDone: { color: ll.greenDeep },

  trayWrap: { alignSelf: 'stretch', marginTop: 'auto', paddingTop: 22 },
  tray: {
    borderRadius: llRadius.sheet, paddingTop: 16, paddingBottom: 14,
    paddingHorizontal: 14, overflow: 'hidden', alignItems: 'center',
  },
  trayRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  socket: {
    minWidth: 76, borderRadius: llRadius.sm,
    backgroundColor: withAlpha('#5E4AA8', 0.1),
    borderTopWidth: 1, borderTopColor: withAlpha('#46328C', 0.1),
  },
  trayCast: {
    borderRadius: llRadius.sm,
    shadowOpacity: 0.38, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  trayCastLifted: { shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 10 },
  trayCastHint: { shadowColor: ll.amber, shadowOpacity: 0.6, shadowRadius: 18 },
  trayBlock: {
    minWidth: 76, borderRadius: llRadius.sm, paddingHorizontal: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  brickEdge: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
    backgroundColor: 'rgba(46,42,99,0.22)',
  },
  hint: { borderWidth: 3, borderColor: ll.amber },
  trayHint: {
    marginTop: 12, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.purpleDeep, textTransform: 'uppercase', opacity: 0.7,
  },
});
