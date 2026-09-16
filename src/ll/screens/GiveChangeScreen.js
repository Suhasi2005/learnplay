import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/changeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Give the Change" — Money (Grade 1).
//
// Add two prices, work out change from a note, or decide if you can afford
// it. A shop counter with the goods on it and the money beside them.
//
// The teaching device is the bar. Under every round a single strip shows the
// amounts to scale: two segments butted together for a total, the price
// filling part of the note for change, the wallet against the price for
// afford. Money problems at this age fail because "change" is an abstraction
// — seeing ₹30 sitting inside ₹50, with the gap left over, makes the answer
// something you can point at before you can subtract it.
//
// The note is also drawn as a real banknote and the change round labels the
// gap, because the planted mistake in changeData is answering with the price
// instead of the change.
function PriceCard({ emoji, label, price, compact }) {
  return (
    <View style={styles.itemCast}>
      <LinearGradient colors={llSurface.white} style={[styles.item, { width: compact ? 100 : 112 }, llRing.faint]}>
        <Sheen variant="tile" radius={llRadius.xl} />
        <TopHighlight radius={llRadius.xl} />
        <GameObject emoji={emoji} size={34} />
        <Text style={choiceText.small}>{label}</Text>
        <View style={styles.tagWrap}>
          <View style={styles.tagHole} />
          <Text style={styles.tag}>₹{price}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// A banknote, rather than an emoji standing in for one.
function Note({ amount, tone = 'green', compact }) {
  const faces = { green: ['#DCF3E5', '#B7E3C9'], purple: ['#EDE6FF', '#D8C9F7'] };
  const inks = { green: ll.greenDeep, purple: ll.purpleDeep };
  return (
    <View style={styles.noteCast}>
      <LinearGradient colors={faces[tone]} style={[styles.note, { width: compact ? 100 : 112 }]}>
        <Sheen variant="tile" radius={llRadius.md} />
        {/* Guilloche-ish corner marks and a centre medallion. */}
        <Text style={[styles.noteCorner, { color: inks[tone], top: 5, left: 7 }]}>₹</Text>
        <Text style={[styles.noteCorner, { color: inks[tone], bottom: 5, right: 7 }]}>₹</Text>
        <View style={[styles.medallion, { borderColor: withAlpha(inks[tone], 0.3) }]} />
        <Text style={[styles.noteAmount, { color: inks[tone] }]}>{amount}</Text>
        <Text style={[styles.noteWord, { color: inks[tone] }]}>RUPEES</Text>
      </LinearGradient>
    </View>
  );
}

// The amounts drawn to scale. This is the part that makes change visible.
function AmountBar({ round, width: barW }) {
  if (round.kind === 'total') {
    const a = round.items[0].price;
    const b = round.items[1].price;
    const sum = a + b;
    return (
      <View style={[styles.bar, { width: barW }]}>
        <View style={[styles.seg, { flex: a, backgroundColor: ll.blueLight, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]}>
          <Text style={styles.segText}>{a}</Text>
        </View>
        <View style={[styles.seg, { flex: b, backgroundColor: ll.purpleLight, borderTopRightRadius: 8, borderBottomRightRadius: 8 }]}>
          <Text style={styles.segText}>{b}</Text>
        </View>
        <Text style={styles.barCap}>= {sum}?</Text>
      </View>
    );
  }

  if (round.kind === 'change') {
    const price = round.item.price;
    const paid = round.paid;
    return (
      <View style={[styles.bar, { width: barW }]}>
        <View style={[styles.seg, { flex: price, backgroundColor: ll.amberWarm, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]}>
          <Text style={styles.segText}>{price}</Text>
        </View>
        {/* The gap IS the change. Labelled, so it can be pointed at. */}
        <View style={[styles.gap, { flex: Math.max(1, paid - price) }]}>
          <Text style={styles.gapText}>change?</Text>
        </View>
        <Text style={styles.barCap}>of {paid}</Text>
      </View>
    );
  }

  const price = round.item.price;
  const wallet = round.wallet;
  const span = Math.max(price, wallet);
  return (
    <View style={[styles.stackBars, { width: barW }]}>
      <View style={styles.stackRow}>
        <Text style={styles.stackLabel}>price</Text>
        <View style={styles.stackTrack}>
          <View style={[styles.stackFill, { width: `${(price / span) * 100}%`, backgroundColor: ll.amberWarm }]} />
        </View>
        <Text style={styles.stackValue}>₹{price}</Text>
      </View>
      <View style={styles.stackRow}>
        <Text style={styles.stackLabel}>you</Text>
        <View style={styles.stackTrack}>
          <View style={[styles.stackFill, { width: `${(wallet / span) * 100}%`, backgroundColor: ll.greenLight }]} />
        </View>
        <Text style={styles.stackValue}>₹{wallet}</Text>
      </View>
    </View>
  );
}

function promptFor(r) {
  if (r.kind === 'total') return 'How much for both?';
  if (r.kind === 'change') return `You pay ₹${r.paid}. How much change?`;
  return `You have ₹${r.wallet}. Can you buy it?`;
}

export default function GiveChangeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-money', subjectId: 'Math', standardId: 'Grade 1', title: 'Money' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const prompt = promptFor(round);

  useEffect(() => { flow.say(prompt.replace(/₹(\d+)/g, '$1 rupees')); }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(option) {
    if (option === round.answer) {
      if (round.kind === 'total') flow.succeed(`${round.items[0].price} plus ${round.items[1].price} is ${round.answer} rupees.`);
      else if (round.kind === 'change') flow.succeed(`${round.paid} take away ${round.item.price} is ${round.answer} rupees change.`);
      else if (round.answer === 'Yes') flow.succeed(`Yes! ${round.wallet} rupees is enough for ${round.item.price}.`);
      else flow.succeed(`That's right. ${round.wallet} rupees is less than ${round.item.price}.`);
    } else if (round.kind === 'change' && option === round.item.price) {
      flow.missOn(option, `That's the price. Change is what you get back from ${round.paid}.`);
    } else if (round.kind === 'afford') {
      flow.missOn(option, `Compare ${round.wallet} and ${round.item.price}. Which is bigger?`);
    } else {
      flow.missOn(option, `Not ${option}. Work it out again.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const barW = Math.min(width - 56, 300);

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE COUNTER ----------------------------------------------------- */}
      <View style={styles.counter}>
        {round.kind === 'total' ? (
          <>
            <PriceCard {...round.items[0]} compact={compact} />
            <Text style={styles.op}>+</Text>
            <PriceCard {...round.items[1]} compact={compact} />
          </>
        ) : (
          <>
            <PriceCard {...round.item} compact={compact} />
            {round.kind === 'change'
              ? <Note amount={round.paid} tone="green" compact={compact} />
              : (
                <View style={styles.purseCast}>
                  <LinearGradient colors={['#F5EEFF', '#E4D8FA']} style={[styles.purse, { width: compact ? 100 : 112 }]}>
                    <Sheen variant="tile" radius={llRadius.xl} />
                    <Text style={styles.purseEmoji}>👛</Text>
                    <Text style={styles.purseText}>₹{round.wallet}</Text>
                    <Text style={styles.purseLabel}>YOUR MONEY</Text>
                  </LinearGradient>
                </View>
              )}
          </>
        )}
      </View>

      {/* The counter surface the goods sit on. */}
      <LinearGradient colors={['#EBD5B4', '#D6B78E']} style={[styles.deck, { width: Math.min(width - 36, 340) }]}>
        <View style={styles.deckLip} pointerEvents="none" />
      </LinearGradient>

      {/* THE AMOUNTS, TO SCALE ------------------------------------------ */}
      <AmountBar round={round} width={barW} />

      <View style={styles.options}>
        {round.options.map((option) => (
          <Choice
            key={option}
            flow={flow}
            id={option}
            isAnswer={option === round.answer}
            onPress={() => pick(option)}
            style={styles.option}
          >
            <Text style={choiceText.big}>{typeof option === 'number' ? `₹${option}` : option}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  counter: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },

  itemCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 6,
  },
  item: {
    paddingVertical: 12, borderRadius: llRadius.xl, alignItems: 'center', overflow: 'hidden',
  },
  itemEmoji: { fontSize: 46 },
  tagWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5,
    backgroundColor: ll.amberSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1.5, borderColor: withAlpha(ll.amber, 0.7),
  },
  tagHole: {
    width: 5, height: 5, borderRadius: 3,
    borderWidth: 1, borderColor: withAlpha(ll.amberInk, 0.5), backgroundColor: ll.white,
  },
  tag: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, color: ll.amberInk },
  op: { ...llType.h1, color: ll.ink, marginBottom: 24 },

  noteCast: {
    borderRadius: llRadius.md,
    shadowColor: '#2F7A54', shadowOpacity: 0.28, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  note: {
    height: 76, borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)',
  },
  noteCorner: { position: 'absolute', fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
  medallion: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
  },
  noteAmount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 34 },
  noteWord: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8, letterSpacing: 1.6 },

  purseCast: {
    borderRadius: llRadius.xl,
    shadowColor: ll.purpleDeep, shadowOpacity: 0.24, shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  purse: {
    paddingVertical: 12, borderRadius: llRadius.xl, alignItems: 'center', overflow: 'hidden',
  },
  purseEmoji: { fontSize: 40 },
  purseText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 23, color: ll.purpleDeep },
  purseLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8, letterSpacing: 1.3, color: ll.purpleDeep, opacity: 0.75 },

  deck: { height: 12, borderRadius: 4, marginTop: -2, borderTopWidth: 2, borderTopColor: '#C9A87E' },
  deckLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: 'rgba(94,64,24,0.18)' },

  bar: {
    flexDirection: 'row', alignItems: 'center', height: 30, marginTop: 20,
  },
  seg: {
    height: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
  },
  segText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.3)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 },
  },
  gap: {
    height: 26, alignItems: 'center', justifyContent: 'center',
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    borderWidth: 2, borderStyle: 'dashed', borderColor: withAlpha(ll.blue, 0.6),
    backgroundColor: withAlpha(ll.blue, 0.1),
  },
  gapText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: ll.blueDeep },
  barCap: {
    marginLeft: 8, fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.body,
  },

  stackBars: { marginTop: 20, gap: 7 },
  stackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stackLabel: {
    width: 34, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 0.8, color: ll.muted, textTransform: 'uppercase',
  },
  stackTrack: {
    flex: 1, height: 18, borderRadius: 9, backgroundColor: withAlpha('#8B86B8', 0.16),
    overflow: 'hidden',
  },
  stackFill: { height: '100%', borderRadius: 9 },
  stackValue: { width: 42, fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.ink },

  options: { flexDirection: 'row', gap: 12, marginTop: 24 },
  option: { minWidth: 96, height: 76 },
});
