import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/animalRiddleData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Animal Riddle Reveal" — Animals Around Us (Grade 1).
//
// Clues arrive one at a time; guess whenever you're sure. A wrong guess
// greys that animal out and reveals the next clue.
//
// The teaching device is the cost of a clue. Guessing early on one clue is
// the skill this game trains — the first clue deliberately fits more than
// one animal — so the screen now shows the clue budget as three lamps, lit
// as they're spent, and each clue card is numbered and arrives with a pop.
// A child can see that they have used two of three hints, which is what
// turns "guess again" into "think first".
//
// Eliminated animals aren't merely dimmed either: they get a cross-out bar
// and fall back visually, so the remaining field is obvious at a glance.
// That's the actual deduction — narrowing — and it should be visible.
export default function AnimalRiddleScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-animals', subjectId: 'EVS', standardId: 'Grade 1', title: 'Animals Around Us' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [shown, setShown] = useState(1);
  const [out, setOut] = useState([]);
  const peek = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setShown(1);
    setOut([]);
    flow.say(`Who am I? ${round.clues[0]}`);
  }, [flow.index]);

  // The mystery silhouette breathes while it's still hidden.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(peek, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(peek, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ---------------------------------------------------------------------
  // Unchanged clue + guess logic.
  function nextClue() {
    if (shown >= round.clues.length) return;
    flow.say(round.clues[shown]);
    setShown(shown + 1);
  }

  function guess(animal) {
    if (animal.id === round.answer) {
      setShown(round.clues.length);
      flow.succeed(`Yes! I am a ${animal.label}!`);
    } else {
      setOut([...out, animal.id]);
      const clue = round.clues[shown];
      flow.missOn(animal.id, `I am not a ${animal.label}.${clue ? ` Here is another clue. ${clue}` : ''}`);
      if (clue) setShown(shown + 1);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const solved = flow.isProcessing;
  const answerAnimal = round.options.find((a) => a.id === round.answer);
  const wobble = peek.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  const left = round.options.length - out.length;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt="Who am I?">
      {/* THE MYSTERY ----------------------------------------------------- */}
      <View style={styles.mysteryRow}>
        <Animated.View style={[styles.mysteryCast, { transform: [{ rotate: solved ? '0deg' : wobble }] }]}>
          <LinearGradient
            colors={solved ? [ll.greenLight, ll.greenDeep] : ['#D8E9DC', '#B4D3BC']}
            style={styles.mystery}
          >
            <Sheen variant="tile" radius={36} />
            {solved
              ? <GameObject id={answerAnimal?.id} emoji={answerAnimal?.emoji} size={48} accessibilityLabel={answerAnimal?.label} />
              : <Text style={styles.mysteryMark}>?</Text>}
          </LinearGradient>
        </Animated.View>

        {/* Clue budget: three lamps, lit as they're spent. */}
        <View style={styles.lamps}>
          <Text style={styles.lampLabel}>CLUES USED</Text>
          <View style={styles.lampRow}>
            {round.clues.map((_, i) => (
              <View key={i} style={[styles.lamp, i < shown && styles.lampOn]} />
            ))}
          </View>
          <Text style={styles.leftLabel}>{left} animal{left === 1 ? '' : 's'} left</Text>
        </View>
      </View>

      {/* THE CLUES ------------------------------------------------------- */}
      <View style={styles.cluesCast}>
        <LinearGradient colors={llSurface.white} style={[styles.clues, llRing.faint]}>
          <TopHighlight radius={llRadius.xl} />
          {round.clues.slice(0, shown).map((clue, i) => {
            const card = (
              <View key={i} style={styles.clueRow}>
                <View style={styles.clueNum}>
                  <Text style={styles.clueNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.clue}>{clue}</Text>
              </View>
            );
            return i === shown - 1 ? <Pop key={i} from={0.6}>{card}</Pop> : card;
          })}

          {/* Ghost rows for clues not yet spent. */}
          {round.clues.slice(shown).map((_, i) => (
            <View key={`g${i}`} style={styles.clueGhost}>
              <View style={styles.clueNumGhost} />
              <View style={styles.ghostLine} />
            </View>
          ))}
        </LinearGradient>
      </View>

      <Choice
        flow={flow}
        id="more"
        label={shown < round.clues.length ? 'Another clue' : 'No more clues'}
        disabled={shown >= round.clues.length}
        onPress={nextClue}
        style={styles.more}
      />

      {/* THE SUSPECTS ---------------------------------------------------- */}
      <View style={[styles.animals, { width: compact ? 280 : 300 }]}>
        {round.options.map((animal) => {
          const isOut = out.includes(animal.id);
          return (
            <View key={animal.id} style={styles.animalWrap}>
              <Choice
                flow={flow}
                id={animal.id}
                isAnswer={animal.id === round.answer}
                disabled={isOut}
                done={solved && animal.id === round.answer}
                onPress={() => guess(animal)}
                style={[styles.animal, compact && { width: 122, height: 94 }]}
                accessibilityLabel={isOut ? `${animal.label}, ruled out` : animal.label}
              >
                <GameObject id={animal.id} emoji={animal.emoji} size={40} accessibilityLabel={animal.label} />
                <Text style={choiceText.small}>{animal.label}</Text>
              </Choice>
              {/* Ruled out: crossed off the list, not just faded. */}
              {isOut ? <View style={styles.strike} pointerEvents="none" /> : null}
            </View>
          );
        })}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  mysteryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mysteryCast: {
    borderRadius: 36,
    shadowColor: '#3F9A6C', shadowOpacity: 0.3, shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 }, elevation: 6,
  },
  mystery: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)',
  },
  mysteryMark: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: ll.white,
    textShadowColor: 'rgba(20,60,40,0.3)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  lamps: { gap: 4 },
  lampLabel: { ...llType.eyebrow, color: ll.greenDeep, opacity: 0.8 },
  lampRow: { flexDirection: 'row', gap: 6 },
  lamp: {
    width: 26, height: 9, borderRadius: 5,
    backgroundColor: withAlpha('#8B86B8', 0.24),
  },
  lampOn: {
    backgroundColor: ll.amber,
    shadowColor: ll.amber, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  leftLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: ll.body },

  cluesCast: {
    alignSelf: 'stretch', marginTop: 16, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.16, shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 }, elevation: 5,
  },
  clues: {
    gap: 8, padding: 14, minHeight: 118, borderRadius: llRadius.xl, overflow: 'hidden',
  },
  clueRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  clueNum: {
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(ll.green, 0.18),
  },
  clueNumText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: ll.greenDeep },
  clue: { ...llType.cardTitle, color: ll.ink, flex: 1 },
  clueGhost: { flexDirection: 'row', alignItems: 'center', gap: 9, opacity: 0.45 },
  clueNumGhost: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: ll.lilac,
  },
  ghostLine: { flex: 1, height: 6, borderRadius: 4, backgroundColor: withAlpha('#8B86B8', 0.16) },

  more: { marginTop: 12, minWidth: 160, backgroundColor: ll.amberSoft },

  animals: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 18 },
  animalWrap: { position: 'relative' },
  animal: { width: 130, height: 100 },
  strike: {
    position: 'absolute', left: 10, right: 10, top: '48%', height: 3,
    borderRadius: 2, backgroundColor: withAlpha(ll.pinkDeep, 0.55),
    transform: [{ rotate: '-8deg' }],
  },
});
