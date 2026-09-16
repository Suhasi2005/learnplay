import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import DragPiece from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/priceTagData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';

// "Price Tag Shop" — Numbers up to 100 (Senior KG).
//
// Three toys on a shelf under a striped awning, each with a price tag
// swinging from a string. The shopkeeper either names a price or asks which
// costs most. The child *puts the toy in the basket* — dragging it down, the
// gesture of actually buying something.
//
// The teaching device is the tens digit. Every price is drawn with its tens
// digit larger and in ink, its ones digit smaller and lighter, with a hairline
// between them. That's the whole difficulty of this topic: 47 and 74 look
// alike until you read the tens first, and the distractors in priceTagData
// are built from exactly that confusion. Making place value *visible* on the
// tag turns a guess into a read.
export default function PriceTagScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-numbers100', subjectId: 'Math', standardId: 'Senior KG', title: 'Numbers up to 100' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [bought, setBought] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  // Presentation-only: the toy currently being carried to the basket.
  const [carried, setCarried] = useState(null);
  const lift = useRef(new Animated.Value(0)).current;
  const swing = useRef(new Animated.Value(0)).current;

  const prompt = round.kind === 'find' ? `Buy the toy that costs ₹${round.answer}` : 'Which toy costs the most?';

  useEffect(() => {
    setBought(null);
    setWrongId(null);
    setCarried(null);
    lift.setValue(0);
    flow.say(round.kind === 'find' ? `Find the toy that costs ${round.answer} rupees.` : 'Which toy costs the most?');
  }, [flow.index]);

  // Tags sway on their strings the whole time — the shop is never static.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(swing, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged purchase logic.
  function handleTap(item) {
    if (flow.isProcessing || bought) return;
    if (item.price === round.answer) {
      setBought(item);
      Animated.timing(lift, { toValue: 1, duration: 450, useNativeDriver: true }).start();
      flow.succeed(
        round.kind === 'find'
          ? `Yes! That one costs ${item.price} rupees.`
          : `Yes! ${item.price} is the biggest number.`,
        { hold: 1400 },
      );
    } else {
      setWrongId(item.id);
      flow.miss(
        round.kind === 'find'
          ? `That one costs ${item.price}. Look for ${round.answer}.`
          : `${item.price} is not the most. Look at the tens!`,
      );
      flow.later(() => setWrongId(null), 420);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const itemW = compact ? 88 : 96;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE SHOP -------------------------------------------------------- */}
      <View style={styles.shopCast}>
        <LinearGradient colors={llSurface.white} style={[styles.shop, llRing.faint]}>
          {/* Scalloped striped awning. */}
          <View style={styles.awning}>
            {Array.from({ length: 7 }, (_, i) => (
              <LinearGradient
                key={i}
                colors={i % 2 ? ['#FFFFFF', '#F6F0FA'] : [ll.pinkLight, ll.pink]}
                style={styles.stripe}
              />
            ))}
            <View style={styles.awningShade} pointerEvents="none" />
          </View>
          <View style={styles.scallops} pointerEvents="none">
            {Array.from({ length: 7 }, (_, i) => (
              <View key={i} style={[styles.scallop, { backgroundColor: i % 2 ? '#F6F0FA' : ll.pink }]} />
            ))}
          </View>

          <View style={styles.shelf}>
            {round.items.map((item, i) => {
              const isBought = bought?.id === item.id;
              const isHint = flow.hinting && item.price === round.answer && !bought;
              const isCarried = carried === item.id;

              const liftStyle = isBought
                ? {
                    transform: [
                      { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                      { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                    ],
                  }
                : null;

              // Each tag sways a little differently.
              const tagRotate = swing.interpolate({
                inputRange: [0, 1],
                outputRange: [`${(i - 1) * 6 - 3}deg`, `${(i - 1) * 6 + 3}deg`],
              });

              return (
                <DragPiece
                  key={`${flow.index}-${item.id}`}
                  direction="down"
                  threshold={44}
                  disabled={flow.isProcessing || !!bought}
                  accessibilityLabel={`Toy costing ${item.price} rupees`}
                  onLift={() => setCarried(item.id)}
                  onDrop={(placedNow) => {
                    setCarried(null);
                    if (placedNow) handleTap(item);
                  }}
                >
                  <Animated.View style={[liftStyle, wrongId === item.id && { transform: [{ translateX: flow.shakeX }] }]}>
                    <View style={[styles.item, { width: itemW }]}>
                      <View style={[styles.toyCast, isCarried && styles.toyCastLifted, isHint && styles.toyCastHint]}>
                        <LinearGradient colors={['#FFFFFF', '#F6F2FF']} style={[styles.toyDisc, isHint && styles.hint]}>
                          <Sheen variant="tile" radius={30} />
                          <TopHighlight radius={30} />
                          <Text style={styles.toy}>{item.toy}</Text>
                        </LinearGradient>
                      </View>

                      <View style={styles.string} />

                      <Animated.View style={{ transform: [{ rotate: tagRotate }] }}>
                        <View style={[styles.tagCast, isBought && styles.tagCastPaid]}>
                          <LinearGradient
                            colors={isBought ? [ll.greenLight, ll.greenDeep] : ['#FFFCF2', '#FFF1CE']}
                            style={[styles.tag, isBought && styles.tagPaid]}
                          >
                            <Sheen variant="tile" radius={10} />
                            <View style={[styles.hole, isBought && styles.holePaid]} />
                            <Price value={item.price} paid={isBought} />
                          </LinearGradient>
                          {/* The tag's pointed left end. */}
                          <View style={[styles.tagPoint, isBought && styles.tagPointPaid]} pointerEvents="none" />
                        </View>
                      </Animated.View>
                    </View>
                  </Animated.View>
                </DragPiece>
              );
            })}
          </View>

          {/* Wooden shelf with a lip and a shadow under it. */}
          <LinearGradient colors={['#EBD5B4', '#D6B78E']} style={styles.plank}>
            <View style={styles.plankLip} pointerEvents="none" />
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* THE BASKET — the drop target. ----------------------------------- */}
      <View style={[styles.basketCast, carried !== null && styles.basketCastArmed]}>
        <LinearGradient
          colors={carried !== null ? ['#FFF4DC', '#FFE6B8'] : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.74)']}
          style={[styles.basket, llRing.light, carried !== null && styles.basketArmed]}
        >
          <Sheen variant="trough" radius={llRadius.pill} />
          <Text style={styles.basketEmoji}>🧺</Text>
          {bought ? (
            <Pop from={0.3} style={styles.inBasket}>
              <Text style={styles.inBasketToy}>{bought.toy}</Text>
            </Pop>
          ) : (
            <Text style={styles.basketHint}>
              {carried !== null ? 'Drop it in!' : 'Drag a toy to your basket'}
            </Text>
          )}
        </LinearGradient>
      </View>
    </GameFrame>
  );
}

// A price with its place value drawn in. The tens digit is bigger and darker
// than the ones digit, with a hairline between them — so "read the tens
// first" is something the tag shows rather than something a child is told.
function Price({ value, paid }) {
  const s = String(value);
  const tens = s.length > 1 ? s.slice(0, -1) : '';
  const ones = s.slice(-1);
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.rupee, paid && styles.priceInkPaid]}>₹</Text>
      {tens ? (
        <>
          <Text style={[styles.tens, paid && styles.priceInkPaid]}>{tens}</Text>
          <View style={[styles.placeDivider, paid && styles.placeDividerPaid]} />
        </>
      ) : null}
      <Text style={[styles.ones, paid && styles.priceInkPaid]}>{ones}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shopCast: {
    alignSelf: 'stretch', borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 }, elevation: 10,
  },
  shop: { borderRadius: llRadius.xxl, overflow: 'hidden' },

  awning: { flexDirection: 'row', height: 28 },
  stripe: { flex: 1 },
  awningShade: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 8,
    backgroundColor: 'rgba(46,42,99,0.12)',
  },
  scallops: { flexDirection: 'row', height: 9, marginTop: -1 },
  scallop: { flex: 1, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, marginHorizontal: 0.5 },

  shelf: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 20, paddingHorizontal: 6 },
  item: { alignItems: 'center', paddingBottom: 10 },

  toyCast: {
    borderRadius: 32,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  toyCastLifted: { shadowOpacity: 0.4, shadowRadius: 26, shadowOffset: { width: 0, height: 18 }, elevation: 11 },
  toyCastHint: { shadowColor: ll.amber, shadowOpacity: 0.6, shadowRadius: 20 },
  toyDisc: {
    width: 64, height: 64, borderRadius: 32, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  toy: { fontSize: 40 },

  string: { width: 2, height: 14, backgroundColor: withAlpha('#6B5FA8', 0.45) },

  tagCast: {
    borderRadius: 10,
    shadowColor: '#96702B', shadowOpacity: 0.26, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  tagCastPaid: { shadowColor: ll.greenDeep, shadowOpacity: 0.45, shadowRadius: 14 },
  tag: {
    minWidth: 72, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 2, borderColor: ll.amber, alignItems: 'center', overflow: 'hidden',
  },
  tagPaid: { borderColor: ll.greenDeep },
  tagPoint: {
    position: 'absolute', left: -5, top: '42%', width: 10, height: 10,
    backgroundColor: '#FFF1CE', borderLeftWidth: 2, borderBottomWidth: 2,
    borderColor: ll.amber, transform: [{ rotate: '45deg' }],
  },
  tagPointPaid: { backgroundColor: ll.greenDeep, borderColor: ll.greenDeep },
  hole: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: ll.white,
    borderWidth: 1.5, borderColor: ll.amber, marginBottom: 2,
  },
  holePaid: { borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.4)' },

  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  rupee: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.amberInk, marginRight: 1 },
  // Tens: larger, full ink. Ones: smaller, lighter.
  tens: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, lineHeight: 30, color: ll.ink },
  ones: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 30, color: withAlpha('#2E2A63', 0.62) },
  placeDivider: {
    width: 1, height: 16, marginHorizontal: 2,
    backgroundColor: withAlpha('#96702B', 0.35),
  },
  placeDividerPaid: { backgroundColor: 'rgba(255,255,255,0.5)' },
  priceInkPaid: { color: ll.white },

  plank: { height: 16, borderTopWidth: 3, borderTopColor: '#C9A87E' },
  plankLip: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 5,
    backgroundColor: 'rgba(94,64,24,0.18)',
  },
  hint: { borderWidth: 3, borderColor: ll.amber },

  basketCast: {
    marginTop: 24, borderRadius: llRadius.pill,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 4,
  },
  basketCastArmed: { shadowColor: ll.amber, shadowOpacity: 0.5, shadowRadius: 26, elevation: 9 },
  basket: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: llRadius.pill,
    paddingVertical: 9, paddingHorizontal: 20, minWidth: 200, justifyContent: 'center', overflow: 'hidden',
  },
  basketArmed: { borderWidth: 2, borderColor: ll.amber },
  basketEmoji: { fontSize: 38 },
  basketHint: { ...llType.body, color: ll.muted },
  inBasket: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: ll.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  inBasketToy: { fontSize: 30 },
});
