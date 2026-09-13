import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { faceOf } from '../art';
import { Floating } from '../kit';
import GameFrame from '../games/GameFrame';
import { buildRound, PLACES, TOTAL_ROUNDS } from '../games/schoolDayData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llShadow, llType } from '../tokens';

// "Where Should Mia Go?" — Myself, Family & School (Senior KG).
//
// A fixed four-place map with Mia standing at the crossroads. A moment from
// her day is read aloud; the child taps the place it happens and Mia walks
// there. The map never changes between rounds, so by the end the child is
// navigating it, not re-reading it.
const TILE_W = 150;
const TILE_H = 116;
const GAP = 14;
const MAP_W = TILE_W * 2 + GAP;
const MAP_H = TILE_H * 2 + GAP;
const TOKEN = 54;

function tileOffset(i) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  return {
    x: col * (TILE_W + GAP) + TILE_W / 2 - MAP_W / 2,
    y: row * (TILE_H + GAP) + TILE_H / 2 - MAP_H / 2,
  };
}

export default function SchoolDayScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'sk-ev-self', subjectId: 'EVS', standardId: 'Senior KG', title: 'Myself, Family & School' },
  });
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [arrived, setArrived] = useState(null);
  const [wrongId, setWrongId] = useState(null);
  const walk = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    setArrived(null);
    setWrongId(null);
    walk.setValue({ x: 0, y: 0 });
    flow.say(`${round.moment} Where should Mia go?`);
  }, [flow.index]);

  function handleTap(place, i) {
    if (flow.isProcessing || arrived) return;
    if (place.id === round.place) {
      setArrived(place.id);
      Animated.spring(walk, { toValue: tileOffset(i), friction: 7, tension: 40, useNativeDriver: true }).start();
      flow.succeed(`Yes! Mia goes to the ${place.label.toLowerCase()}.`, { hold: 1500 });
    } else {
      setWrongId(place.id);
      flow.miss(`Not the ${place.label.toLowerCase()}. ${round.moment}`);
      flow.later(() => setWrongId(null), 420);
    }
  }

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Where should Mia go?">
      <Pressable onPress={() => flow.say(round.moment)} accessibilityRole="button" accessibilityLabel={`Hear again: ${round.moment}`} style={styles.moment}>
        <Floating distance={5} duration={2400}>
          <Text style={styles.momentEmoji}>{round.emoji}</Text>
        </Floating>
        <Text style={styles.momentText}>{round.moment}</Text>
      </Pressable>

      <View style={styles.map}>
        {/* Crossroads between the four places. */}
        <View style={[styles.road, styles.roadH]} />
        <View style={[styles.road, styles.roadV]} />

        {PLACES.map((place, i) => {
          const isHere = arrived === place.id;
          const isHint = flow.hinting && place.id === round.place && !arrived;
          return (
            <Animated.View
              key={place.id}
              style={[styles.tileWrap, wrongId === place.id && { transform: [{ translateX: flow.shakeX }] }]}
            >
              <Pressable
                onPress={() => handleTap(place, i)}
                disabled={flow.isProcessing}
                accessibilityRole="button"
                accessibilityLabel={place.label}
                style={({ pressed }) => [styles.tile, { backgroundColor: place.bg }, isHere && { borderColor: ll.green },
                  isHint && styles.hint, pressed && styles.pressed]}
              >
                <Text style={styles.tileEmoji}>{place.emoji}</Text>
                <Text style={[styles.tileLabel, { color: place.ink }]}>{place.label}</Text>
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View pointerEvents="none" style={[styles.token, { transform: walk.getTranslateTransform() }]}>
          <Image source={faceOf('mia', arrived ? 'excited' : 'happy')} style={styles.tokenImg} />
        </Animated.View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  moment: {
    flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', backgroundColor: ll.white,
    borderRadius: llRadius.xl, padding: 14, ...llShadow.card,
  },
  momentEmoji: { fontSize: 40 },
  momentText: { ...llType.cardTitle, color: ll.ink, flex: 1 },

  map: {
    width: MAP_W, height: MAP_H, flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 24,
  },
  road: { position: 'absolute', backgroundColor: '#E9DFCF' },
  roadH: { left: -10, right: -10, top: MAP_H / 2 - 9, height: 18, borderRadius: 9 },
  roadV: { top: -10, bottom: -10, left: MAP_W / 2 - 9, width: 18, borderRadius: 9 },
  tileWrap: { width: TILE_W, height: TILE_H },
  tile: {
    flex: 1, borderRadius: llRadius.xl, alignItems: 'center', justifyContent: 'center', gap: 2,
    borderWidth: 3, borderColor: ll.white, ...llShadow.soft,
  },
  tileEmoji: { fontSize: 40 },
  tileLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
  hint: { borderColor: ll.amber },
  pressed: { transform: [{ scale: 0.97 }] },

  token: {
    position: 'absolute', left: MAP_W / 2 - TOKEN / 2, top: MAP_H / 2 - TOKEN / 2, width: TOKEN, height: TOKEN,
    borderRadius: TOKEN / 2, backgroundColor: ll.white, borderWidth: 3, borderColor: ll.pink, overflow: 'hidden',
    ...llShadow.lift,
  },
  tokenImg: { width: '100%', height: '100%' },
});
