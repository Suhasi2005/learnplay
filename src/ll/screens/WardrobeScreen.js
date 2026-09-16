import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pop } from '../kit';
import { Sheen, TopHighlight } from '../premium';
import Choice, { choiceText } from '../games/Choice';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/wardrobeData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Dress for It" — Our Clothes (Grade 1).
//
// Dress for the weather, job or occasion, one body part at a time.
//
// The teaching device is the figure. Clothes go somewhere on a body, so the
// slots are now arranged as a person — head at the top, body in the middle,
// feet at the bottom — and each garment lands on its own part as it's
// chosen. "What goes on your head" stops being a list row and becomes a
// place, which is the difference between naming clothes and dressing.
//
// The scene sits beside the figure as a weather/occasion card, because every
// choice is judged against it: a raincoat is right for rain and wrong for a
// beach, and the two have to be visible together.
const SLOT_META = {
  head: { y: 0, label: 'Head' },
  body: { y: 1, label: 'Body' },
  feet: { y: 2, label: 'Feet' },
  hands: { y: 1, label: 'Hands' },
};

export default function WardrobeScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-ev-clothes', subjectId: 'EVS', standardId: 'Grade 1', title: 'Our Clothes' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [step, setStep] = useState(0);
  const current = round.steps[step];

  useEffect(() => {
    setStep(0);
    flow.say(`Get dressed for ${round.scene}.`);
  }, [flow.index]);

  // ---------------------------------------------------------------------
  // Unchanged dressing logic.
  function pick(option) {
    if (!current) return;
    if (option.id === current.answer.id) {
      setStep(step + 1);
      if (step === round.steps.length - 1) flow.succeed(`Ready for ${round.scene}!`);
      else flow.cheer(option.label);
    } else {
      flow.missOn(option.id, `Not the ${option.label} for ${round.scene}.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const done = step >= round.steps.length;

  return (
    <GameFrame flow={flow} navigation={navigation} tone="green" prompt={`Dress for ${round.scene}`}>
      <View style={styles.stage}>
        {/* THE OCCASION — what we're dressing for. --------------------- */}
        <View style={styles.sceneCast}>
          <LinearGradient colors={['#FFFFFF', '#F0F8F3']} style={[styles.scene, llRing.faint]}>
            <Sheen variant="tile" radius={llRadius.xl} />
            <TopHighlight radius={llRadius.xl} />
            <Text style={styles.sceneEmoji}>{round.emoji}</Text>
            <Text style={styles.sceneLabel}>{round.scene}</Text>
          </LinearGradient>
        </View>

        {/* THE FIGURE — clothes land where they belong. ---------------- */}
        <View style={styles.figure}>
          {/* A simple body behind the slots, so the parts read as a person. */}
          <View style={styles.bodyLine} pointerEvents="none" />

          {round.steps.map((s, i) => {
            const meta = SLOT_META[s.slot] ?? { label: s.slot };
            const isCurrent = i === step;
            const isFilled = i < step;
            const chip = (
              <View style={[styles.slotRow, isCurrent && styles.slotCurrent, isFilled && styles.slotFilled]}>
                <Text style={[styles.slotName, isFilled && styles.slotNameFilled]}>{meta.label ?? s.slot}</Text>
                <View style={[styles.slotBox, isCurrent && styles.slotBoxCurrent, isFilled && styles.slotBoxFilled]}>
                  {isFilled ? <GameObject id={s.answer.id} emoji={s.answer.emoji} size={24} /> : <Text style={styles.slotItem}>{isCurrent ? '?' : ''}</Text>}
                </View>
              </View>
            );
            return (
              <View key={s.slot} style={styles.slotWrap}>
                {isFilled ? <Pop from={0.5}>{chip}</Pop> : chip}
              </View>
            );
          })}
        </View>
      </View>

      {current ? (
        <View style={styles.askWrap}>
          <Text style={styles.ask}>What goes on your {(SLOT_META[current.slot]?.label ?? current.slot).toLowerCase()}?</Text>
        </View>
      ) : null}

      {done ? (
        <View style={styles.readyCast}>
          <LinearGradient colors={[ll.greenLight, ll.greenDeep]} style={styles.ready}>
            <Sheen variant="tile" radius={llRadius.pill} />
            <Text style={styles.readyText}>✓ Ready for {round.scene}!</Text>
          </LinearGradient>
        </View>
      ) : null}

      <View style={styles.options}>
        {(current?.options ?? []).map((option) => (
          <Choice
            key={`${step}-${option.id}`}
            flow={flow}
            id={option.id}
            isAnswer={option.id === current.answer.id}
            onPress={() => pick(option)}
            style={[styles.option, compact && { width: 94, height: 102 }]}
            accessibilityLabel={option.label}
          >
            <GameObject id={option.id} emoji={option.emoji} size={40} accessibilityLabel={option.label} />
            <Text style={choiceText.small}>{option.label}</Text>
          </Choice>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flexDirection: 'row', alignItems: 'center', gap: 14, alignSelf: 'stretch' },

  sceneCast: {
    borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.18, shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 }, elevation: 6,
  },
  scene: {
    width: 116, paddingVertical: 14, borderRadius: llRadius.xl,
    alignItems: 'center', overflow: 'hidden',
  },
  sceneEmoji: { fontSize: 54 },
  sceneLabel: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: ll.greenDeep,
    textAlign: 'center', marginTop: 2, paddingHorizontal: 6,
  },

  figure: { flex: 1, gap: 7, position: 'relative' },
  // The spine the slots hang off — cheap, but it turns a list into a body.
  bodyLine: {
    position: 'absolute', left: 22, top: 14, bottom: 14, width: 3,
    borderRadius: 2, backgroundColor: withAlpha('#8B86B8', 0.22),
  },
  slotWrap: {},
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 14, paddingRight: 6, height: 44, borderRadius: 22,
    backgroundColor: ll.track,
  },
  slotCurrent: {
    backgroundColor: '#E3F5EA', borderWidth: 2, borderColor: ll.green,
    shadowColor: ll.greenDeep, shadowOpacity: 0.22, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  slotFilled: { backgroundColor: '#EFFAF3' },
  slotName: { ...llType.cardTitle, color: ll.ink },
  slotNameFilled: { color: ll.greenDeep },
  slotBox: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  slotBoxCurrent: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: ll.green,
    backgroundColor: withAlpha(ll.green, 0.12),
  },
  slotBoxFilled: { backgroundColor: ll.white, borderWidth: 2, borderColor: ll.greenLight },
  slotItem: { fontSize: 22 },

  askWrap: { marginTop: 20 },
  ask: { ...llType.cardTitle, color: ll.greenDeep, textAlign: 'center' },

  readyCast: { marginTop: 18, borderRadius: llRadius.pill },
  ready: {
    borderRadius: llRadius.pill, paddingVertical: 9, paddingHorizontal: 20, overflow: 'hidden',
  },
  readyText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: ll.white,
    textShadowColor: 'rgba(20,60,40,0.28)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  options: { flexDirection: 'row', gap: 10, marginTop: 14 },
  option: { width: 104, height: 110 },
});
