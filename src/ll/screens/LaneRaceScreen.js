import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Floating } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, LANES, TOTAL_ROUNDS } from '../games/laneRaceData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Lane Race" — Transportation (Senior KG).
//
// Road, rail, water, sky. Vehicle rounds: a vehicle waits at the start and
// the child taps the lane it belongs in. Lane rounds: one lane lights up
// with a journey and the child picks the vehicle that can make it. A right
// answer ends the same way both times — the vehicle races down its lane.
export default function LaneRaceScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ev-transport', subjectId: 'EVS', standardId: 'Senior KG', title: 'Transportation' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [racer, setRacer] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const [laneWidth, setLaneWidth] = useState(320);
  const race = useRef(new Animated.Value(0)).current;

  const isVehicleRound = round.kind === 'vehicle';
  const answerLane = LANES.find((l) => l.id === round.lane);
  const prompt = isVehicleRound ? `Where does the ${round.vehicle.label} go?` : `Which one can ${round.journey}?`;

  useEffect(() => {
    setRacer(null);
    setWrongId(null);
    race.setValue(0);
    flow.say(isVehicleRound ? `Where does the ${round.vehicle.label} go?` : `Which one can ${round.journey}?`);
  }, [flow.index]);

  function startRace(vehicle) {
    setRacer(vehicle);
    race.setValue(0);
    Animated.timing(race, { toValue: 1, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }

  function handleLane(lane) {
    if (!isVehicleRound || flow.isProcessing || racer) return;
    if (lane.id === round.lane) {
      startRace(round.vehicle);
      flow.succeed(`Yes! A ${round.vehicle.label} goes on the ${lane.label.toLowerCase()}.`, { hold: 1500 });
    } else {
      setWrongId(lane.id);
      flow.miss(`A ${round.vehicle.label} can't go on the ${lane.label.toLowerCase()}!`);
      flow.later(() => setWrongId(null), 420);
    }
  }

  function handleVehicle(vehicle) {
    if (isVehicleRound || flow.isProcessing || racer) return;
    if (vehicle.lane === round.lane) {
      startRace(vehicle);
      flow.succeed(`Yes! The ${vehicle.label} can ${round.journey}.`, { hold: 1500 });
    } else {
      setWrongId(vehicle.id);
      flow.miss(`A ${vehicle.label} can't ${round.journey}. Try again!`);
      flow.later(() => setWrongId(null), 420);
    }
  }

  // Emoji vehicles face left on most platforms, so they race right-to-left.
  const raceX = race.interpolate({ inputRange: [0, 1], outputRange: [laneWidth - 64, -70] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={prompt}>
      {isVehicleRound ? (
        <Floating distance={8} duration={1800} style={styles.garage}>
          <Text style={[styles.garageEmoji, racer && { opacity: 0.2 }]}>{round.vehicle.emoji}</Text>
          <Text style={styles.garageLabel}>{round.vehicle.label}</Text>
        </Floating>
      ) : null}

      <View style={styles.lanes} onLayout={(e) => setLaneWidth(e.nativeEvent.layout.width)}>
        {LANES.map((lane) => {
          const isGoal = !isVehicleRound && lane.id === round.lane;
          const isHint = isVehicleRound && flow.hinting && lane.id === round.lane && !racer;
          const isRacing = racer && lane.id === answerLane.id;
          return (
            <Animated.View key={lane.id} style={wrongId === lane.id && { transform: [{ translateX: flow.shakeX }] }}>
              <Pressable
                onPress={() => handleLane(lane)}
                disabled={!isVehicleRound || flow.isProcessing}
                accessibilityRole={isVehicleRound ? 'button' : undefined}
                accessibilityLabel={lane.label}
                style={[styles.lane, { backgroundColor: lane.bg }, isGoal && styles.goal, isHint && styles.hint,
                  !isVehicleRound && !isGoal && styles.dim]}
              >
                <Text style={styles.laneEmoji}>{lane.emoji}</Text>
                <Text style={[styles.laneLabel, { color: lane.ink }]}>{lane.label}</Text>
                {isGoal ? <Text style={styles.flag}>🏁</Text> : null}
                <View style={[styles.dash, { borderColor: lane.ink }]} />
                {isRacing ? (
                  <Animated.Text style={[styles.racer, { transform: [{ translateX: raceX }] }]}>{racer.emoji}</Animated.Text>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {!isVehicleRound ? (
        <View style={styles.options}>
          {round.options.map((v) => (
            <Animated.View key={`${flow.index}-${v.id}`} style={wrongId === v.id && { transform: [{ translateX: flow.shakeX }] }}>
              <Pressable
                onPress={() => handleVehicle(v)}
                disabled={flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={v.label}
                style={({ pressed }) => [styles.option, flow.hinting && v.lane === round.lane && !racer && styles.hint,
                  racer?.id === v.id && styles.optionPicked, pressed && styles.pressed]}
              >
                <Text style={styles.optionEmoji}>{v.emoji}</Text>
                <Text style={styles.optionLabel} numberOfLines={1} adjustsFontSizeToFit>{v.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  garage: {
    width: 128, paddingVertical: 8, borderRadius: llRadius.xxl, backgroundColor: ll.white, alignItems: 'center',
    marginBottom: 16, ...llShadow.card,
  },
  garageEmoji: { fontSize: 52 },
  garageLabel: { ...llType.tiny, color: ll.greenDeep, textTransform: 'uppercase', letterSpacing: 1.2 },

  lanes: { alignSelf: 'stretch', gap: 8 },
  lane: {
    height: 58, borderRadius: llRadius.lg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8,
    overflow: 'hidden', borderWidth: 3, borderColor: 'transparent',
  },
  laneEmoji: { fontSize: 24 },
  laneLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, width: 60 },
  dash: { flex: 1, borderTopWidth: 2, borderStyle: 'dashed', opacity: 0.35 },
  flag: { fontSize: 20, position: 'absolute', right: 12 },
  racer: { position: 'absolute', left: 0, fontSize: 38 },
  goal: { borderColor: ll.green, ...llShadow.soft },
  dim: { opacity: 0.55 },
  hint: { borderColor: ll.amber },

  options: { flexDirection: 'row', gap: 12, marginTop: 20 },
  option: {
    width: 98, height: 98, borderRadius: llRadius.xl, backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent', paddingHorizontal: 6, ...llShadow.soft,
  },
  optionPicked: { borderColor: ll.green },
  optionEmoji: { fontSize: 42 },
  optionLabel: { ...llType.small, color: ll.ink },
  pressed: { transform: [{ scale: 0.95 }] },
});
