import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pop } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/shapeDetectiveData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Shape Detective" — Shapes (Senior KG).
//
// A 3×3 board of shapes in mixed sizes and colours. The detective is told
// what to find and how many; each find gets a magnifier ring. The board
// always plants the target's look-alike, so the child has to check the
// property (all sides equal? perfectly round?) rather than the silhouette.
const BASE = 62;

export function ShapeDrawing({ shape, color, scale = 1 }) {
  const s = BASE * scale;
  switch (shape) {
    case 'circle':
      return <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: color }} />;
    case 'oval':
      return <View style={{ width: s, height: s * 0.6, borderRadius: s / 2, backgroundColor: color }} />;
    case 'square':
      return <View style={{ width: s * 0.84, height: s * 0.84, borderRadius: 5, backgroundColor: color }} />;
    case 'rectangle':
      return <View style={{ width: s, height: s * 0.52, borderRadius: 5, backgroundColor: color }} />;
    case 'triangle':
      return (
        <View
          style={{
            width: 0, height: 0, backgroundColor: 'transparent',
            borderLeftWidth: s / 2, borderRightWidth: s / 2, borderBottomWidth: s * 0.87,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
          }}
        />
      );
    default:
      return null;
  }
}

export default function ShapeDetectiveScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-shapes', subjectId: 'Math', standardId: 'Senior KG', title: 'Shapes' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [found, setFound] = useState([]);
  const [wrongId, setWrongId] = useState(null);

  const plural = `${round.target}s`;

  useEffect(() => {
    setFound([]);
    setWrongId(null);
    flow.say(`Detective! Find ${round.count} ${plural}.`);
  }, [flow.index]);

  function handleTap(cell) {
    if (flow.isProcessing || found.includes(cell.id)) return;
    if (cell.shape === round.target) {
      const next = [...found, cell.id];
      setFound(next);
      if (next.length === round.count) {
        flow.succeed(`Case closed! You found all the ${plural}.`, { hold: 1300 });
      } else {
        flow.cheer(`That's a ${round.target}!`);
      }
    } else {
      setWrongId(cell.id);
      flow.miss(`That's a ${cell.shape}. Look for a ${round.target}.`);
      flow.later(() => setWrongId(null), 420);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={`Find ${round.count} ${plural}`}>
      <View style={styles.caseRow}>
        <View style={styles.clue}>
          <ShapeDrawing shape={round.target} color={ll.ink} scale={0.42} />
        </View>
        <Text style={styles.caseText}>🔍 Found {found.length} of {round.count}</Text>
      </View>

      <View style={styles.board}>
        {round.cells.map((cell) => {
          const isFound = found.includes(cell.id);
          const isHint = flow.hinting && !isFound && cell.shape === round.target;
          return (
            <Animated.View key={`${flow.index}-${cell.id}`} style={wrongId === cell.id && { transform: [{ translateX: flow.shakeX }] }}>
              <Pressable
                onPress={() => handleTap(cell)}
                disabled={flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={isFound ? `${cell.shape}, found` : 'shape'}
                style={({ pressed }) => [styles.cell, isFound && styles.cellFound, isHint && styles.hint, pressed && styles.pressed]}
              >
                <ShapeDrawing shape={cell.shape} color={cell.color} scale={cell.scale} />
                {isFound ? (
                  <Pop style={styles.badge} from={0.3}>
                    <Text style={styles.badgeText}>✓</Text>
                  </Pop>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </GameFrame>
  );
}

const CELL = 96;

const styles = StyleSheet.create({
  caseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ll.white, borderRadius: llRadius.pill,
    paddingVertical: 6, paddingLeft: 6, paddingRight: 16, ...llShadow.soft,
  },
  clue: { width: 40, height: 40, borderRadius: 20, backgroundColor: ll.blueSoft, alignItems: 'center', justifyContent: 'center' },
  caseText: { ...llType.cardTitle, color: ll.blueInk },

  board: {
    flexDirection: 'row', flexWrap: 'wrap', width: CELL * 3 + 10 * 2, gap: 10, marginTop: 22,
  },
  cell: {
    width: CELL, height: CELL, borderRadius: llRadius.lg, backgroundColor: ll.white, alignItems: 'center',
    justifyContent: 'center', borderWidth: 3, borderColor: 'transparent', ...llShadow.soft,
  },
  cellFound: { borderColor: ll.green, backgroundColor: '#EFFAF3' },
  hint: { borderColor: ll.amber },
  pressed: { transform: [{ scale: 0.96 }] },
  badge: {
    position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: ll.green,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: ll.white,
  },
  badgeText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, lineHeight: 20, color: ll.white },
});
