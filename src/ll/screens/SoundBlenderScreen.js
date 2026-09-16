import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import DragPiece from '../games/DragPiece';
import GameFrame from '../games/GameFrame';
import { buildRound, TOTAL_ROUNDS } from '../games/soundBlenderData';
import { useRoundFlow } from '../games/useRoundFlow';
import { ll, llRadius, llRing, llSurface, llType, withAlpha } from '../tokens';
import GameObject from '../objects';

// "Sound Blender" — Phonetics (Grade 1).
//
// Hear the word, see the picture, find the sound missing from its spelling.
// The letters are physical tiles in a word rack with one empty socket; the
// child drags a letter tile up into the socket.
//
// Two things do the teaching:
//
//  - The rack is labelled by position. The gap is marked BEGINNING, MIDDLE or
//    END under the socket, because a child who can hear a first sound often
//    still can't isolate a middle vowel — naming the position is half the
//    skill, and soundBlenderData deliberately moves the gap around.
//  - Vowels and consonants are coloured differently. A missing middle sound
//    is nearly always a vowel, and seeing the vowel tiles as a family is what
//    makes "a, e, i, o, u" a set rather than five unrelated letters.
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const isVowel = (l) => VOWELS.includes(String(l).toLowerCase());

export default function SoundBlenderScreen({ route, navigation }) {
  const flow = useRoundFlow({
    route, navigation, total: TOTAL_ROUNDS,
    defaults: { topicId: 'g1-en-phonetics', subjectId: 'English', standardId: 'Grade 1', title: 'Phonetics' },
  });
  const { width } = useWindowDimensions();
  const round = useMemo(() => buildRound(flow.index), [flow.index]);
  const [solved, setSolved] = useState(false);
  // Presentation-only: the tile in the child's hand.
  const [carried, setCarried] = useState(null);
  const socket = useRef(new Animated.Value(0)).current;
  const landed = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSolved(false);
    setCarried(null);
    landed.setValue(0);
    flow.say(`${round.word}. Which sound is missing at the ${round.position}?`);
  }, [flow.index]);

  // The empty socket breathes while a tile is being carried to it.
  useEffect(() => {
    if (carried === null || solved) {
      socket.stopAnimation();
      Animated.timing(socket, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(socket, { toValue: 1, duration: 440, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(socket, { toValue: 0, duration: 440, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [carried, solved]);

  // ---------------------------------------------------------------------
  // Unchanged pick logic.
  function pick(letter) {
    if (solved) return;
    if (letter === round.answer) {
      setSolved(true);
      Animated.spring(landed, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }).start();
      flow.succeed(`${round.word.split('').join(', ')}. ${round.word}!`);
    } else {
      const tried = round.word.slice(0, round.missing) + letter + round.word.slice(round.missing + 1);
      flow.missOn(letter, `${tried} is not the picture. Listen: ${round.word}.`);
    }
  }
  // ---------------------------------------------------------------------

  const compact = width < 360;
  const tileW = compact ? 62 : 70;
  const tileH = compact ? 70 : 78;
  const optionSize = compact ? 72 : 80;

  const socketScale = socket.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const landScale = landed.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <GameFrame flow={flow} navigation={navigation} tone="pink" prompt={`Which sound is missing at the ${round.position}?`}>
      {/* THE PICTURE — tap to hear the word again. ----------------------- */}
      <Pressable
        onPress={() => flow.say(round.word)}
        accessibilityRole="button"
        accessibilityLabel="Hear the word again"
        style={({ pressed }) => [styles.pictureCast, pressed && { transform: [{ scale: 0.97 }] }]}
      >
        <LinearGradient colors={llSurface.whitePink} style={[styles.picture, llRing.faint]}>
          <Sheen variant="tile" radius={llRadius.xxl} />
          <TopHighlight radius={llRadius.xxl} />
          <GameObject id={round.word} emoji={round.emoji} size={56} />
          <View style={styles.hearChip}>
            <Text style={styles.hear}>🔊 Hear it</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* THE WORD RACK --------------------------------------------------- */}
      <View style={styles.rackCast}>
        <LinearGradient colors={['#F8F4FF', '#EBE3FA']} style={[styles.rack, llRing.light]}>
          <Sheen variant="trough" radius={llRadius.xl} />

          <View style={styles.tiles}>
            {round.word.split('').map((letter, i) => {
              const isGap = i === round.missing;
              const empty = isGap && !solved;

              if (empty) {
                return (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Animated.View
                      style={[
                        styles.socket,
                        { width: tileW, height: tileH },
                        carried !== null && styles.socketArmed,
                        carried !== null && { transform: [{ scale: socketScale }] },
                      ]}
                    >
                      <Text style={[styles.socketMark, carried !== null && styles.socketMarkArmed]}>?</Text>
                    </Animated.View>
                    {/* Naming the position is half the skill. */}
                    <Text style={styles.posLabel}>{round.position.toUpperCase()}</Text>
                  </View>
                );
              }

              const justLanded = isGap && solved;
              return (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Animated.View style={justLanded ? { transform: [{ scale: landScale }] } : undefined}>
                    <LetterTile
                      letter={letter}
                      width={tileW}
                      height={tileH}
                      tone={justLanded ? 'landed' : isVowel(letter) ? 'vowel' : 'consonant'}
                    />
                  </Animated.View>
                  {justLanded ? <Text style={styles.posLabelDone}>{round.position.toUpperCase()}</Text> : <View style={styles.posSpacer} />}
                </View>
              );
            })}
          </View>

          {solved ? (
            <View style={styles.blendRow}>
              <Text style={styles.blendText}>{round.word.split('').join(' · ')}</Text>
              <Text style={styles.blendArrow}>→</Text>
              <Text style={styles.blendWord}>{round.word}</Text>
            </View>
          ) : null}
        </LinearGradient>
      </View>

      {/* THE LETTER TRAY ------------------------------------------------- */}
      <View style={styles.options}>
        {round.options.map((letter) => {
          const isWrong = flow.wrongId === letter;
          const isHint = flow.hinting && letter === round.answer && !solved;
          return (
            <DragPiece
              key={letter}
              direction="up"
              threshold={40}
              disabled={solved || flow.isProcessing}
              accessibilityLabel={letter}
              onLift={() => setCarried(letter)}
              onDrop={(placedNow) => {
                setCarried(null);
                if (placedNow) pick(letter);
              }}
            >
              <Animated.View style={isWrong ? { transform: [{ translateX: flow.shakeX }] } : undefined}>
                <View
                  style={[
                    styles.optionCast,
                    { shadowColor: isVowel(letter) ? ll.pinkDeep : ll.blueDeep },
                    carried === letter && styles.optionCastLifted,
                    isHint && styles.optionCastHint,
                  ]}
                >
                  <LinearGradient
                    colors={isVowel(letter) ? [ll.pinkLight, ll.pink] : [ll.blueLight, ll.blue]}
                    style={[
                      styles.option,
                      { width: optionSize, height: optionSize, borderRadius: optionSize / 2 },
                      isHint && styles.hint,
                    ]}
                  >
                    <Sheen variant="strong" radius={optionSize / 2} />
                    <Text style={styles.optionText}>{letter}</Text>
                    <Text style={styles.optionKind}>{isVowel(letter) ? 'vowel' : ''}</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            </DragPiece>
          );
        })}
      </View>
      <Text style={styles.trayHint}>{carried !== null ? 'Drop it in the gap' : 'Drag a sound into the word'}</Text>
    </GameFrame>
  );
}

// A letter tile: engraved face, thick bottom edge, vowels warm and
// consonants cool so the two families are visibly different.
function LetterTile({ letter, width, height, tone }) {
  const fills = {
    vowel: ['#FFF6F9', '#FFE7EF'],
    consonant: ['#F5F9FF', '#E6EEFF'],
    landed: [ll.greenLight, ll.greenDeep],
  };
  const inks = { vowel: ll.pinkDeep, consonant: ll.blueDeep, landed: ll.white };
  const edges = { vowel: withAlpha(ll.pinkDeep, 0.3), consonant: withAlpha(ll.blueDeep, 0.28), landed: withAlpha('#1F6B47', 0.6) };

  return (
    <View style={[styles.tileCast, tone === 'landed' && { shadowColor: ll.greenDeep, shadowOpacity: 0.45 }]}>
      <LinearGradient
        colors={fills[tone]}
        style={[styles.tile, { width, height, borderBottomColor: edges[tone] }]}
      >
        <Sheen variant="tile" radius={llRadius.md} />
        <TopHighlight radius={llRadius.md} />
        <Text style={[styles.tileText, { color: inks[tone] }]}>{letter}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pictureCast: {
    borderRadius: llRadius.xxl,
    shadowColor: '#5442A8', shadowOpacity: 0.24, shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 }, elevation: 9,
  },
  picture: {
    width: 140, height: 140, borderRadius: llRadius.xxl, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  pictureEmoji: { fontSize: 66 },
  hearChip: {
    marginTop: 2, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99,
    backgroundColor: withAlpha(ll.pink, 0.14),
  },
  hear: { ...llType.tiny, color: ll.pinkDeep },

  rackCast: {
    alignSelf: 'stretch', marginTop: 22, borderRadius: llRadius.xl,
    shadowColor: '#6054BE', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 4,
  },
  rack: {
    borderRadius: llRadius.xl, paddingVertical: 16, paddingHorizontal: 14,
    alignItems: 'center', overflow: 'hidden',
  },
  tiles: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },

  tileCast: {
    borderRadius: llRadius.md,
    shadowColor: '#6054BE', shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  tile: {
    borderRadius: llRadius.md, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderBottomWidth: 5,
  },
  tileText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, lineHeight: 46 },

  socket: {
    borderRadius: llRadius.md, borderWidth: 3, borderStyle: 'dashed', borderColor: ll.pink,
    backgroundColor: withAlpha(ll.pink, 0.1), alignItems: 'center', justifyContent: 'center',
  },
  socketArmed: { borderColor: ll.pinkDeep, backgroundColor: withAlpha(ll.pink, 0.2) },
  socketMark: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: withAlpha(ll.pinkDeep, 0.6) },
  socketMarkArmed: { color: ll.pinkDeep },

  posLabel: {
    marginTop: 6, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 1.1, color: ll.pinkDeep,
  },
  posLabelDone: {
    marginTop: 6, fontFamily: 'Nunito_800ExtraBold', fontSize: 9,
    letterSpacing: 1.1, color: ll.greenDeep,
  },
  posSpacer: { height: 15 },

  blendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  blendText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: ll.body, letterSpacing: 1 },
  blendArrow: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: ll.muted },
  blendWord: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: ll.greenDeep },

  options: { flexDirection: 'row', gap: 14, marginTop: 24 },
  optionCast: {
    borderRadius: 50,
    shadowOpacity: 0.42, shadowRadius: 16, shadowOffset: { width: 0, height: 9 }, elevation: 6,
  },
  optionCastLifted: { shadowOpacity: 0.6, shadowRadius: 26, shadowOffset: { width: 0, height: 18 }, elevation: 11 },
  optionCastHint: { shadowColor: ll.amber, shadowOpacity: 0.7, shadowRadius: 20 },
  option: {
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 5, borderBottomColor: 'rgba(20,10,60,0.22)',
  },
  optionText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: ll.white,
    textShadowColor: 'rgba(20,10,60,0.28)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 },
  },
  optionKind: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 8, letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.85)', marginTop: -4,
  },
  hint: { borderWidth: 3, borderColor: ll.amber },
  trayHint: {
    marginTop: 12, fontFamily: 'Nunito_800ExtraBold', fontSize: 10,
    letterSpacing: 1.4, color: ll.pinkDeep, textTransform: 'uppercase', opacity: 0.7,
  },
});
