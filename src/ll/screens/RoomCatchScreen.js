import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, ROOMS, TOTAL_ROUNDS } from '../games/roomCatchData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Room Catch" — Our House (Grade 1).
// Send things to the right room, or spot the misfit in a room and send it
// home. Rooms keep what they collect for the whole game.
export default function RoomCatchScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-house', subjectId: 'EVS', standardId: 'Grade 1', title: 'Our House' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [phase, setPhase] = useState('send'); // misfit rounds start at 'spot'
  const [collected, setCollected] = useState({});

  useEffect(() => {
    const isMisfit = round.kind === 'misfit';
    setPhase(isMisfit ? 'spot' : 'send');
    flow.say(isMisfit
      ? `One thing does not belong in the ${round.room.label.toLowerCase()}. Can you spot it?`
      : `Which room does the ${round.item.label} go in?`);
  }, [flow.index]);

  function spot(item) {
    if (phase !== 'spot') return;
    if (item.id === round.item.id) {
      setPhase('send');
      flow.cheer(`Yes! A ${item.label} doesn't belong in the ${round.room.label.toLowerCase()}. Where does it go?`);
    } else {
      flow.missOn(item.id, `A ${item.label} belongs in the ${round.room.label.toLowerCase()}. Look again.`);
    }
  }

  function send(room) {
    if (phase !== 'send') return;
    const { item } = round;
    if (room.id === item.room) {
      setCollected({ ...collected, [room.id]: [...(collected[room.id] ?? []), item.emoji] });
      flow.succeed(`Yes! The ${item.label} goes in the ${room.label.toLowerCase()}.`);
    } else {
      flow.missOn(room.id, `Would you find a ${item.label} in the ${room.label.toLowerCase()}?`);
    }
  }

  const prompt = phase === 'spot' ? `What doesn't belong in the ${round.room.label.toLowerCase()}?` : `Where does the ${round.item.label} go?`;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={prompt}>
      {phase === 'spot' ? (
        <View style={styles.lineup}>
          {round.lineup.map((item) => (
            <Choice key={item.id} flow={flow} id={item.id} isAnswer={item.id === round.item.id} onPress={() => spot(item)} style={styles.thing} accessibilityLabel={item.label}>
              <Text style={choiceText.emoji}>{item.emoji}</Text>
            </Choice>
          ))}
        </View>
      ) : (
        <View style={styles.carry}>
          <Text style={styles.carryEmoji}>{round.item.emoji}</Text>
          <Text style={styles.carryLabel}>{round.item.label}</Text>
        </View>
      )}

      <View style={styles.house}>
        {ROOMS.map((room) => (
          <Choice
            key={room.id}
            flow={flow}
            id={room.id}
            isAnswer={phase === 'send' && room.id === round.item.room}
            disabled={phase !== 'send'}
            onPress={() => send(room)}
            style={[styles.room, { backgroundColor: room.bg }]}
            accessibilityLabel={room.label}
          >
            <Text style={styles.roomLabel}>{room.emoji} {room.label}</Text>
            <Text style={styles.roomStuff}>{(collected[room.id] ?? []).join(' ')}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  lineup: { flexDirection: 'row', gap: 10 },
  thing: { width: 76, height: 76 },
  carry: { alignItems: 'center', padding: 12, borderRadius: llRadius.xl, backgroundColor: ll.white, minWidth: 140, ...llShadow.card },
  carryEmoji: { fontSize: 56 },
  carryLabel: { ...llType.cardTitle, color: ll.ink },
  house: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24, width: 320 },
  room: { width: 150, height: 110, justifyContent: 'flex-start', paddingTop: 12 },
  roomLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.ink },
  roomStuff: { fontSize: 20, marginTop: 8, textAlign: 'center' },
});
