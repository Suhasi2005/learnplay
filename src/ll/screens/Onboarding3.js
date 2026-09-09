import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FACE, POSE, WORLD_ART } from '../art';
import { Dots, Floating, LLButton } from '../kit';
import { ll, llGradients, llRadius, llShadow, llType } from '../tokens';

// Onboarding 3 — "What should we play first?".
//
// Multi-select, and deliberately consequence-free: nothing here gates content,
// it only orders the home screen. Birdie's line changes with the count so the
// screen responds to the child rather than sitting inert.

const INTERESTS = [
  { id: 'numbers', name: 'Numbers', sub: 'Count & add', img: WORLD_ART.numbers, soft: '#E8F0FF', dot: ll.blue },
  { id: 'letters', name: 'Letters', sub: 'Sounds & words', img: WORLD_ART.library, soft: '#FFEBF3', dot: ll.pink },
  { id: 'nature', name: 'Nature', sub: 'Animals & plants', img: WORLD_ART.garden, soft: '#E4F6EC', dot: ll.green },
  { id: 'science', name: 'Science', sub: 'Try & discover', img: WORLD_ART.lab, soft: '#F3EFFC', dot: ll.purple },
  { id: 'stories', name: 'Stories', sub: 'Read together', img: WORLD_ART.castle, soft: '#FFF6E3', dot: ll.amber },
];

function line(n) {
  if (n === 0) return 'Pick whatever looks fun — you can always change your mind!';
  if (n === 1) return 'Great start! Pick more if you like, or head straight in.';
  if (n >= 4) return "Wow, you want to try everything. Birdie approves!";
  return `${n} picked — your home screen will show these first.`;
}

export default function Onboarding3({ navigation }) {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(() => new Set(['numbers']));

  function toggle(id) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <LinearGradient colors={llGradients.onb3} locations={[0, 0.5, 1]} style={styles.fill}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.head}>
          <Floating duration={4000} distance={5} rotate={1}>
            <Image source={FACE.miaExcited} style={styles.headFace} accessibilityLabel="Mia" />
          </Floating>
          <View style={styles.headText}>
            <Text style={styles.title}>What should we play first?</Text>
            <Text style={styles.sub}>Pick as many as you like</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {INTERESTS.map((it) => {
            const on = picked.has(it.id);
            return (
              <Pressable
                key={it.id}
                onPress={() => toggle(it.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${it.name}, ${it.sub}`}
                style={({ pressed }) => [
                  styles.tile,
                  on ? llShadow.card : llShadow.soft,
                  on && { transform: [{ scale: 1.015 }] },
                  pressed && { transform: [{ scale: 0.985 }] },
                ]}
              >
                <View style={[styles.tileArt, { backgroundColor: it.soft }]}>
                  <Image source={it.img} style={styles.tileImg} />
                  <View style={[styles.mark, { backgroundColor: on ? it.dot : 'rgba(255,255,255,0.85)' }]}>
                    <Text style={[styles.markText, { color: on ? ll.white : ll.muted }]}>{on ? '✓' : '+'}</Text>
                  </View>
                </View>
                <View style={styles.tileBody}>
                  <Text style={styles.tileName}>{it.name}</Text>
                  <Text style={styles.tileSub}>{it.sub}</Text>
                </View>
              </Pressable>
            );
          })}

          <View style={[styles.tile, styles.moreTile, llShadow.soft]}>
            <Text style={styles.moreTitle}>More later</Text>
            <Text style={styles.moreSub}>New worlds unlock as you grow</Text>
          </View>
        </View>

        <View style={styles.birdieBar}>
          <Image source={POSE.birdieCheer} style={styles.birdieFace} accessibilityLabel="Birdie" />
          <Text style={styles.birdieText}>{line(picked.size)}</Text>
        </View>

        <Dots count={3} index={2} active={ll.purpleMid} />
        <LLButton label="Enter the world" tone="purple" onPress={() => navigation.replace('LLHome')} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 16 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headFace: { width: 56, height: 56, borderRadius: 28 },
  headText: { flex: 1 },
  title: { ...llType.h3, color: ll.ink },
  sub: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, color: ll.body, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  tile: {
    width: '47.5%', borderRadius: llRadius.xl, overflow: 'hidden', backgroundColor: ll.white,
  },
  tileArt: { height: 96 },
  tileImg: { width: '100%', height: '100%' },
  mark: {
    position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3C2878', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  markText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, includeFontPadding: false },
  tileBody: { paddingHorizontal: 13, paddingTop: 11, paddingBottom: 14 },
  tileName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: ll.ink },
  tileSub: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: ll.body },

  moreTile: { justifyContent: 'center', padding: 14, gap: 4 },
  moreTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: ll.ink },
  moreSub: { fontFamily: 'Nunito_700Bold', fontSize: 11, lineHeight: 15, color: ll.body },

  birdieBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: ll.amberSoft, borderRadius: llRadius.lg, paddingVertical: 13, paddingHorizontal: 15,
  },
  birdieFace: { width: 44, height: 44, borderRadius: 22, flexShrink: 0 },
  birdieText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 12.5, lineHeight: 17.5, color: ll.amberInk },
});
