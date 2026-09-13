import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, DAYS, TOTAL_ROUNDS } from '../games/dayOrderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llType } from '../tokens';

// "Reorder the Day" — Time (Grade 1).
// Tap events in the order they happen, or name the day before/after.
export default function DayOrderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ma-time', subjectId: 'Math', standardId: 'Grade 1', title: 'Time' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [placed, setPlaced] = useState([]);
  const isOrder = round.kind === 'order';
  const prompt = isOrder ? `${round.title}: what happens first?` : `What day comes ${round.dir} ${round.day}?`;

  useEffect(() => {
    setPlaced([]);
    flow.say(isOrder ? `${round.title}. Tap them in order.` : prompt);
  }, [flow.index]);

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

  if (!isOrder) {
    return (
      <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
        <View style={styles.dayCard}>
          <Text style={styles.dayArrow}>{round.dir === 'after' ? `${round.day}  ➜  ?` : `?  ➜  ${round.day}`}</Text>
        </View>
        <View style={styles.dayOptions}>
          {round.options.map((day) => (
            <Choice key={day} flow={flow} id={day} isAnswer={day === round.answer} onPress={() => pickDay(day)} label={day} style={styles.dayOption} />
          ))}
        </View>
      </GameFrame>
    );
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="blue" prompt={prompt}>
      <View style={styles.slots}>
        {round.events.map((_, i) => {
          const event = i < placed.length ? round.events[placed[i]] : null;
          return (
            <View key={i} style={[styles.slot, event && styles.slotFilled]}>
              <Text style={styles.slotNum}>{i + 1}</Text>
              {event ? <Text style={choiceText.emoji}>{event.emoji}</Text> : null}
            </View>
          );
        })}
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
            style={styles.card}
            accessibilityLabel={event.label}
          >
            <Text style={choiceText.emoji}>{event.emoji}</Text>
            <Text style={choiceText.small}>{event.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', gap: 8 },
  slot: {
    width: 72, height: 80, borderRadius: llRadius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: ll.lilac,
    alignItems: 'center', justifyContent: 'center',
  },
  slotFilled: { borderStyle: 'solid', borderColor: ll.green, backgroundColor: ll.white },
  slotNum: { ...llType.tiny, color: ll.muted, position: 'absolute', top: 4, left: 8 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 },
  card: { width: 140, height: 104 },
  dayCard: { padding: 20, borderRadius: llRadius.xl, backgroundColor: ll.white },
  dayArrow: { ...llType.h3, color: ll.ink },
  dayOptions: { gap: 12, marginTop: 24, alignSelf: 'stretch', paddingHorizontal: 30 },
  dayOption: { height: 60 },
});
