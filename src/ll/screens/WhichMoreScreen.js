import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/whichMoreData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Which Has More?" — Pre-Number Concepts (Grade 1).
//
// Compare groups (more/fewer), sizes (tallest/shortest/biggest), and match a
// group with the same number.
//
// The teaching device is one-to-one alignment. Comparing groups *without
// counting* is the whole point of this chapter, and the way you do that is by
// pairing items off: line the two groups up in matching columns and the
// leftover ones are the difference, visible without a single number. So group
// items are laid out on a fixed five-column grid rather than wrapped
// free-form — 7 vs 8 can't be judged by glance, but it can be judged by
// which column still has something in it.
//
// Size rounds get a shared baseline and a dashed height guide across the top
// of the tallest, because "tallest" is meaningless unless the things being
// compared start from the same floor.
function Group({ emoji, count, size = 22, tint }) {
  // Fixed 5-wide grid: the same count always occupies the same cells, so two
  // groups can be read against each other column by column.
  return (
    <View style={styles.grid}>
      {Array.from({ length: 10 }, (_, i) => (
        <View key={i} style={[styles.cell, { width: size + 8, height: size + 6 }]}>
          {i < count ? (
            <GameObject emoji={emoji} size={size} />
          ) : (
            <View style={[styles.emptyCell, { borderColor: withAlpha(tint ?? ll.blue, 0.16) }]} />
          )}
        </View>
      ))}
    </View>
  );
}

function promptFor(round) {
  if (round.kind === 'compare') return `Which has ${round.ask}?`;
  if (round.kind === 'size') return `Which is the ${round.ask}?`;
  return 'Which group has the same number?';
}

export default function WhichMoreScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-prenum', subjectId: 'Math', standardId: 'Grade 1', title: 'Pre-Number Concepts' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const prompt = promptFor(round);

  useEffect(() => { flow.say(prompt); }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(option) {
    if (option.id === round.answerId) {
      if (round.kind === 'compare') flow.succeed(`Yes! ${option.count} is ${round.ask} than the other group.`);
      else if (round.kind === 'size') flow.succeed(`Yes! That one is the ${round.ask}.`);
      else flow.succeed(`Yes! Both groups have ${round.n}.`);
    } else if (round.kind === 'size') {
      flow.missOn(option.id, `Look again. Which one is the ${round.ask}?`);
    } else {
      flow.missOn(option.id, `That group has ${option.count}. Count again!`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const itemSize = compact ? 19 : 22;
  const isSize = round.kind === 'size';

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE TARGET (same-number rounds). ------------------------------- */}
      {round.kind === 'same' ? (
        <View style={styles.targetCast}>
          <LinearGradient colors={llSurface.whiteBlue} style={[styles.target, llRing.faint]}>
            <TopHighlight radius={llRadius.xl} />
            <Sheen variant="tile" radius={llRadius.xl} />
            <Text style={styles.targetLabel}>MATCH THIS GROUP</Text>
            <Group emoji={round.emoji} count={round.n} size={compact ? 22 : 26} />
          </LinearGradient>
        </View>
      ) : null}

      {/* Size rounds: a dashed guide at the height of the tallest. ------ */}
      {isSize ? (
        <View style={styles.guideWrap} pointerEvents="none">
          <View style={styles.guideLine} />
          <Text style={styles.guideLabel}>tallest</Text>
        </View>
      ) : null}

      <View style={[styles.options, isSize && styles.optionsSize]}>
        {round.options.map((option) => (
          <Choice
            key={option.id}
            flow={flow}
            id={option.id}
            isAnswer={option.id === round.answerId}
            onPress={() => pick(option)}
            style={[
              styles.card,
              round.kind === 'compare' && (compact ? styles.cardWideCompact : styles.cardWide),
              isSize && styles.cardTall,
            ]}
            accessibilityLabel={isSize ? 'picture' : `group of ${option.count}`}
          >
            {isSize ? (
              <>
                <GameObject emoji={round.emoji} size={(compact ? 72 : 84) * option.scale} />
                {/* Everything stands on the same floor, or "tallest" means
                    nothing. */}
                <View style={styles.floor} pointerEvents="none" />
              </>
            ) : (
              <Group emoji={round.emoji} count={option.count} size={itemSize} />
            )}
          </Choice>
        ))}
      </View>

      {/* The pairing hint, spelled out once per compare round. ---------- */}
      {round.kind === 'compare' ? (
        <Text style={styles.pairHint}>Match them up — which one has some left over?</Text>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  targetCast: {
    marginBottom: 20, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  target: {
    borderRadius: llRadius.xl, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', overflow: 'hidden',
  },
  targetLabel: { ...llType.eyebrow, color: ll.blueInk, marginBottom: 8 },

  // 5 columns × 2 rows. Empty cells stay drawn so two groups align.
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 150 },
  cell: { alignItems: 'center', justifyContent: 'center' },
  emptyCell: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderStyle: 'dashed',
  },

  guideWrap: { alignSelf: 'stretch', alignItems: 'flex-end', marginBottom: -6, paddingRight: 4 },
  guideLine: {
    alignSelf: 'stretch', height: 1.5, borderRadius: 2,
    borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withAlpha(ll.blue, 0.45),
  },
  guideLabel: {
    marginTop: 2, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 1.1, color: ll.blueDeep, opacity: 0.8, textTransform: 'uppercase',
  },

  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 12 },
  optionsSize: { alignItems: 'flex-end' },
  card: { width: 110, minHeight: 110 },
  cardWide: { width: 172, minHeight: 132 },
  cardWideCompact: { width: 150, minHeight: 124 },
  cardTall: { height: 156, justifyContent: 'flex-end', paddingBottom: 0 },
  floor: {
    alignSelf: 'stretch', height: 4, marginTop: 4,
    borderRadius: 2, backgroundColor: withAlpha(ll.blue, 0.22),
  },

  pairHint: {
    marginTop: 14, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.2, color: ll.blueDeep, textTransform: 'uppercase', opacity: 0.72,
  },
});
