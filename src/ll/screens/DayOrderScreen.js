import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, DAYS, TOTAL_ROUNDS } from '../games/dayOrderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Reorder the Day" — Time (Grade 1).
//
// Time at this age is sequence, not clocks. Two kinds of round: put four
// events in the order they happen, or name the day before/after another.
//
// Order rounds now run along a timeline — the slots sit on a rail with a sun
// at the start and a moon at the end, and arrows between them. "First, next,
// last" is a direction, and a row of identical boxes doesn't say that; a rail
// running from morning to night does.
//
// Day rounds get the real fix: the week is drawn as a ring. The wrap-around
// from Saturday to Sunday is the one case children reliably miss, and it's
// only strange if you picture the week as a line that stops. On a ring,
// "after Saturday" is just the next seat round, and dayOrderData deliberately
// includes both wrap cases.
export default function DayOrderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-time', subjectId: 'Math', standardId: 'Grade 1', title: 'Time' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [placed, setPlaced] = useState([]);
  const isOrder = round.kind === 'order';
  const prompt = isOrder ? `${round.title}: what happens first?` : `What day comes ${round.dir} ${round.day}?`;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPlaced([]);
    flow.say(isOrder ? `${round.title}. Tap them in order.` : prompt);
  }, [flow.index]);

  // The arrow on the week ring sweeps the way the question points.
  useEffect(() => {
    if (isOrder) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(spin, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(spin, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pickEvent(event) {
    if (placed.includes(event.id)) return;
    if (event.id === placed.length) {
      const next = [...placed, event.id];
      setPlaced(next);
      if (next.length === round.events.length) flow.succeed(round.events.map((e) => e.label).join(', then '), { hold: 2000 });
      else flow.cheer(event.label);
    } else {
      flow.missOn(event.id, `What happens before ${event.label.toLowerCase()}?`);
    }
  }

  function pickDay(day) {
    if (day === round.answer) flow.succeed(`${round.answer} comes ${round.dir} ${round.day}.`);
    else flow.missOn(day, `Say the days in order: ${DAYS.join(', ')}.`);
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;

  // DAY ROUNDS -----------------------------------------------------------
  if (!isOrder) {
    const ringSize = Math.min(width - 80, compact ? 216 : 248);
    const r = ringSize / 2;
    const known = DAYS.indexOf(round.day);
    const nudge = spin.interpolate({
      inputRange: [0, 1],
      outputRange: round.dir === 'after' ? [0, 6] : [0, -6],
    });

    return (
      <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
        {/* THE WEEK, AS A RING — so Saturday → Sunday isn't a cliff. */}
        <View style={[styles.ring, { width: ringSize, height: ringSize }]}>
          <View style={[styles.ringTrack, { width: ringSize, height: ringSize, borderRadius: r }]} pointerEvents="none" />

          {DAYS.map((day, i) => {
            // 7 seats, starting at the top and going clockwise.
            const angle = (i / 7) * 2 * Math.PI - Math.PI / 2;
            const seat = r - (compact ? 26 : 30);
            const isKnown = i === known;
            return (
              <View
                key={day}
                style={[
                  styles.seat,
                  {
                    left: r + Math.cos(angle) * seat - (compact ? 24 : 28),
                    top: r + Math.sin(angle) * seat - (compact ? 24 : 28),
                    width: compact ? 48 : 56,
                    height: compact ? 48 : 56,
                    borderRadius: compact ? 24 : 28,
                  },
                  isKnown && styles.seatKnown,
                ]}
              >
                <Text style={[styles.seatText, isKnown && styles.seatTextKnown]}>{day.slice(0, 3)}</Text>
              </View>
            );
          })}

          {/* The question, in the middle of the ring. */}
          <View style={styles.ringCentre}>
            <Text style={styles.ringDir}>{round.dir}</Text>
            <Animated.Text style={[styles.ringArrow, { transform: [{ translateX: nudge }] }]}>
              {round.dir === 'after' ? '↻' : '↺'}
            </Animated.Text>
            <Text style={styles.ringDay}>{round.day}</Text>
          </View>
        </View>

        <View style={styles.dayOptions}>
          {round.options.map((day) => (
            <Choice
              key={day}
              flow={flow}
              id={day}
              isAnswer={day === round.answer}
              onPress={() => pickDay(day)}
              label={day}
              style={styles.dayOption}
            />
          ))}
        </View>
      </GameFrame>
    );
  }

  // ORDER ROUNDS ---------------------------------------------------------
  const slotW = compact ? 62 : 72;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      {/* THE TIMELINE — a rail from sunrise to night. ------------------- */}
      <View style={styles.timeline}>
        <Text style={styles.dayMark}>🌅</Text>

        <View style={styles.slotsWrap}>
          <View style={styles.rail} pointerEvents="none" />
          <View style={styles.slots}>
            {round.events.map((_, i) => {
              const event = i < placed.length ? round.events[placed[i]] : null;
              const isNext = i === placed.length;
              return (
                <View key={i} style={styles.slotCol}>
                  {event ? (
                    <Pop from={0.45}>
                      <View style={styles.slotCast}>
                        <LinearGradient
                          colors={['#F2FBF6', '#DFF3E8']}
                          style={[styles.slot, styles.slotFilled, { width: slotW, height: slotW + 8 }]}
                        >
                          <Sheen variant="tile" radius={llRadius.md} />
                          <TopHighlight radius={llRadius.md} />
                          <Text style={styles.slotNum}>{i + 1}</Text>
                          <GameObject id={event.id} emoji={event.emoji} size={38} accessibilityLabel={event.label} />
                        </LinearGradient>
                      </View>
                    </Pop>
                  ) : (
                    <View style={[styles.slot, styles.slotEmpty, isNext && styles.slotNext, { width: slotW, height: slotW + 8 }]}>
                      <Text style={styles.slotNum}>{i + 1}</Text>
                    </View>
                  )}
                  {/* Arrows say the rail has a direction. */}
                  {i < round.events.length - 1 ? <Text style={styles.arrow}>›</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.dayMark}>🌙</Text>
      </View>

      <View style={styles.tray}>
        {round.dealt.map((event) => (
          <Choice
            key={`${flow.index}-${event.id}`}
            flow={flow}
            id={event.id}
            isAnswer={event.id === placed.length}
            disabled={placed.includes(event.id)}
            onPress={() => pickEvent(event)}
            style={[styles.card, compact && { width: 128, height: 98 }]}
            accessibilityLabel={event.label}
          >
            <GameObject id={event.id} emoji={event.emoji} size={38} accessibilityLabel={event.label} />
            <Text style={choiceText.small}>{event.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  // Timeline ------------------------------------------------------------
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch', justifyContent: 'center' },
  dayMark: { fontSize: 22, opacity: 0.85 },
  slotsWrap: { position: 'relative' },
  rail: {
    position: 'absolute', left: 0, right: 0, top: '50%', height: 3,
    borderRadius: 2, backgroundColor: withAlpha('#8B86B8', 0.28),
  },
  slots: { flexDirection: 'row', alignItems: 'center' },
  slotCol: { flexDirection: 'row', alignItems: 'center' },
  slotCast: {
    borderRadius: llRadius.md,
    shadowColor: ll.greenDeep, shadowOpacity: 0.28, shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 }, elevation: 4,
  },
  slot: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  slotEmpty: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: ll.lilac,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  slotNext: { borderColor: ll.blue, backgroundColor: withAlpha(ll.blue, 0.1), borderStyle: 'solid', borderWidth: 3 },
  slotFilled: { borderWidth: 2, borderColor: ll.greenLight },
  slotNum: { ...llType.tiny, color: ll.muted, position: 'absolute', top: 4, left: 7 },
  arrow: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: withAlpha('#8B86B8', 0.7), marginHorizontal: 2 },

  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 26 },
  card: { width: 140, height: 104 },

  // Week ring -----------------------------------------------------------
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringTrack: {
    position: 'absolute', borderWidth: 3, borderStyle: 'dashed',
    borderColor: withAlpha(ll.blue, 0.3), backgroundColor: withAlpha(ll.blue, 0.04),
  },
  seat: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    backgroundColor: ll.white, borderWidth: 2, borderColor: withAlpha(ll.blue, 0.22),
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  seatKnown: {
    backgroundColor: ll.amberSoft, borderColor: ll.amber, borderWidth: 3,
    shadowColor: ll.amber, shadowOpacity: 0.4, shadowRadius: 12,
  },
  seatText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: ll.blueInk },
  seatTextKnown: { color: ll.amberInk },
  ringCentre: { alignItems: 'center' },
  ringDir: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 10, letterSpacing: 1.4,
    color: ll.blueDeep, textTransform: 'uppercase',
  },
  ringArrow: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40, color: ll.blue },
  ringDay: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: ll.ink },

  dayOptions: { gap: 11, marginTop: 22, alignSelf: 'stretch', paddingHorizontal: 26 },
  dayOption: { height: 58 },
});
