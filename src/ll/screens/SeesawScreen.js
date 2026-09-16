import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import DragPiece, { Puff } from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/seesawData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Seesaw Balance" — Addition & Subtraction (Senior KG).
//
// The sum sits on the left seat as real fruit; the right seat is empty, so
// the plank starts tipped left. Loading a weight on the right settles the
// plank: too few and the left stays down, too many and the right crashes
// down, exactly right and it levels out.
//
// The seesaw *is* the feedback, so this screen's job is to make the physics
// legible. Three things do that:
//
//  - A spirit-level bubble on the plank. It slides to the low end and only
//    centres when the beam is level, which turns "balanced" from a colour
//    change into an instrument reading.
//  - The seats are baskets that hang from the beam and swing as it tips,
//    with the fruit stacked at slight angles rather than in a neat grid.
//  - A "too light / too heavy" arrow appears on the low side. A child who
//    can't yet read the spoken hint can still see which way to adjust.
//
// Weights are dragged onto the right basket, which is what makes it feel
// like loading a scale rather than picking an option. Tapping still works.
const TILT = 9;

// The fruit on a seat. Stacked with small alternating rotations so a pile of
// six apples looks like a pile, not a spreadsheet.
function FruitPile({ fruit, count, crossed = 0 }) {
  return (
    <View style={styles.pile}>
      {Array.from({ length: count }, (_, i) => {
        const gone = i >= count - crossed;
        return (
          <Text
            key={i}
            style={[
              styles.fruit,
              { transform: [{ rotate: `${((i % 3) - 1) * 8}deg` }] },
              gone && styles.fruitGone,
            ]}
          >
            {fruit}
          </Text>
        );
      })}
    </View>
  );
}

export default function SeesawScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-addsub', subjectId: 'Math', standardId: 'Senior KG', title: 'Addition & Subtraction' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [chosen, setChosen] = useState(null);
  const [wrongPick, setWrongPick] = useState(null);
  // Presentation-only: which weight is in the child's hand.
  const [carried, setCarried] = useState(null);
  const tilt = useRef(new Animated.Value(-TILT)).current;
  const basketSwing = useRef(new Animated.Value(0)).current;

  const opWord = round.op === '+' ? 'plus' : 'take away';
  const sign = round.op === '+' ? '+' : '−';

  useEffect(() => {
    setChosen(null);
    setWrongPick(null);
    setCarried(null);
    Animated.spring(tilt, { toValue: -TILT, friction: 6, useNativeDriver: true }).start();
    flow.say(`${round.a} ${opWord} ${round.b}. Balance the seesaw!`);
  }, [flow.index]);

  // Baskets keep swinging a moment after the beam stops — the weight has
  // momentum the beam doesn't.
  function swingBaskets() {
    basketSwing.setValue(0);
    Animated.sequence([
      Animated.timing(basketSwing, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(basketSwing, { toValue: 0, friction: 3, tension: 70, useNativeDriver: true }),
    ]).start();
  }

  function settle(to) {
    Animated.spring(tilt, { toValue: to, friction: 4, tension: 60, useNativeDriver: true }).start();
    swingBaskets();
  }

  // ---------------------------------------------------------------------
  // Unchanged round logic.
  function handlePick(n) {
    if (flow.isProcessing) return;
    setChosen(n);
    if (n === round.answer) {
      settle(0);
      flow.succeed(`${round.a} ${opWord} ${round.b} is ${round.answer}. Balanced!`, { hold: 1500 });
    } else if (n < round.answer) {
      settle(-TILT);
      setWrongPick(n);
      flow.miss(`${n} is too light. Try a bigger number!`);
      flow.later(() => setWrongPick(null), 420);
    } else {
      settle(TILT);
      setWrongPick(n);
      flow.miss(`${n} is too heavy. Try a smaller number!`);
      flow.later(() => setWrongPick(null), 420);
    }
  }
  // ---------------------------------------------------------------------

  const rotate = tilt.interpolate({ inputRange: [-TILT, TILT], outputRange: [`-${TILT}deg`, `${TILT}deg`] });
  // Baskets hang vertically, so they counter-rotate against the beam.
  const hang = tilt.interpolate({ inputRange: [-TILT, TILT], outputRange: [`${TILT}deg`, `-${TILT}deg`] });
  const swing = basketSwing.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '5deg'] });
  // The spirit-level bubble rides to the low end.
  const bubbleX = tilt.interpolate({ inputRange: [-TILT, 0, TILT], outputRange: [-46, 0, 46] });

  const balanced = flow.isProcessing && chosen === round.answer;
  const tooLight = chosen !== null && !balanced && chosen < round.answer;
  const tooHeavy = chosen !== null && !balanced && chosen > round.answer;

  const compact = width < 360;
  const rigW = Math.min(width - 36, 330);
  const seatW = rigW * 0.4;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt="Make the seesaw balance">
      {/* THE EQUATION ---------------------------------------------------- */}
      <View style={styles.eqCast}>
        <LinearGradient colors={llSurface.whiteBlue} style={[styles.equation, llRing.faint]}>
          <TopHighlight radius={llRadius.pill} />
          <Text style={styles.eqText}>{round.a} {sign} {round.b} =</Text>
          <LinearGradient
            colors={balanced ? [ll.greenLight, ll.greenDeep] : [ll.blueSoft, '#DCE8FF']}
            style={styles.eqAnswer}
          >
            <Text style={[styles.eqText, balanced && { color: ll.white }]}>{chosen ?? '?'}</Text>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* THE RIG --------------------------------------------------------- */}
      <View style={[styles.rig, { width: rigW, height: compact ? 186 : 208 }]}>
        <Animated.View style={[styles.plankWrap, { width: rigW, transform: [{ rotate }] }]}>
          {/* Hanging baskets. They counter-rotate so they stay upright. */}
          <View style={styles.seats}>
            <Animated.View style={{ transform: [{ rotate: hang }, { rotate: swing }] }}>
              <Basket width={seatW} tone="left">
                <FruitPile
                  fruit={round.fruit}
                  count={round.a + (round.op === '+' ? round.b : 0)}
                  crossed={round.op === '-' ? round.b : 0}
                />
              </Basket>
            </Animated.View>

            <Animated.View style={{ transform: [{ rotate: hang }, { rotate: swing }] }}>
              <Basket width={seatW} tone="right" armed={carried !== null && chosen === null}>
                {chosen === null
                  ? <Text style={styles.empty}>?</Text>
                  : <FruitPile fruit={round.fruit} count={chosen} />}
                {balanced ? <Puff key={`balance-${flow.index}`} size={30} delay={120} style={{ bottom: 4 }} /> : null}
              </Basket>
            </Animated.View>
          </View>

          {/* The beam, with a spirit level set into it. */}
          <View style={styles.beamWrap}>
            <LinearGradient
              colors={balanced ? [ll.greenLight, ll.greenDeep] : [ll.purpleLight, ll.purpleDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.plank}
            >
              <View style={styles.plankGrain} pointerEvents="none" />
              <View style={styles.level} pointerEvents="none">
                <Animated.View style={[styles.levelBubble, balanced && styles.levelBubbleOk, { transform: [{ translateX: bubbleX }] }]} />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Fulcrum: a shaded post rather than a flat triangle. */}
        <View style={styles.fulcrumWrap}>
          <LinearGradient colors={[ll.purpleLight, ll.purpleDeep]} style={styles.fulcrum}>
            <Sheen variant="tile" />
          </LinearGradient>
          <View style={styles.fulcrumBase} />
        </View>
        <View style={styles.ground} pointerEvents="none" />

        {/* Which way to adjust. */}
        {tooLight ? <Text style={[styles.cue, styles.cueLeft]}>needs more ↑</Text> : null}
        {tooHeavy ? <Text style={[styles.cue, styles.cueRight]}>too heavy ↓</Text> : null}
      </View>

      {/* THE WEIGHTS ----------------------------------------------------- */}
      <View style={styles.options}>
        {round.options.map((n) => {
          const isWrong = wrongPick === n;
          const isHint = flow.hinting && n === round.answer;
          return (
            <DragPiece
              key={`${flow.index}-${n}`}
              direction="up"
              threshold={40}
              disabled={flow.isProcessing}
              accessibilityLabel={`${n}`}
              onLift={() => setCarried(n)}
              onDrop={(placedNow) => {
                setCarried(null);
                if (placedNow) handlePick(n);
              }}
            >
              <Animated.View style={isWrong ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
                <View
                  style={[
                    styles.weightCast,
                    carried === n && styles.weightCastLifted,
                    isHint && styles.weightCastHint,
                  ]}
                >
                  <LinearGradient
                    colors={[ll.blueLight, ll.blueDeep]}
                    style={[styles.weight, { width: compact ? 70 : 78, height: compact ? 70 : 78 }, isHint && styles.hint]}
                  >
                    <Sheen variant="strong" radius={40} />
                    {/* The grab handle across the top of the weight. */}
                    <View style={styles.weightHandle} pointerEvents="none" />
                    <Text style={styles.weightText}>{n}</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            </DragPiece>
          );
        })}
      </View>
      <Text style={styles.hint2}>{carried !== null ? 'Drop it on the seesaw' : 'Drag a weight onto the seesaw'}</Text>
    </GameFrame>
  );
}

// A woven basket hanging from the beam.
function Basket({ width, children, tone, armed = false }) {
  return (
    <View style={styles.basketWrap}>
      {/* Two ropes up to the beam. */}
      <View style={[styles.ropes, { width: width * 0.62 }]} pointerEvents="none">
        <View style={styles.rope} />
        <View style={styles.rope} />
      </View>
      <LinearGradient
        colors={tone === 'left' ? ['#FFFDF8', '#F6EFE2'] : ['#FFFFFF', '#F2F5FF']}
        style={[styles.basket, { width }, armed && styles.basketArmed]}
      >
        <Sheen variant="trough" radius={llRadius.lg} />
        {children}
        <View style={styles.weave} pointerEvents="none" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  eqCast: {
    borderRadius: llRadius.pill,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  equation: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: llRadius.pill,
    paddingVertical: 6, paddingLeft: 22, paddingRight: 6, overflow: 'hidden',
  },
  eqText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: ll.ink },
  eqAnswer: {
    minWidth: 52, height: 48, borderRadius: 24, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 10, overflow: 'hidden',
  },

  rig: { alignItems: 'center', justifyContent: 'flex-end', marginTop: 20 },
  plankWrap: { alignItems: 'stretch', marginBottom: 2 },
  seats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 4 },

  basketWrap: { alignItems: 'center' },
  ropes: { flexDirection: 'row', justifyContent: 'space-between', height: 14 },
  rope: { width: 2, height: 14, backgroundColor: withAlpha('#6B5FA8', 0.5) },
  basket: {
    minHeight: 80, borderTopLeftRadius: 10, borderTopRightRadius: 10,
    borderBottomLeftRadius: llRadius.lg, borderBottomRightRadius: llRadius.lg,
    alignItems: 'center', justifyContent: 'center', padding: 7, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  basketArmed: { borderWidth: 2, borderColor: ll.blue },
  weave: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 14,
    backgroundColor: withAlpha('#8B7ED0', 0.16),
    borderTopWidth: 1, borderTopColor: withAlpha('#8B7ED0', 0.24),
  },

  pile: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  fruit: { fontSize: 20, lineHeight: 25, width: 23, textAlign: 'center' },
  fruitGone: { opacity: 0.22 },
  empty: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: ll.muted },

  beamWrap: {
    borderRadius: 8,
    shadowColor: '#4A3A96', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  plank: { height: 16, borderRadius: 8, overflow: 'hidden', justifyContent: 'center' },
  plankGrain: {
    position: 'absolute', left: 0, right: 0, top: 4, height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  level: {
    alignSelf: 'center', width: 104, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(20,10,60,0.24)', alignItems: 'center', justifyContent: 'center',
  },
  levelBubble: { width: 12, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)' },
  levelBubbleOk: { backgroundColor: ll.white, width: 16 },

  fulcrumWrap: { alignItems: 'center' },
  fulcrum: {
    width: 42, height: 44, overflow: 'hidden',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderBottomLeftRadius: 6, borderBottomRightRadius: 6,
  },
  fulcrumBase: {
    width: 76, height: 10, borderRadius: 5, marginTop: -2,
    backgroundColor: ll.purpleDeep,
  },
  ground: {
    position: 'absolute', bottom: 0, left: 10, right: 10, height: 3,
    borderRadius: 3, backgroundColor: withAlpha('#6B5FA8', 0.22),
  },

  cue: {
    position: 'absolute', bottom: 18, fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11, letterSpacing: 0.6, color: ll.pinkDeep,
  },
  cueLeft: { left: 6 },
  cueRight: { right: 6 },

  options: { flexDirection: 'row', gap: 16, marginTop: 24 },
  weightCast: {
    borderRadius: 40,
    shadowColor: ll.blueDeep, shadowOpacity: 0.42, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 6,
  },
  weightCastLifted: { shadowOpacity: 0.6, shadowRadius: 26, shadowOffset: { width: 0, height: 18 }, elevation: 11 },
  weightCastHint: { shadowColor: ll.amber, shadowOpacity: 0.7, shadowRadius: 20 },
  weight: {
    borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 5, borderBottomColor: withAlpha('#22408C', 0.55),
  },
  weightHandle: {
    position: 'absolute', top: 9, width: 30, height: 7, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  weightText: {
    ...llType.h2, color: ll.white, marginTop: 6,
    textShadowColor: 'rgba(20,10,60,0.3)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 },
  },
  hint: { borderWidth: 3, borderColor: ll.amber },
  hint2: {
    marginTop: 12, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.blueDeep, textTransform: 'uppercase', opacity: 0.7,
  },
});
