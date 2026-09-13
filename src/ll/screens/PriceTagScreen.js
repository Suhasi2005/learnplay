import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pop } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/priceTagData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Price Tag Shop" — Numbers up to 100 (Senior KG).
//
// Three toys on a shelf, each with a swinging price tag. The shopkeeper
// either names a price ("find the one that costs 47") or asks which is most
// expensive. A wrong tap reads that tag's number back, which is the actual
// lesson: "that one is seventy-four".
export default function PriceTagScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ma-numbers100', subjectId: 'Math', standardId: 'Senior KG', title: 'Numbers up to 100' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [bought, setBought] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const lift = useRef(new Animated.Value(0)).current;

  const prompt = round.kind === 'find' ? `Buy the toy that costs ₹${round.answer}` : 'Which toy costs the most?';

  useEffect(() => {
    setBought(null);
    setWrongId(null);
    lift.setValue(0);
    flow.say(round.kind === 'find' ? `Find the toy that costs ${round.answer} rupees.` : 'Which toy costs the most?');
  }, [flow.index]);

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

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      <View style={styles.shop}>
        <View style={styles.awning}>
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={[styles.stripe, { backgroundColor: i % 2 ? ll.white : ll.pinkLight }]} />
          ))}
        </View>

        <View style={styles.shelf}>
          {round.items.map((item, i) => {
            const isBought = bought?.id === item.id;
            const isHint = flow.hinting && item.price === round.answer && !bought;
            const liftStyle = isBought
              ? { transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                  { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }
              : null;
            return (
              <Animated.View key={`${flow.index}-${item.id}`} style={[liftStyle, wrongId === item.id && { transform: [{ translateX: flow.shakeX }] }]}>
                <Pressable
                  onPress={() => handleTap(item)}
                  disabled={flow.isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={`Toy costing ${item.price} rupees`}
                  style={({ pressed }) => [styles.item, isHint && styles.hint, pressed && styles.pressed]}
                >
                  <Text style={styles.toy}>{item.toy}</Text>
                  <View style={styles.string} />
                  <View style={[styles.tag, { transform: [{ rotate: `${(i - 1) * 6}deg` }] }, isBought && styles.tagPaid]}>
                    <View style={styles.hole} />
                    <Text style={[styles.price, isBought && { color: ll.white }]}>₹{item.price}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
        <View style={styles.plank} />
      </View>

      <View style={styles.basket}>
        <Text style={styles.basketEmoji}>🧺</Text>
        {bought ? (
          <Pop from={0.3} style={styles.inBasket}>
            <Text style={styles.inBasketToy}>{bought.toy}</Text>
          </Pop>
        ) : (
          <Text style={styles.basketHint}>Your basket</Text>
        )}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  shop: { alignSelf: 'stretch', backgroundColor: ll.white, borderRadius: llRadius.xxl, overflow: 'hidden', ...llShadow.card },
  awning: { flexDirection: 'row', height: 26 },
  stripe: { flex: 1 },
  shelf: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 22, paddingHorizontal: 8 },
  item: { alignItems: 'center', width: 96, paddingBottom: 12, borderRadius: llRadius.lg, borderWidth: 3, borderColor: 'transparent' },
  toy: { fontSize: 52 },
  string: { width: 2, height: 12, backgroundColor: ll.muted },
  tag: {
    minWidth: 70, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: ll.amberSoft,
    borderWidth: 2, borderColor: ll.amber, alignItems: 'center',
  },
  tagPaid: { backgroundColor: ll.green, borderColor: ll.greenDeep },
  hole: { width: 7, height: 7, borderRadius: 4, backgroundColor: ll.white, borderWidth: 1.5, borderColor: ll.amber, marginBottom: 2 },
  price: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28, color: ll.ink },
  plank: { height: 14, backgroundColor: '#E2C9A6', borderTopWidth: 3, borderTopColor: '#CDAE86' },
  hint: { borderColor: ll.amber },
  pressed: { opacity: 0.85 },

  basket: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26, backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: llRadius.pill, paddingVertical: 8, paddingHorizontal: 20, minWidth: 190, justifyContent: 'center',
  },
  basketEmoji: { fontSize: 38 },
  basketHint: { ...llType.body, color: ll.muted },
  inBasket: { width: 52, height: 52, borderRadius: 26, backgroundColor: ll.greenLight, alignItems: 'center', justifyContent: 'center' },
  inBasketToy: { fontSize: 30 },
});
