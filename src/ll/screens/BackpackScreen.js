import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, ITEMS, TOTAL_ROUNDS } from '../games/backpackData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Pack the Backpack" — My School (Grade 1).
//
// Tap things in and out of the bag, then zip it to check against today's
// plan.
//
// This is the one game with no single right answer per tap — it's a *set*
// you assemble and then commit. So the screen makes the set visible: the bag
// is drawn open with a real compartment, and packed items sit inside it as
// objects rather than as a line of emoji. Taking something out is as easy as
// putting it in, and the tray shows an empty socket where a packed item was,
// so at a glance the child can see what's still on the desk.
//
// The plan card is the brief, and it stays legible the whole time — a child
// who forgets what today is can't pack for it. The zip button only reads as
// ready when the bag has something in it.
export default function BackpackScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-school', subjectId: 'EVS', standardId: 'Grade 1', title: 'My School' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [packed, setPacked] = useState([]);
  // Presentation-only: the item that just went in, for the pop.
  const [justIn, setJustIn] = useState(null);
  const flap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPacked([]);
    setJustIn(null);
    flap.setValue(0);
    flow.say(`Today is ${round.plan}. Pack your bag!`);
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged pack logic.
  function toggle(id) {
    const isIn = packed.includes(id);
    setPacked(isIn ? packed.filter((p) => p !== id) : [...packed, id]);
    setJustIn(isIn ? null : id);
    // The flap lifts a little whenever the bag changes.
    Animated.sequence([
      Animated.timing(flap, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(flap, { toValue: 0, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  }

  function zip() {
    const extra = packed.find((id) => !round.needed.includes(id));
    const missing = round.needed.filter((id) => !packed.includes(id));
    if (!extra && missing.length === 0) {
      flow.succeed(`All packed for ${round.plan}!`);
    } else if (extra) {
      flow.missOn('zip', `We don't need the ${ITEMS[extra].label} for ${round.plan}.`);
    } else {
      flow.missOn('zip', `Something is missing. ${missing.length === 1 ? 'One thing' : `${missing.length} things`} still need packing.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const flapLift = flap.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const ready = packed.length > 0;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Pack the bag for today">
      {/* TODAY'S PLAN — the brief, always readable. --------------------- */}
      <View style={styles.planCast}>
        <LinearGradient colors={['#F1FBF5', '#E1F4E9']} style={[styles.plan, llRing.light]}>
          <TopHighlight radius={llRadius.lg} />
          <Text style={styles.planLabel}>TODAY</Text>
          <Text style={styles.planText}>{round.plan}</Text>
        </LinearGradient>
      </View>

      {/* THE BAG --------------------------------------------------------- */}
      <View style={styles.bagWrap}>
        <View style={styles.bagCast}>
          {/* Straps behind the body. */}
          <View style={[styles.strap, styles.strapLeft]} pointerEvents="none" />
          <View style={[styles.strap, styles.strapRight]} pointerEvents="none" />

          <LinearGradient colors={['#7FC5E8', '#3E92C4']} style={[styles.bag, { width: compact ? 210 : 236 }]}>
            <Sheen variant="tile" radius={llRadius.xl} />

            {/* Open compartment: packed things sit in here. */}
            <View style={styles.mouth}>
              {packed.length ? (
                <View style={styles.packedRow}>
                  {packed.map((id) => {
                    const tile = (
                      <View key={id} style={styles.packedItem}>
                        <GameObject id={id} emoji={ITEMS[id].emoji} size={26} />
                      </View>
                    );
                    return justIn === id ? <Pop key={id} from={0.4}>{tile}</Pop> : tile;
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>Bag is empty</Text>
              )}
            </View>

            {/* Front pocket with a zip pull. */}
            <Animated.View style={[styles.flap, { transform: [{ translateY: flapLift }] }]} pointerEvents="none">
              <View style={styles.zipLine} />
              <View style={styles.zipPull} />
            </Animated.View>
          </LinearGradient>
        </View>

        <Text style={styles.bagCount}>
          {packed.length === 0 ? 'Tap things to pack them' : `${packed.length} packed · tap again to take out`}
        </Text>
      </View>

      {/* THE DESK -------------------------------------------------------- */}
      <View style={styles.tray}>
        {round.tray.map((item) => {
          const isPacked = packed.includes(item.id);
          return (
            <View key={`${flow.index}-${item.id}`} style={styles.slotWrap}>
              {/* An empty socket shows what left the desk. */}
              {isPacked ? <View style={[styles.socket, compact && { width: 92, height: 88 }]} /> : null}
              <Choice
                flow={flow}
                id={item.id}
                isAnswer={round.needed.includes(item.id) && !isPacked}
                selected={isPacked}
                onPress={() => toggle(item.id)}
                style={[styles.item, compact && { width: 92, height: 88 }, isPacked && styles.itemPacked]}
                accessibilityLabel={`${item.label}${isPacked ? ', packed' : ''}`}
              >
                <GameObject id={item.id} emoji={item.emoji} size={40} accessibilityLabel={item.label} />
                <Text style={choiceText.small}>{item.label}</Text>
                {isPacked ? (
                  <View style={styles.inBadge}>
                    <Text style={styles.inBadgeText}>IN</Text>
                  </View>
                ) : null}
              </Choice>
            </View>
          );
        })}
      </View>

      <Choice
        flow={flow}
        id="zip"
        label="Zip it! 🤐"
        onPress={zip}
        style={[styles.zip, ready && styles.zipReady]}
      />
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  planCast: {
    alignSelf: 'stretch', borderRadius: llRadius.lg,
    shadowColor: '#3F9A6C', shadowOpacity: 0.18, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 4,
  },
  plan: {
    padding: 12, borderRadius: llRadius.lg, alignItems: 'center', overflow: 'hidden',
  },
  planLabel: { ...llType.eyebrow, color: ll.greenDeep },
  planText: { ...llType.cardTitle, color: ll.ink, textAlign: 'center' },

  bagWrap: { alignItems: 'center', marginTop: 16 },
  bagCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#2A6B92', shadowOpacity: 0.32, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  strap: {
    position: 'absolute', top: -10, width: 16, height: 30, borderRadius: 8,
    backgroundColor: '#2F7FA8',
  },
  strapLeft: { left: 30 },
  strapRight: { right: 30 },
  bag: {
    borderRadius: llRadius.xl, paddingTop: 12, paddingBottom: 10, paddingHorizontal: 12,
    overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  mouth: {
    minHeight: 58, borderRadius: llRadius.md, padding: 7,
    backgroundColor: 'rgba(20,50,80,0.24)',
    borderWidth: 1.5, borderColor: 'rgba(20,50,80,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  packedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  packedItem: {
    width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  emptyText: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.75)',
  },
  flap: {
    marginTop: 9, height: 26, borderRadius: llRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  zipLine: {
    position: 'absolute', left: 10, right: 10, height: 2, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  zipPull: {
    width: 12, height: 12, borderRadius: 4, backgroundColor: ll.amber,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  bagCount: {
    marginTop: 8, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.1, color: ll.greenDeep, textTransform: 'uppercase', opacity: 0.75,
  },

  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
  slotWrap: { position: 'relative' },
  socket: {
    position: 'absolute', width: 100, height: 96, borderRadius: llRadius.lg,
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha('#8B86B8', 0.4),
  },
  item: { width: 100, height: 96 },
  itemPacked: { opacity: 0.96 },
  inBadge: {
    position: 'absolute', top: 5, right: 5, paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 99, backgroundColor: ll.purple,
  },
  inBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8, letterSpacing: 0.8, color: ll.white },

  zip: { marginTop: 18, minWidth: 180, backgroundColor: '#DCE8E2' },
  zipReady: { backgroundColor: ll.greenLight },
});
