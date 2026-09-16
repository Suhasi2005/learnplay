import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Floating, Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, ROOMS, TOTAL_ROUNDS } from '../games/roomCatchData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Room Catch" — Our House (Grade 1).
//
// Send things to the right room, or spot the misfit in a room and send it
// home. Rooms keep what they collect for the whole game.
//
// The four rooms are drawn as a cutaway house — two floors under a pitched
// roof, with walls between them — rather than four cards in a grid. That
// matters because the topic is *a house*, and a child who can see rooms
// sharing walls is looking at a home; four separate cards are a quiz.
//
// The keeping is the reward. Every object sent home stays in its room for
// the rest of the game, so the house furnishes itself as the child plays —
// by the last round they've built the whole thing. Collected items are shown
// as a row of small objects sitting on each room's floor, and each new
// arrival pops in.
export default function RoomCatchScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-house', subjectId: 'EVS', standardId: 'Grade 1', title: 'Our House' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [phase, setPhase] = useState('send'); // misfit rounds start at 'spot'
  const [collected, setCollected] = useState({});
  // Presentation-only: the room that just received something.
  const [justFilled, setJustFilled] = useState(null);
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isMisfit = round.kind === 'misfit';
    setPhase(isMisfit ? 'spot' : 'send');
    setJustFilled(null);
    flow.say(isMisfit
      ? `One thing does not belong in the ${round.room.label.toLowerCase()}. Can you spot it?`
      : `Which room does the ${round.item.label} go in?`);
  }, [flow.index]);

  // Rooms breathe faintly while the child is holding something.
  useEffect(() => {
    if (phase !== 'send') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged sorting logic.
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
      setJustFilled(room.id);
      flow.succeed(`Yes! The ${item.label} goes in the ${room.label.toLowerCase()}.`);
    } else {
      flow.missOn(room.id, `Would you find a ${item.label} in the ${room.label.toLowerCase()}?`);
    }
  }
  // ---------------------------------------------------------------------

  const prompt = phase === 'spot'
    ? `What doesn't belong in the ${round.room.label.toLowerCase()}?`
    : `Where does the ${round.item.label} go?`;

  const compact = width < 360;
  const houseW = Math.min(width - 36, 330);
  const roomW = (houseW - 14) / 2;
  // The target room brightens and dims while the child decides.
  const pulse = glow.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={prompt}>
      {/* WHAT'S IN HAND -------------------------------------------------- */}
      {phase === 'spot' ? (
        <View style={styles.lineupWrap}>
          {/* The room being inspected, named. */}
          <View style={[styles.roomTag, { backgroundColor: round.room.bg }]}>
            <Text style={styles.roomTagText}>{round.room.emoji} {round.room.label}</Text>
          </View>
          <View style={styles.lineup}>
            {round.lineup.map((item) => (
              <Choice
                key={item.id}
                flow={flow}
                id={item.id}
                isAnswer={item.id === round.item.id}
                onPress={() => spot(item)}
                style={[styles.thing, compact && { width: 68, height: 68 }]}
                accessibilityLabel={item.label}
              >
                <GameObject id={item.id} emoji={item.emoji} size={40} accessibilityLabel={item.label} />
              </Choice>
            ))}
          </View>
        </View>
      ) : (
        <Floating distance={7} duration={2400}>
          <View style={styles.carryCast}>
            <LinearGradient colors={llSurface.white} style={[styles.carry, llRing.faint]}>
              <Sheen variant="tile" radius={llRadius.xl} />
              <TopHighlight radius={llRadius.xl} />
              <GameObject id={round.item.id} emoji={round.item.emoji} size={46} accessibilityLabel={round.item.label} />
              <Text style={styles.carryLabel}>{round.item.label}</Text>
            </LinearGradient>
          </View>
        </Floating>
      )}

      {/* THE HOUSE ------------------------------------------------------- */}
      <View style={[styles.houseWrap, { width: houseW }]}>
        {/* Pitched roof. */}
        <View style={[styles.roof, { borderLeftWidth: houseW / 2, borderRightWidth: houseW / 2 }]} pointerEvents="none" />
        <View style={styles.chimney} pointerEvents="none" />

        <LinearGradient colors={['#FFFDF9', '#F4EEE4']} style={[styles.house, { width: houseW }]}>
          {ROOMS.map((room, i) => {
            const items = collected[room.id] ?? [];
            const isTarget = phase === 'send' && room.id === round.item.room;
            return (
              <Animated.View key={room.id} style={[{ width: roomW }, isTarget && { opacity: pulse }]}>
                <Choice
                  flow={flow}
                  id={room.id}
                  isAnswer={isTarget}
                  disabled={phase !== 'send'}
                  onPress={() => send(room)}
                  style={[styles.room, { width: roomW, backgroundColor: room.bg }]}
                  accessibilityLabel={room.label}
                >
                  <Text style={styles.roomLabel}>{room.emoji} {room.label}</Text>

                  {/* Skirting + floor: the things collected stand on it. */}
                  <View style={styles.roomFloor} pointerEvents="none" />
                  <View style={styles.roomStuff}>
                    {items.map((emoji, k) => {
                      const isNew = justFilled === room.id && k === items.length - 1;
                      const tile = <GameObject key={k} emoji={emoji} size={20} />;
                      return isNew ? <Pop key={k} from={0.3}>{tile}</Pop> : tile;
                    })}
                  </View>
                </Choice>
              </Animated.View>
            );
          })}
        </LinearGradient>

        {/* A front door on the ground floor, so it reads as a house. */}
        <View style={styles.doorstep} pointerEvents="none">
          <View style={styles.door}>
            <View style={styles.knob} />
          </View>
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  lineupWrap: { alignItems: 'center', gap: 10 },
  roomTag: {
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: llRadius.pill,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)',
  },
  roomTagText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.ink },
  lineup: { flexDirection: 'row', gap: 10 },
  thing: { width: 76, height: 76 },

  carryCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#5442A8', shadowOpacity: 0.26, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 9,
  },
  carry: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: llRadius.xl, minWidth: 150, overflow: 'hidden',
  },
  carryEmoji: { fontSize: 54 },
  carryLabel: { ...llType.cardTitle, color: ll.ink },

  houseWrap: { marginTop: 22, alignItems: 'center' },
  roof: {
    width: 0, height: 0, backgroundColor: 'transparent',
    borderBottomWidth: 44, borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#C96F5E',
  },
  chimney: {
    position: 'absolute', top: 2, right: '22%', width: 16, height: 26,
    borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: '#A85A4B',
  },
  house: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, padding: 7,
    borderBottomLeftRadius: llRadius.md, borderBottomRightRadius: llRadius.md,
    borderWidth: 3, borderTopWidth: 0, borderColor: '#E2D6C4',
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 }, elevation: 7,
  },
  room: {
    height: 112, justifyContent: 'flex-start', paddingTop: 10, paddingBottom: 0,
    borderRadius: llRadius.md,
  },
  roomLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: ll.ink },
  roomFloor: {
    position: 'absolute', left: 0, right: 0, bottom: 26, height: 2,
    backgroundColor: withAlpha('#8B7355', 0.22),
  },
  roomStuff: {
    position: 'absolute', left: 0, right: 0, bottom: 4,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2,
  },
  stuffEmoji: { fontSize: 19, lineHeight: 23 },

  doorstep: { marginTop: -3, alignItems: 'center' },
  door: {
    width: 34, height: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14,
    backgroundColor: '#A8764B', alignItems: 'flex-end', justifyContent: 'center', paddingRight: 5,
  },
  knob: { width: 4, height: 4, borderRadius: 2, backgroundColor: ll.amber },
});
