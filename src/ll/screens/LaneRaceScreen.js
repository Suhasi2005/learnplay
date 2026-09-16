import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Floating } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import DragPiece, { Puff } from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, LANES, TOTAL_ROUNDS } from '../games/laneRaceData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Lane Race" — Transportation (Senior KG).
//
// Road, rail, water, sky. Vehicle rounds: a vehicle waits in the garage and
// the child *drives it into* the lane it belongs in. Lane rounds: one lane
// lights up with a journey and the child picks the vehicle that can make it.
// Either way a right answer ends the same: the vehicle races down its lane.
//
// The teaching device is the lane surface. A road has a painted centre line,
// rail has sleepers, water has waves, sky has clouds — each lane is the thing
// it represents, so "where does a train go" can be answered by looking for
// tracks rather than by reading the word "Rail". Transportation is a topic
// about matching a vehicle to a *surface*, and the surfaces now carry it.
export default function LaneRaceScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ev-transport', subjectId: 'EVS', standardId: 'Senior KG', title: 'Transportation' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [racer, setRacer] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const [laneWidth, setLaneWidth] = useState(320);
  // Presentation-only: which lane the finger is over while carrying.
  const [hovered, setHovered] = useState(null);
  const [carrying, setCarrying] = useState(false);
  const race = useRef(new Animated.Value(0)).current;

  const isVehicleRound = round.kind === 'vehicle';
  const answerLane = LANES.find((l) => l.id === round.lane);
  const prompt = isVehicleRound ? `Where does the ${round.vehicle.label} go?` : `Which one can ${round.journey}?`;

  // Measured lane rows, for hit-testing a drop.
  const laneBoxes = useRef([]);
  const lanesCol = useRef(null);
  const colOrigin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setRacer(null);
    setWrongId(null);
    setHovered(null);
    setCarrying(false);
    race.setValue(0);
    flow.say(isVehicleRound ? `Where does the ${round.vehicle.label} go?` : `Which one can ${round.journey}?`);
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged race + answer logic.
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
  // ---------------------------------------------------------------------

  function laneAt(x, y) {
    const ox = colOrigin.current.x;
    const oy = colOrigin.current.y;
    return laneBoxes.current.findIndex(
      (b) => b && x >= ox + b.x - 20 && x <= ox + b.x + b.w + 20 && y >= oy + b.y && y <= oy + b.y + b.h,
    );
  }

  // Emoji vehicles face left on most platforms, so they race right-to-left.
  const raceX = race.interpolate({ inputRange: [0, 1], outputRange: [laneWidth - 64, -70] });
  const compact = width < 360;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={prompt}>
      {/* THE GARAGE — the vehicle waiting to be driven somewhere. -------- */}
      {isVehicleRound ? (
        <DragPiece
          direction="any"
          threshold={28}
          liftTo={1.14}
          disabled={flow.isProcessing || !!racer}
          accessibilityLabel={`Drive the ${round.vehicle.label} to its lane`}
          onLift={() => setCarrying(true)}
          onMove={(g) => {
            const hit = laneAt(g.moveX, g.moveY);
            setHovered(hit >= 0 ? LANES[hit].id : null);
          }}
          onDrop={(placed, g) => {
            setCarrying(false);
            setHovered(null);
            if (!placed || !g) return;
            const hit = laneAt(g.moveX, g.moveY);
            if (hit >= 0) handleLane(LANES[hit]);
          }}
        >
          <Floating distance={carrying ? 0 : 8} duration={1800}>
            <View style={[styles.garageCast, carrying && styles.garageCastLifted]}>
              <LinearGradient colors={llSurface.white} style={[styles.garage, llRing.faint]}>
                <Sheen variant="tile" radius={llRadius.xxl} />
                <TopHighlight radius={llRadius.xxl} />
                <GameObject id={round.vehicle.id} emoji={round.vehicle.emoji} size={52} style={racer && { opacity: 0.2 }} accessibilityLabel={round.vehicle.label} />
                <Text style={styles.garageLabel}>{round.vehicle.label}</Text>
              </LinearGradient>
            </View>
          </Floating>
        </DragPiece>
      ) : null}

      {isVehicleRound ? (
        <Text style={styles.dragHint}>{carrying ? 'Drop it on the right lane!' : 'Drag it to the right lane'}</Text>
      ) : null}

      {/* THE LANES — each one is its own surface. ----------------------- */}
      <View
        style={styles.lanes}
        ref={lanesCol}
        onLayout={(e) => {
          setLaneWidth(e.nativeEvent.layout.width);
          lanesCol.current?.measureInWindow?.((x, y) => { colOrigin.current = { x, y }; });
        }}
      >
        {LANES.map((lane, i) => {
          const isGoal = !isVehicleRound && lane.id === round.lane;
          const isHint = isVehicleRound && flow.hinting && lane.id === round.lane && !racer;
          const isRacing = racer && lane.id === answerLane.id;
          const isHover = hovered === lane.id;
          return (
            <Animated.View
              key={lane.id}
              onLayout={(e) => {
                const { x, y, width: w, height: h } = e.nativeEvent.layout;
                laneBoxes.current[i] = { x, y, w, h };
              }}
              style={wrongId === lane.id ? { transform: [{ translateX: flow.shakeX }] } : undefined}
            >
              <Pressable
                onPress={() => handleLane(lane)}
                disabled={!isVehicleRound || flow.isProcessing}
                accessibilityRole={isVehicleRound ? 'button' : undefined}
                accessibilityLabel={lane.label}
                style={[
                  styles.laneCast,
                  (isGoal || isHover) && { shadowColor: lane.ink, shadowOpacity: 0.4, shadowRadius: 22, elevation: 8 },
                ]}
              >
                <LinearGradient
                  colors={[withAlpha('#FFFFFF', 0.5), lane.bg]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    styles.lane,
                    { height: compact ? 54 : 58 },
                    isGoal && styles.goal,
                    isHint && styles.hint,
                    isHover && styles.hover,
                    !isVehicleRound && !isGoal && styles.dim,
                  ]}
                >
                  {/* The surface itself — road markings, sleepers, waves,
                      clouds. This is the answer, drawn. */}
                  <Surface id={lane.id} ink={lane.ink} />

                  <Text style={styles.laneEmoji}>{lane.emoji}</Text>
                  <Text style={[styles.laneLabel, { color: lane.ink }, compact && { fontSize: 15, width: 52 }]}>
                    {lane.label}
                  </Text>

                  {isGoal ? <Text style={styles.flag}>🏁</Text> : null}

                  {isRacing ? (
                    <>
                      <Animated.Text style={[styles.racer, { transform: [{ translateX: raceX }] }]}>
                        {racer.emoji}
                      </Animated.Text>
                      <Puff key={`dust-${flow.index}`} size={26} color={withAlpha('#FFFFFF', 0.8)} style={{ right: 24, bottom: 6 }} />
                    </>
                  ) : null}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* VEHICLE CHOICES (lane rounds). --------------------------------- */}
      {!isVehicleRound ? (
        <View style={styles.options}>
          {round.options.map((v) => {
            const isHintV = flow.hinting && v.lane === round.lane && !racer;
            const picked = racer?.id === v.id;
            return (
              <Animated.View key={`${flow.index}-${v.id}`} style={wrongId === v.id ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
                <Pressable
                  onPress={() => handleVehicle(v)}
                  disabled={flow.isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={v.label}
                  style={({ pressed }) => [
                    styles.optionCast,
                    picked && styles.optionCastPicked,
                    isHintV && styles.optionCastHint,
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <LinearGradient
                    colors={picked ? ['#F2FBF6', '#E2F5EA'] : llSurface.white}
                    style={[
                      styles.option,
                      { width: compact ? 90 : 98, height: compact ? 90 : 98 },
                      picked ? styles.optionPicked : llRing.faint,
                      isHintV && styles.hint,
                    ]}
                  >
                    <Sheen variant="tile" radius={llRadius.xl} />
                    <TopHighlight radius={llRadius.xl} />
                    <GameObject id={v.id} emoji={v.emoji} size={42} accessibilityLabel={v.label} />
                    <Text style={styles.optionLabel} numberOfLines={1} adjustsFontSizeToFit>{v.label}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : null}
    </GameFrame>
  );
}

// Each lane's surface, drawn from primitives. No art dependency.
function Surface({ id, ink }) {
  if (id === 'rail') {
    return (
      <View style={styles.surface} pointerEvents="none">
        <View style={[styles.railLine, { backgroundColor: withAlpha(ink, 0.45), top: '38%' }]} />
        <View style={[styles.railLine, { backgroundColor: withAlpha(ink, 0.45), top: '58%' }]} />
        <View style={styles.sleepers}>
          {Array.from({ length: 14 }, (_, i) => (
            <View key={i} style={[styles.sleeper, { backgroundColor: withAlpha(ink, 0.3) }]} />
          ))}
        </View>
      </View>
    );
  }
  if (id === 'water') {
    return (
      <View style={styles.surface} pointerEvents="none">
        {[0, 1, 2].map((r) => (
          <View
            key={r}
            style={{
              position: 'absolute', left: 0, right: 0, top: `${34 + r * 18}%`,
              height: 4, borderRadius: 4, backgroundColor: withAlpha('#FFFFFF', 0.45 - r * 0.12),
            }}
          />
        ))}
      </View>
    );
  }
  if (id === 'sky') {
    return (
      <View style={styles.surface} pointerEvents="none">
        <View style={[styles.cloudPuff, { left: '22%', top: '26%', width: 34 }]} />
        <View style={[styles.cloudPuff, { left: '48%', top: '54%', width: 26 }]} />
        <View style={[styles.cloudPuff, { left: '72%', top: '30%', width: 30 }]} />
      </View>
    );
  }
  // Road: a dashed painted centre line and a kerb.
  return (
    <View style={styles.surface} pointerEvents="none">
      <View style={styles.roadCentre}>
        {Array.from({ length: 9 }, (_, i) => (
          <View key={i} style={[styles.roadDash, { backgroundColor: withAlpha('#FFFFFF', 0.75) }]} />
        ))}
      </View>
      <View style={[styles.kerb, { backgroundColor: withAlpha(ink, 0.25) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  garageCast: {
    borderRadius: llRadius.xxl, marginBottom: 6,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 }, elevation: 9,
  },
  garageCastLifted: { shadowOpacity: 0.42, shadowRadius: 36, shadowOffset: { width: 0, height: 22 }, elevation: 14 },
  garage: {
    width: 128, paddingVertical: 10, borderRadius: llRadius.xxl,
    alignItems: 'center', overflow: 'hidden',
  },
  garageEmoji: { fontSize: 52 },
  garageLabel: { ...llType.tiny, color: ll.greenDeep, textTransform: 'uppercase', letterSpacing: 1.2 },

  dragHint: {
    marginBottom: 12, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.greenDeep, textTransform: 'uppercase', opacity: 0.75,
  },

  lanes: { alignSelf: 'stretch', gap: 8 },
  laneCast: {
    borderRadius: llRadius.lg,
    shadowColor: '#6054BE', shadowOpacity: 0.14, shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 }, elevation: 3,
  },
  lane: {
    borderRadius: llRadius.lg, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 8, overflow: 'hidden',
    borderWidth: 3, borderColor: 'transparent',
  },
  surface: { ...StyleSheet.absoluteFillObject },
  railLine: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2 },
  sleepers: { position: 'absolute', left: 0, right: 0, top: '30%', flexDirection: 'row', justifyContent: 'space-around' },
  sleeper: { width: 4, height: 22, borderRadius: 2 },
  roadCentre: {
    position: 'absolute', left: 10, right: 10, top: '48%',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  roadDash: { width: 14, height: 3, borderRadius: 2 },
  kerb: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 },
  cloudPuff: { position: 'absolute', height: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)' },

  laneEmoji: { fontSize: 24 },
  laneLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, width: 60 },
  flag: { fontSize: 20, position: 'absolute', right: 12 },
  racer: { position: 'absolute', left: 0, fontSize: 38 },
  goal: { borderColor: ll.green },
  hover: { borderColor: 'rgba(255,255,255,0.95)' },
  dim: { opacity: 0.5 },
  hint: { borderColor: ll.amber },

  options: { flexDirection: 'row', gap: 12, marginTop: 20 },
  optionCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  optionCastPicked: { shadowColor: ll.greenDeep, shadowOpacity: 0.35, shadowRadius: 22 },
  optionCastHint: { shadowColor: ll.amber, shadowOpacity: 0.55, shadowRadius: 18 },
  option: {
    borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, overflow: 'hidden',
  },
  optionPicked: { borderWidth: 3, borderColor: ll.green },
  optionEmoji: { fontSize: 42 },
  optionLabel: { ...llType.small, color: ll.ink },
});
